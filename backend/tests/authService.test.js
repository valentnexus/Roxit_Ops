const test = require('node:test');
const assert = require('node:assert/strict');

process.env.SPREADSHEET_ID = 'test-sheet';
process.env.SHEETS_CACHE_TTL_MS = '0';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { setSheetsClient } = require('../src/config/sheets');
const SCHEMA = require('../src/config/schema');
const { makeFakeClient } = require('./helpers/fakeSheets');
const authService = require('../src/services/authService');

function setup(users) {
  const fake = makeFakeClient({ Users: [SCHEMA.Users, ...users], AuditTrail: [SCHEMA.AuditTrail] });
  setSheetsClient(fake);
  require('../src/repositories/SheetRepository')._clearCaches();
  return fake;
}

const LEGACY = ['USR-0001', 'Alex PT', 'alex.pt@gmail.com', 'password123', 'Personal Trainer', 'Main Gym', '0812', 'false', ''];

test('login sukses dengan password plain lama, lalu password otomatis di-hash', async () => {
  const fake = setup([LEGACY]);
  const res = await authService.login('alex.pt@gmail.com', 'password123');
  assert.equal(res.success, true);
  assert.equal(res.user.name, 'Alex PT');
  assert.equal(jwt.verify(res.token, process.env.JWT_SECRET).userId, 'USR-0001');

  const stored = fake.db.Users[1][3];
  assert.ok(stored.startsWith('$2'), 'password harus sudah jadi hash bcrypt');
  assert.equal(await bcrypt.compare('password123', stored), true);
  assert.equal(fake.db.AuditTrail.at(-1)[2], 'Login'); // audit tercatat
});

test('login sukses dengan password bcrypt', async () => {
  const hashed = [...LEGACY]; hashed[3] = bcrypt.hashSync('rahasia', 4);
  setup([hashed]);
  assert.equal((await authService.login('alex.pt@gmail.com', 'rahasia')).success, true);
});

test('password salah / email tidak terdaftar => 401 dengan pesan sama', async () => {
  setup([LEGACY]);
  await assert.rejects(() => authService.login('alex.pt@gmail.com', 'salah'), { status: 401, message: 'Email atau password salah.' });
  await assert.rejects(() => authService.login('ghost@gmail.com', 'x'), { status: 401, message: 'Email atau password salah.' });
});

test('akun yang diarsipkan tidak bisa login', async () => {
  const archived = [...LEGACY]; archived[7] = 'true';
  setup([archived]);
  await assert.rejects(() => authService.login('alex.pt@gmail.com', 'password123'), { status: 403 });
});

test('email bukan @gmail.com ditolak', async () => {
  setup([LEGACY]);
  await assert.rejects(() => authService.login('alex@yahoo.com', 'x'), { status: 400 });
});
