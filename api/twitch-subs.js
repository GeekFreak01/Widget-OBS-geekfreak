const crypto = require('crypto');

let recentTwitchEvents = []; // временное хранилище на 10 событий

function isValidTwitchRequest(req) {
  const messageId = req.headers['twitch-eventsub-message-id'];
  const timestamp = req.headers['twitch-eventsub-message-timestamp'];
  const signature = req.headers['twitch-eventsub-message-signature'];
  const secret = process.env.TWITCH_WEBHOOK_SECRET;

  if (!messageId || !timestamp || !signature || !secret) return false;

  const hmacMessage = messageId + timestamp + JSON.stringify(req.body);
  const computedHmac = 'sha256=' + crypto.createHmac('sha256', secret).update(hmacMessage).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(computedHmac), Buffer.from(signature));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const body = req.body;

  // ✅ Twitch webhook verification challenge — ОБЯЗАТЕЛЬНО ДО проверки подписи
  if (body && body.challenge) {
    return res.status(200).send(body.challenge); // plain text, не JSON
  }

  // 🔒 Проверка подписи Twitch
  if (!isValidTwitchRequest(req)) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  // 📥 Обработка события
  if (body.subscription && body.event) {
    const { subscription, event } = body;
    let message = null;

    if (subscription.type === 'channel.subscribe') {
      const months = event.cumulative_months || 1;
      message = `${event.user_name} - (${months}) мес.`;
    } else if (subscription.type === 'channel.subscription.gift') {
      const count = event.total || 1;
      message = `${event.user_name} - (${count}) шт.`;
    }

    if (message) {
      recentTwitchEvents.unshift({
        username: event.user_name,
        message,
        timestamp: new Date().toISOString()
      });

      recentTwitchEvents = recentTwitchEvents.slice(0, 10);
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Invalid payload' });
};

// Для получения с фронта
module.exports.getEvents = () => recentTwitchEvents;
