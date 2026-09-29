const env = require('../config/env');
const AppError = require('../utils/AppError');

function notFound(req, _res, next) {
  next(new AppError(`Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}`, 404));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ success: false, message: err.message, ...err.extra });
  }
  console.error('[UNHANDLED]', err);
  return res.status(500).json({
    success: false,
    message: env.nodeEnv === 'production' ? 'Terjadi kesalahan pada server.' : String(err.message || err),
  });
}

module.exports = { notFound, errorHandler };
