const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middlewares/auth');
const ctrl = require('../controllers/authController');

// Batasi percobaan login (anti brute-force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan login. Coba lagi beberapa menit lagi.' },
});

router.post('/login', loginLimiter, ctrl.login);
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.me);
router.post('/change-password', authenticate, ctrl.changePassword);

module.exports = router;
