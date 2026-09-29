const { google } = require('googleapis');
const env = require('./env');

let client = null;

/** Client Google Sheets API (service account). Dibuat sekali lalu dipakai ulang. */
function getSheetsClient() {
  if (!client) {
    const auth = new google.auth.JWT({
      email: env.googleEmail,
      key: env.googlePrivateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    client = google.sheets({ version: 'v4', auth });
  }
  return client;
}

/** Dipakai untuk unit test (inject fake client). */
function setSheetsClient(fake) {
  client = fake;
}

module.exports = { getSheetsClient, setSheetsClient };
