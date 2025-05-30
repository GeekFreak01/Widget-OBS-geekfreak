const { getEvents: getTwitchEvents } = require('./twitch-subs');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  // Получаем события Twitch из памяти
  const twitch = getTwitchEvents();

  let donations = [];
  try {
    const r = await fetch(
      `${process.env.FEED_DONATION_URL || 'https://widget-obs-geekfreak.vercel.app'}/api/donations`
    );
    const json = await r.json();
    donations = json.data.map((d) => ({
      username: d.username,
      message: `${d.total.toFixed(2)} ${d.currency}`,
      type: 'donation'
    }));
  } catch (e) {
    console.error('❌ Donation fetch error:', e);
  }

  // Обработка Twitch событий с проверкой
  const twitchFormatted = [];
  try {
    for (const e of twitch) {
      if (e && e.username && e.message) {
        twitchFormatted.push({
          username: e.username,
          message: e.message,
          type: 'twitch'
        });
      }
    }
  } catch (e) {
    console.error('❌ Twitch formatting error:', e);
  }

  // Объединение всех событий
  const all = [...donations, ...twitchFormatted];
  all.sort(() => Math.random() - 0.5); // перемешаем

  // Возвращаем результат с дебагом
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    data: all,
    twitchDebug: twitchFormatted
  });
};
