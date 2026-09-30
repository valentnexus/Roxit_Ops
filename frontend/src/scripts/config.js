// Alamat backend API. Ganti sesuai environment.
window.ROXIT_CONFIG = {
  API_BASE_URL:
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:3000/api'
      : 'https://roxit-ops-backend.vercel.app/api',
};
