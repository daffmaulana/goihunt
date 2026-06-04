import axios from 'axios';

const api = axios.create({
  baseURL: 
  // import.meta.env.VITE_API_URL,
  'http://192.168.1.7:3000',
  // 'http://172.25.20.82:3000',
  withCredentials: true
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`[Request] Sending to ${config.url} with token: ${token.substring(0, 10)}...`);
  } else {
    console.warn(`[Request] Sending to ${config.url} WITHOUT token`);
  }
  return config;
});

api.interceptors.response.use(
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
      '/auth/reset-password'
    ];

    // Jika token expired, langsung logout tanpa mencoba refresh
    if (
      err.response?.status === 401 &&
      !authEndpoints.some(path => originalRequest.url.includes(path))
    ) {
      console.log("%c[Auth] Access Token expired. Logging out...");
      localStorage.removeItem('accessToken');
      window.location.href = '/auth';
    }

    return Promise.reject(err);
  }
);

export default api;