module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const body = req.body;

  if (body.subscription && body.event) {
    const event = body.event;

    let display = '';

    if (body.subscription.type === 'channel.subscribe') {
      const months = event.cumulative_months || 1;
      display = `${event.user_name} - (${months}) мес.`;
    } else if (body.subscription.type === 'channel.subscription.gift') {
      const count = event.total || 1;
      display = `${event.user_name} - (${count}) шт.`;
    }

    // Сохраняем или передаём дальше
    console.log('[TWITCH SUB]', display);

    // ты можешь пушить это в Redis, базу или временный массив
    return res.status(200).json({ ok: true, display });
  }

  return res.status(400).json({ error: 'Invalid Twitch event format' });
};
