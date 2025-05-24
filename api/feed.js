const { getEvents: getTwitchEvents } = require('./twitch-subs');

module.exports = async (req, res) => {
  const twitch = getTwitchEvents();

  let donations = [];
  try {
    const r = await fetch(`${process.env.FEED_DONATION_URL || 'https://widget-obs-geekfreak.vercel.app'}/api/donations`);
    const json = await r.json();
    donations = json.data.map(d => ({
      username: d.username,
      message: `${d.total.toFixed(2)} ${d.currency}`,
      type: 'donation'
    }));
  } catch (e) {
    console.error('Donation fetch error:', e);
  }

  const twitchFormatted = twitch.map(e => ({
    username: e.username,
    message: e.message,
    type: 'twitch'
  }));

  const all = [...donations, ...twitchFormatted];

  // перемешаем для динамики (можно сортировать по времени, если надо)
  all.sort(() => Math.random() - 0.5);

  res.status(200).json({ data: all });
};
