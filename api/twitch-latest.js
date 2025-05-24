const { getEvents } = require('./twitch-subs');

module.exports = (req, res) => {
  const events = getEvents();
  res.status(200).json({ data: events });
};
