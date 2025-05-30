const crypto = require('crypto');

let recentTwitchEvents = [];

// HMAC проверка подлинности от Twitch
function isValidTwitchRequest(req, rawBody) {
  const messageId = req.headers['twitch-eventsub-message-id'];
  const timestamp = req.headers['twitch-eventsub-message-timestamp'];
  const signature = req.headers['twitch-eventsub-message-signature'];
  const secret = process.env.TWITCH_WEBHOOK_SECRET;

  if (!messageId || !timestamp || !signature || !secret) return false;

  const hmacMessage = messageId + timestamp + rawBody;
  const computedHmac = 'sha256=' + crypto.createHmac('sha256', secret).update(hmacMessage).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(computedHmac), Buffer.from(signature));
}

// Отключаем автоматический bodyParser — нужно Vercel сказать не парсить JSON
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  // Получаем "сырое" тело запроса
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks).toString('utf8');

  // Пробуем распарсить JSON
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // ⚠️ Верификация challenge ОБЯЗАТЕЛЬНА до подписи
  if (body && body.challenge) {
    console.log('⚡ Twitch Challenge Verification:', body.challenge);
    return res.status(200).send(body.challenge);
  }

  // Подпись Twitch
  if (!isValidTwitchRequest(req, rawBody)) {
    console.warn('❌ Invalid Twitch Signature');
    return res.status(403).json({ error: 'Invalid signature' });
  }

  // Twitch событие
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

// Экспортируем события
module.exports.getEvents = () => recentTwitchEvents;
