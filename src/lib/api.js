import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    Accept: 'application/json',
  },
});

// Sisipkan token otomatis di setiap request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Tangani jika token tidak valid / expired (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper untuk mengambil URL gambar dari Laravel Storage
export function getStorageUrl(path, fallback = 'https://placehold.co/800x450?text=Eventory') {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  return `${process.env.NEXT_PUBLIC_STORAGE_URL}/${path}`;
}

export default api;