// api.js
import axios from 'axios';

const createApiInstance = (tokenType = 'accessToken') => {
  const instance = axios.create({
    baseURL: 
  import.meta.env.VITE_API_URL,
  // 'http://192.168.1.11:3000',
  // 'http://172.25.20.82:3000',
    withCredentials: true
  });

  instance.interceptors.request.use(config => {
    const token = localStorage.getItem(tokenType);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[Request] Sending to ${config.url} with ${tokenType}: ${token.substring(0, 10)}...`);
    } else {
      console.warn(`[Request] Sending to ${config.url} WITHOUT token`);
    }
    return config;
  });

  instance.interceptors.response.use(
    res => {
      console.log(`[Response Success] From ${res.config.url}`);
      return res;
    },
    async err => {
      const originalRequest = err.config;
      console.error(`[Response Error] Status: ${err.response?.status} | URL: ${originalRequest.url}`);

      const authEndpoints = [
        '/auth/login',
        '/auth/register',
        '/auth/forgot-password',
        '/auth/reset-password',
        '/auth/admin-login'
      ];

      if (
        err.response?.status === 401 &&
        !authEndpoints.some(path => originalRequest.url.includes(path))
      ) {
        console.log(`[Auth] ${tokenType} expired. Logging out...`);
        localStorage.removeItem(tokenType);
        window.location.href = '/auth';
      }

      return Promise.reject(err);
    }
  );

  return instance;
};

export const api = createApiInstance('accessToken');
export const adminApi = createApiInstance('adminToken');