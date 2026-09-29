/** Error yang aman ditampilkan ke client (punya HTTP status + pesan). */
class AppError extends Error {
  constructor(message, status = 400, extra = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.extra = extra;
  }
}

module.exports = AppError;
