const test = require('node:test');
const assert = require('node:assert/strict');

process.env.SPREADSHEET_ID = 'test-sheet';
process.env.SHEETS_CACHE_TTL_MS = '0';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123';

const { setSheetsClient } = require('../src/config/sheets');
const SCHEMA = require('../src/config/schema');
const { makeFakeClient } = require('./helpers/fakeSheets');
const configService = require('../src/services/configService');
const auditService = require('../src/services/auditService');

function setup(extra = {}) {
  const fake = makeFakeClient({
    Config: [SCHEMA.Config],
    AuditTrail: [SCHEMA.AuditTrail],
    ...extra,
  });
  setSheetsClient(fake);
  require('../src/repositories/SheetRepository')._clearCaches();
  return fake;
}

test('configService.convertDriveUrlToDirect: berbagai format link Drive', () => {
  assert.equal(
    configService.convertDriveUrlToDirect('https://drive.google.com/file/d/ABC123/view'),
    'https://lh3.googleusercontent.com/d/ABC123',
  );
  assert.equal(
    configService.convertDriveUrlToDirect('https://drive.google.com/open?id=XYZ789'),
    'https://lh3.googleusercontent.com/d/XYZ789',
  );
  assert.equal(configService.convertDriveUrlToDirect('https://example.com/logo.png'), 'https://example.com/logo.png');
  assert.equal(configService.convertDriveUrlToDirect(''), '');
});

test('configService.getConfig: key jadi lowercase, URL Drive dikonversi', async () => {
  setup({
    Config: [SCHEMA.Config, ['Logo', 'https://drive.google.com/file/d/ABC123/view']],
  });
  const res = await configService.getConfig();
  assert.equal(res.config.logo, 'https://lh3.googleusercontent.com/d/ABC123');
});

test('auditService.list: 50 entri terbaru, urutan terbalik (terbaru dulu)', async () => {
  const rows = [SCHEMA.AuditTrail];
  for (let i = 1; i <= 55; i++) rows.push([`ts-${i}`, 'User', 'Action', `entry-${i}`]);
  setup({ AuditTrail: rows });

  const res = await auditService.list();
  assert.equal(res.data.length, 50);
  assert.equal(res.data[0].details, 'entry-55'); // paling baru di depan
  assert.equal(res.data[49].details, 'entry-6');
});
