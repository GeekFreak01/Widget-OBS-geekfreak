// api/token-manager.js
const fetch = require('node-fetch');

class TokenManager {
  constructor() {
    // Получаем данные из переменных окружения
    this.clientId = process.env.DONATION_ALERTS_CLIENT_ID;
    this.clientSecret = process.env.DONATION_ALERTS_CLIENT_SECRET;
    this.refreshToken = process.env.DONATION_ALERTS_REFRESH_TOKEN;
    
    // Кэш для токена
    this.tokenCache = {
      accessToken: null,
      expiresAt: null
    };
  }

  /**
   * Проверяет, истек ли токен
   * @returns {boolean}
   */
  isTokenExpired() {
    if (!this.tokenCache.accessToken || !this.tokenCache.expiresAt) {
      return true;
    }
    
    // Проверяем с запасом в 5 минут
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return now >= (this.tokenCache.expiresAt - fiveMinutes);
  }

  /**
   * Обновляет access token используя refresh token
   * @returns {Promise<string>}
   */
  async refreshAccessToken() {
    if (!this.refreshToken || !this.clientId || !this.clientSecret) {
      throw new Error('Missing required credentials for token refresh');
    }

    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'oauth-donation-index oauth-user-show'
      });

      const response = await fetch('https://www.donationalerts.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token refresh failed: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      
      // Сохраняем новый токен в кэш
      this.tokenCache.accessToken = data.access_token;
      this.tokenCache.expiresAt = Date.now() + (data.expires_in * 1000);
      
      // Если получили новый refresh token, обновляем его
      if (data.refresh_token) {
        this.refreshToken = data.refresh_token;
        // Важно: в продакшене нужно сохранить новый refresh token
        console.log('New refresh token received. Update your environment variable!');
      }

      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Получает действующий access token
   * @returns {Promise<string>}
   */
  async getValidToken() {
    // Если токен есть и не истек, возвращаем его
    if (!this.isTokenExpired()) {
      return this.tokenCache.accessToken;
    }

    // Иначе обновляем токен
    return await this.refreshAccessToken();
  }

  /**
   * Выполняет API запрос с автоматическим обновлением токена
   * @param {string} url - URL для запроса
   * @param {Object} options - Опции для fetch
   * @returns {Promise<Response>}
   */
  async authenticatedFetch(url, options = {}) {
    try {
      // Получаем действующий токен
      const token = await this.getValidToken();
      
      // Добавляем заголовок авторизации
      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };

      // Выполняем запрос
      const response = await fetch(url, { ...options, headers });

      // Если получили 401, пробуем обновить токен и повторить запрос
      if (response.status === 401) {
        console.log('Token expired, refreshing...');
        const newToken = await this.refreshAccessToken();
        
        headers.Authorization = `Bearer ${newToken}`;
        return await fetch(url, { ...options, headers });
      }

      return response;
    } catch (error) {
      console.error('Authenticated fetch error:', error);
      throw error;
    }
  }
}

// Создаем единственный экземпляр для всего приложения
const tokenManager = new TokenManager();

module.exports = tokenManager;
