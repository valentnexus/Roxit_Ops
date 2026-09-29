const test = require('node:test');
const assert = require('node:assert/strict');

process.env.SPREADSHEET_ID = 'test-sheet';
process.env.SHEETS_CACHE_TTL_MS = '0';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123';

const bcrypt = require('bcryptjs');
const { setSheetsClient } = require('../src/config/sheets');
const SCHEMA = require('../src/config/schema');
const { makeFakeClient } = require('./helpers/fakeSheets');
const authService = require('../src/services/authService');

function setup() {
  const fake = makeFakeClient({
    Users: [SCHEMA.Users, ['USR-0001', 'Alex PT', 'alex.pt@gmail.com', bcrypt.hashSync('lama123', 4), 'Personal Trainer', 'Main Gym', '0812', 'false', '']],
    AuditTrail: [SCHEMA.AuditTrail],
  });
  setSheetsClient(fake);
  require('../src/repositories/SheetRepository')._clearCaches();
  return fake;
}

const USER = { userId: 'USR-0001', name: 'Alex PT' };

test('changePassword sukses: password lama benar', async () => {
  const fake = setup();
  const res = await authService.changePassword(USER, 'lama123', 'baru123');
  assert.equal(res.success, true);
  assert.equal(await bcrypt.compare('baru123', fake.db.Users[1][3]), true);
});

test('changePassword gagal: password lama salah', async () => {
  setup();
  await assert.rejects(() => authService.changePassword(USER, 'salah', 'baru123'), { status: 400 });
});

test('changePassword gagal: password baru kurang dari 6 karakter', async () => {
  setup();
  await assert.rejects(() => authService.changePassword(USER, 'lama123', 'abc'), { status: 400 });
});
