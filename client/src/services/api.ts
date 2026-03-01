import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  // וודא שב-Render ה-VITE_API_URL מעודכן לכתובת ה-ngrok הקבועה שלך
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api', 
  timeout: 15000,
  headers: { 
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'שגיאה בלתי צפויה';

    if (status === 401) {
      localStorage.removeItem('admin_token');
      if (window.location.pathname.startsWith('/admin') && 
          window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }

    // מניעת הודעות שגיאה כפולות במקרים ספציפיים
    if (status !== 409 && status !== 404) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;