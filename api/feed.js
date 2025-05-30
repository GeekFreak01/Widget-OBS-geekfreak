const { getEvents: getTwitchEvents } = require('./twitch-subs');
const { fetchInitialSubscribers } = require('./twitch-helix');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  // 🎯 Получаем события Twitch из памяти
  const twitchMemory = getTwitchEvents();

  // 📡 Получаем текущих подписчиков из Twitch Helix API
  let twitchHelix = [];
  try {
    twitchHelix = await fetchInitialSubscribers();
  } catch (e) {
    console.error('❌ Helix fetch error:', e);
  }

  // 💰 Получаем донаты
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

  // 📦 Объединение всех Twitch событий
  const twitchFormatted = [];

  for (const e of [...twitchMemory, ...twitchHelix]) {
    if (e && e.username && e.message) {
      twitchFormatted.push({
        username: e.username,
        message: e.message,
        type: 'twitch'
      });
    }
  }

  // 🎛 Объединяем все источники
  const all = [...donations, ...twitchFormatted];
  all.sort(() => Math.random() - 0.5); // перемешка

  // 📤 Ответ
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    data: all,
    twitchDebug: twitchFormatted
  });
};
