const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123';
process.env.SPREADSHEET_ID = 'x';
process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'x@x.iam.gserviceaccount.com';
process.env.GOOGLE_PRIVATE_KEY = 'x';
process.env.SHEETS_CACHE_TTL_MS = '0';

const jwt = require('jsonwebtoken');
const { setSheetsClient } = require('../src/config/sheets');
const SCHEMA = require('../src/config/schema');
const { makeFakeClient } = require('./helpers/fakeSheets');

// /api/config PUBLIC beneran memanggil service (bukan cuma dicek middleware auth seperti route lain
// di file ini), jadi butuh Sheets palsu juga supaya tidak coba connect ke Google beneran.
setSheetsClient(makeFakeClient({ Config: [SCHEMA.Config], AuditTrail: [SCHEMA.AuditTrail] }));
require('../src/repositories/SheetRepository')._clearCaches();

const app = require('../src/app');

let server; let base;
test.before(async () => {
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

test('GET /api/health tanpa token => 200', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'ok');
});

test('GET /api/config tanpa token => 200 (PUBLIC, dipakai halaman login)', async () => {
  const res = await fetch(`${base}/api/config`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).success, true);
});

test('GET /api/audit-trail butuh token', async () => {
  const res = await fetch(`${base}/api/audit-trail`);
  assert.equal(res.status, 401);
});


test('route terproteksi tanpa token => 401 + sessionExpired', async () => {
  const res = await fetch(`${base}/api/clubs`);
  const body = await res.json();
  assert.equal(res.status, 401);
  assert.equal(body.sessionExpired, true);
});

test('token palsu => 401', async () => {
  const res = await fetch(`${base}/api/clubs`, { headers: { Authorization: 'Bearer abc.def.ghi' } });
  assert.equal(res.status, 401);
});

test('GET /api/auth/me dengan token valid => 200', async () => {
  const token = jwt.sign({ userId: 'U1', name: 'Tes' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const res = await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.user.name, 'Tes');
});

test('login: email non-gmail ditolak 400 (tanpa menyentuh Sheets)', async () => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'a@yahoo.com', password: 'x' }),
  });
  assert.equal(res.status, 400);
});

test('endpoint tidak dikenal: tanpa token => 401, dengan token => 404 JSON', async () => {
  const noToken = await fetch(`${base}/api/nope`);
  assert.equal(noToken.status, 401);

  const token = jwt.sign({ userId: 'U1', name: 'Tes' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const res = await fetch(`${base}/api/nope`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(res.status, 404);
  assert.equal((await res.json()).success, false);
});

test('rute Role/SessionType/Users terpasang dan butuh token (401 tanpa token)', async () => {
  const paths = ['/api/roles', '/api/session-types', '/api/users', '/api/roles/Admin/permissions',
    '/api/manual-cutting', '/api/time-in-out', '/api/time-in-out/summary', '/api/personal-training', '/api/group-training', '/api/manual-group',
    '/api/approvals', '/api/approvals/recent', '/api/approvals/history/x', '/api/dashboard/stats', '/api/dashboard/widgets'];
  for (const p of paths) {
    const res = await fetch(`${base}${p}`);
    assert.equal(res.status, 401, `${p} harus 401 tanpa token`);
  }
});
