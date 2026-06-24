import axios from 'axios';

// In dev, Vite proxies /api → localhost:3001.
// In production, set VITE_API_URL to your backend Vercel URL.
const client = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || '/api',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
