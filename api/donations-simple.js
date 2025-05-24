// api/donations-simple.js
// Упрощенная версия для использования с готовым access token

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Настройка CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Получаем токен из переменной окружения
  const accessToken = process.env.DONATIONALERTS_ACCESS_TOKEN;
  
  if (!accessToken) {
    res.status(500).json({ error: 'Access token not configured' });
    return;
  }

  try {
    const response = await fetch('https://www.donationalerts.com/api/v1/alerts/donations', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
};
