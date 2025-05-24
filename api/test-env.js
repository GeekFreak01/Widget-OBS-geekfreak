// api/test-env.js
// Тестовая функция для проверки переменных окружения

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const hasToken = !!process.env.DONATIONALERTS_ACCESS_TOKEN;
  const tokenLength = process.env.DONATIONALERTS_ACCESS_TOKEN ? 
    process.env.DONATION_ALERTS_ACCESS_TOKEN.length : 0;
  
  res.status(200).json({
    status: 'ok',
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      VERCEL: process.env.VERCEL || 'not set',
      VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
    },
    donationAlerts: {
      hasAccessToken: hasToken,
      tokenLength: tokenLength,
      tokenPreview: hasToken ? 
        `${process.env.DONATIONALERTS_ACCESS_TOKEN.substring(0, 10)}...` : 
        'not set'
    },
    timestamp: new Date().toISOString()
  });
};
