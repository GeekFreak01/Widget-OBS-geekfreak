const fetch = require('node-fetch');

function getTwoWeeksAgoMonday() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() + diffToMonday);
  thisMonday.setHours(0, 0, 0, 0);

  const twoWeeksAgo = new Date(thisMonday);
  twoWeeksAgo.setDate(thisMonday.getDate() - 14);
  return twoWeeksAgo;
}

module.exports = async (req, res) => {
  const accessToken = process.env.DONATIONALERTS_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({ error: 'Access token not found in env' });
  }

  try {
    const apiRes = await fetch('https://www.donationalerts.com/api/v1/alerts/donations', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const json = await apiRes.json();
    const donations = json.data || [];
    const since = getTwoWeeksAgoMonday();

    const aggregated = {};

    for (const donation of donations) {
      const date = new Date(donation.created_at);
      if (date < since || donation.is_shown !== 1) continue;

      const key = donation.username; // <== строгое сравнение

      if (!aggregated[key]) {
        aggregated[key] = {
          username: donation.username,
          total: 0,
          currency: donation.currency
        };
      }

      aggregated[key].total += parseFloat(donation.amount);
    }

    const result = Object.values(aggregated).sort((a, b) => b.total - a.total);
    res.status(200).json({ data: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch donations', message: err.message });
  }
};
