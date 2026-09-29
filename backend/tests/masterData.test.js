const test = require('node:test');
const assert = require('node:assert/strict');

process.env.SPREADSHEET_ID = 'test-sheet';
process.env.SHEETS_CACHE_TTL_MS = '0';

const bcrypt = require('bcryptjs');
const { setSheetsClient } = require('../src/config/sheets');
const SCHEMA = require('../src/config/schema');
const { makeFakeClient } = require('./helpers/fakeSheets');

const roleService = require('../src/services/roleService');
const permissionService = require('../src/services/permissionService');
const sessionTypeService = require('../src/services/sessionTypeService');
const userService = require('../src/services/userService');

function setup(extra = {}) {
  const fake = makeFakeClient({
    Role: [SCHEMA.Role, ['ROLE-0001', 'Admin', 'Administrative access', '2026-01-01']],
    SessionType: [SCHEMA.SessionType, ['SES-0001', 'Cardio', 'Latihan kardio', '2026-01-01']],
    Users: [SCHEMA.Users, ['USR-0001', 'Alex PT', 'alex.pt@gmail.com', bcrypt.hashSync('password123', 4), 'Personal Trainer', 'Main Gym', '0812', 'false', '']],
    AuditTrail: [SCHEMA.AuditTrail],
    Permission: [
      SCHEMA.Permission,
      ['Admin', 'Dashboard', 'true', '', '', '', ''],
      ['Admin', 'Report', 'true', '', '', '', 'true'],
      ['Super Admin', 'Dashboard', 'true', '', '', '', ''],
    ],
    ...extra,
  });
  setSheetsClient(fake);
  require('../src/repositories/SheetRepository')._clearCaches();
  return fake;
}

// ---------- Role ----------
test('roleService.save: tambah role baru dengan ID berurutan', async () => {
  const fake = setup();
  const res = await roleService.save({ roleName: 'Kasir', description: 'Front desk' }, 'Tester');
  assert.equal(res.success, true);
  assert.deepEqual(fake.db.Role.at(-1).slice(0, 3), ['ROLE-0002', 'Kasir', 'Front desk']);
});

test('roleService.remove: role tidak ada => 404', async () => {
  setup();
  await assert.rejects(() => roleService.remove('ROLE-9999', 'Tester'), { status: 404 });
});

// ---------- Permission (kunci ganda RoleName+Module) ----------
test('permissionService.saveMatrix: hanya module yang dikirim & bukan N/A yang berubah', async () => {
  const fake = setup();
  await permissionService.saveMatrix('Admin', [
    { Module: 'Dashboard', View: false },   // View diizinkan (bukan N/A) -> ikut berubah
    { Module: 'Report', View: true, Add: true }, // Add N/A di sheet -> harus diabaikan
  ], 'Tester');

  const rows = fake.db.Permission;
  assert.equal(rows[1][2], 'false'); // Admin/Dashboard/View
  assert.equal(rows[2][2], 'true');  // Admin/Report/View
  assert.equal(rows[2][3], '');      // Admin/Report/Add tetap N/A, tidak ditulis 'true'
  assert.equal(rows[3][2], 'true');  // Super Admin/Dashboard tidak tersentuh (role beda)
});

test('permissionService.saveMatrix: role Super Admin ditolak', async () => {
  setup();
  await assert.rejects(() => permissionService.saveMatrix('Super Admin', [], 'Tester'), { status: 403 });
});

test('permissionService.getMatrix: cell kosong jadi null, bukan false', async () => {
  setup();
  const res = await permissionService.getMatrix('Admin');
  const dash = res.rows.find((r) => r.Module === 'Dashboard');
  assert.equal(dash.View, true);
  assert.equal(dash.Add, null);
});

// ---------- SessionType ----------
test('sessionTypeService: tambah lalu hapus', async () => {
  const fake = setup();
  await sessionTypeService.save({ sessionName: 'Yoga', description: 'Peregangan' }, 'Tester');
  assert.equal(fake.db.SessionType.length, 3);
  await sessionTypeService.remove('SES-0001', 'Tester');
  assert.equal(fake.db.SessionType.length, 2);
});

// ---------- Users ----------
test('userService.list: password TIDAK PERNAH ikut terkirim ke client', async () => {
  setup();
  const res = await userService.list();
  assert.equal(res.users[0].Password, undefined);
  assert.equal(res.users[0].IsArchived, false); // sudah jadi boolean, bukan string 'false'
});

test('userService.save (tambah baru): password di-hash, bukan disimpan plain', async () => {
  const fake = setup();
  await userService.save({ name: 'Budi', email: 'budi@gmail.com', password: 'rahasia123', role: 'Admin', club: 'Main Gym', phone: '0899' }, 'Tester');
  const row = fake.db.Users.at(-1);
  assert.equal(row[1], 'Budi');
  assert.notEqual(row[3], 'rahasia123');
  assert.ok(row[3].startsWith('$2'));
  assert.equal(row[7], 'false'); // IsArchived default
});

test('userService.save (edit tanpa isi password): password lama tidak berubah', async () => {
  const fake = setup();
  const before = fake.db.Users[1][3];
  await userService.save({ userId: 'USR-0001', name: 'Alex PT Updated', email: 'alex.pt@gmail.com', role: 'Personal Trainer', club: 'Main Gym', phone: '0812' }, 'Tester');
  assert.equal(fake.db.Users[1][3], before);
  assert.equal(fake.db.Users[1][1], 'Alex PT Updated');
});

test('userService.archive lalu restore mengubah IsArchived, bukan menghapus baris', async () => {
  const fake = setup();
  await userService.archive('USR-0001', 'Tester');
  assert.equal(fake.db.Users[1][7], 'true');
  assert.equal(fake.db.Users.length, 2); // baris tidak terhapus
  await userService.restore('USR-0001', 'Tester');
  assert.equal(fake.db.Users[1][7], 'false');
});

test('userService.activities: hanya milik staff itu, terbaru dulu, maks 50', async () => {
  setup({
    AuditTrail: [
      SCHEMA.AuditTrail,
      ['1', 'Alex PT', 'Login', 'a'],
      ['2', 'Siti PT', 'Login', 'b'],
      ['3', 'Alex PT', 'Logout', 'c'],
    ],
  });
  const res = await userService.activities('Alex PT');
  assert.equal(res.data.length, 2);
  assert.equal(res.data[0].action, 'Logout'); // terbaru dulu
});
