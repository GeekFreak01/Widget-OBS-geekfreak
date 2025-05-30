const fetch = require('node-fetch');

module.exports.fetchInitialSubscribers = async () => {
  try {
    const res = await fetch('https://api.twitch.tv/helix/subscriptions?broadcaster_id=408557944', {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${process.env.TWITCH_ACCESS_TOKEN}`
      }
    });

    const json = await res.json();
    if (!json.data) return [];

    return json.data.map(sub => ({
      username: sub.user_name,
      message: ' ',
      type: 'twitch'
    }));
  } catch (e) {
    console.error('❌ fetchInitialSubscribers error:', e);
    return [];
  }
};
