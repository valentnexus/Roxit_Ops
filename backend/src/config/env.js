require('dotenv').config({ quiet: true });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: (process.env.CORS_ORIGIN || '*').split(',').map((s) => s.trim()),

  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '6h', // sama seperti SESSION_DURATION_SECONDS di code.gs

  spreadsheetId: process.env.SPREADSHEET_ID || '',
  googleEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
  // Di file .env, newline pada private key ditulis sebagai \n literal
  googlePrivateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),

  // Cache baca sheet (ms). Mengurangi risiko kena rate limit Sheets API.
  cacheTtlMs: parseInt(process.env.SHEETS_CACHE_TTL_MS || '3000', 10),

  timezone: 'Asia/Jakarta',
};

const REQUIRED = {
  SPREADSHEET_ID: 'spreadsheetId',
  GOOGLE_SERVICE_ACCOUNT_EMAIL: 'googleEmail',
  GOOGLE_PRIVATE_KEY: 'googlePrivateKey',
  JWT_SECRET: 'jwtSecret',
};

env.assertConfig = function assertConfig() {
  const missing = Object.entries(REQUIRED)
    .filter(([, key]) => !env[key])
    .map(([name]) => name);
  if (missing.length) {
    throw new Error(`Environment variable belum diisi: ${missing.join(', ')} (lihat .env.example)`);
  }
  if (env.nodeEnv === 'production' && env.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET di production minimal 32 karakter.');
  }
};

module.exports = env;
