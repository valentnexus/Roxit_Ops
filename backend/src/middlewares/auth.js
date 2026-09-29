const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

const EXPIRED_MSG = 'Sesi Anda telah berakhir. Silakan login ulang.';

/**
 * Pengganti validateSession() + PUBLIC_API_FUNCTIONS di code.gs.
 * Semua route selain login/config publik harus lewat middleware ini.
 * Token dikirim client lewat header:  Authorization: Bearer <token>
 */
function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new AppError(EXPIRED_MSG, 401, { sessionExpired: true }));

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    return next();
  } catch (_err) {
    return next(new AppError(EXPIRED_MSG, 401, { sessionExpired: true }));
  }
}

module.exports = { authenticate };
