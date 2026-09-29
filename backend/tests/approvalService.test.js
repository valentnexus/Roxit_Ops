const test = require('node:test');
const assert = require('node:assert/strict');

process.env.SPREADSHEET_ID = 'test-sheet';
process.env.SHEETS_CACHE_TTL_MS = '0';

const { setSheetsClient } = require('../src/config/sheets');
const SCHEMA = require('../src/config/schema');
const { makeFakeClient } = require('./helpers/fakeSheets');

function setup(extra = {}) {
  const fake = makeFakeClient({
    PersonalTrainingLog: [SCHEMA.PersonalTrainingLog],
    GroupTrainingLog: [SCHEMA.GroupTrainingLog],
    ManualGroupLog: [SCHEMA.ManualGroupLog],
    TimeInOut: [SCHEMA.TimeInOut],
    AuditTrail: [SCHEMA.AuditTrail],
    ...extra,
  });
  setSheetsClient(fake);
  require('../src/repositories/SheetRepository')._clearCaches();
  // approvalService membaca `repos` sekali saat modul di-require & menyimpan referensi repo per config;
  // repo instance-nya sendiri tidak berubah (hanya cache datanya), jadi aman di-require ulang tiap test run.
  delete require.cache[require.resolve('../src/services/approvalService')];
  return { fake, approvalService: require('../src/services/approvalService') };
}

const PT_ROW = ['PT.260929.01', 'Main Gym', 'Alex PT', 'John Doe', '2026-09-29', 'Strength', '10:00', '11:00', 'Bench: Set1(40kg,10)', 'Pending', '', '29/09/2026 09:00:00', '1', 'false'];
const TIO_ROW = ['TIO.260929.01', 'Alex PT', 'John Doe', 'Time In', 'Pending', '', '29/09/2026 08:00:00', '1', 'false'];
const MG_ROW = ['MG.260929.01', 'Main Gym', 'Roni', 'Jane, Jack', '2026-09-30', '10:00', 'Pending', '', '29/09/2026 09:30:00', '1', 'false'];

test('approvalService.list: gabungan 4 sheet, non-archived saja, urut terbaru dulu', async () => {
  const { approvalService } = setup({
    PersonalTrainingLog: [SCHEMA.PersonalTrainingLog, PT_ROW],
    TimeInOut: [SCHEMA.TimeInOut, TIO_ROW],
  });
  const res = await approvalService.list();
  assert.equal(res.records.length, 2);
  assert.equal(res.records[0].LogID, 'PT.260929.01'); // 09:00 > 08:00, jadi lebih dulu
  assert.equal(res.records[0].Type, 'PT');
  assert.equal(res.records[0].Staff, 'Alex PT');
  assert.equal(res.records[0].Detail, '2026-09-29 | 10:00 - 11:00 | Strength | Main Gym');
});

test('approvalService.list: record archived tidak ikut muncul', async () => {
  const archivedRow = [...PT_ROW]; archivedRow[13] = 'true';
  const { approvalService } = setup({ PersonalTrainingLog: [SCHEMA.PersonalTrainingLog, archivedRow] });
  const res = await approvalService.list();
  assert.equal(res.records.length, 0);
});

test('approvalService.list: format Detail Manual Group beda dari PT/GT', async () => {
  const { approvalService } = setup({ ManualGroupLog: [SCHEMA.ManualGroupLog, MG_ROW] });
  const res = await approvalService.list();
  assert.equal(res.records[0].Detail, '2026-09-30 10:00 | Main Gym');
  assert.equal(res.records[0].Member, 'Jane, Jack');
});

test('approvalService.process: Pending -> Success, ditolak kalau bukan Pending', async () => {
  const { fake, approvalService } = setup({ PersonalTrainingLog: [SCHEMA.PersonalTrainingLog, PT_ROW] });

  const res = await approvalService.process({ type: 'PT', logId: 'PT.260929.01', status: 'Success', notes: 'ok' }, 'Admin');
  assert.equal(res.success, true);
  assert.equal(fake.db.PersonalTrainingLog[1][9], 'Success');
  assert.equal(fake.db.PersonalTrainingLog[1][10], 'ok');
  assert.equal(fake.db.AuditTrail.at(-1)[2], 'Approve Personal Training');

  await assert.rejects(
    () => approvalService.process({ type: 'PT', logId: 'PT.260929.01', status: 'Rejected' }, 'Admin'),
    { status: 400 },
  );
});

test('approvalService.process: record archived => ditolak', async () => {
  const archivedRow = [...TIO_ROW]; archivedRow[8] = 'true';
  const { approvalService } = setup({ TimeInOut: [SCHEMA.TimeInOut, archivedRow] });
  await assert.rejects(
    () => approvalService.process({ type: 'TIO', logId: 'TIO.260929.01', status: 'Success' }, 'Admin'),
    { status: 400 },
  );
});

test('approvalService.process: type tidak dikenal / record tidak ada', async () => {
  const { approvalService } = setup({ TimeInOut: [SCHEMA.TimeInOut, TIO_ROW] });
  await assert.rejects(() => approvalService.process({ type: 'XX', logId: 'TIO.260929.01', status: 'Success' }, 'Admin'), { status: 400 });
  await assert.rejects(() => approvalService.process({ type: 'TIO', logId: 'NOPE', status: 'Success' }, 'Admin'), { status: 404 });
});

test('approvalService.recentProcessed: ambil waktu proses dari AuditTrail, bukan CreatedDate', async () => {
  const processedRow = [...PT_ROW]; processedRow[9] = 'Success';
  const { approvalService } = setup({
    PersonalTrainingLog: [SCHEMA.PersonalTrainingLog, processedRow],
    AuditTrail: [SCHEMA.AuditTrail, ['30/09/2026 14:00:00', 'Admin', 'Approve Personal Training', 'LogID: PT.260929.01 | Notes: ok']],
  });
  const res = await approvalService.recentProcessed(20);
  assert.equal(res.records.length, 1);
  assert.equal(res.records[0].ProcessedAt, '30/09/2026 14:00:00');
});

test('approvalService.recentProcessed: record Pending tidak ikut, limit dihormati', async () => {
  const rows = [SCHEMA.PersonalTrainingLog];
  for (let i = 1; i <= 3; i++) {
    const r = [...PT_ROW]; r[0] = `PT.260929.0${i}`; r[9] = 'Success';
    rows.push(r);
  }
  rows.push([...PT_ROW.slice(0, 9), 'Pending', ...PT_ROW.slice(10)]); // masih Pending, 1 baris tambahan
  const { approvalService } = setup({ PersonalTrainingLog: rows });
  const res = await approvalService.recentProcessed(2);
  assert.equal(res.records.length, 2); // limit=2, walau ada 3 yang Success
});

test('approvalService.recordHistory: hanya event milik logId itu, urut kronologis', async () => {
  const { approvalService } = setup({
    AuditTrail: [
      SCHEMA.AuditTrail,
      ['29/09/2026 09:00:00', 'Alex PT', 'Submit Personal Training', 'LogID: PT.260929.01 for Member: John'],
      ['29/09/2026 09:05:00', 'Siti PT', 'Submit Personal Training', 'LogID: PT.260929.02 for Member: Jane'], // logId beda
      ['30/09/2026 10:00:00', 'Admin', 'Approve Personal Training', 'LogID: PT.260929.01 | Notes: ok'],
    ],
  });
  const res = await approvalService.recordHistory('PT.260929.01');
  assert.equal(res.events.length, 2);
  assert.equal(res.events[0].action, 'Submit Personal Training'); // kronologis: submit dulu
  assert.equal(res.events[1].action, 'Approve Personal Training');
  assert.equal(res.events[1].details, 'Notes: ok'); // prefix "LogID: xxx |" sudah dibuang
});

test('parseCreatedDateToMs: format valid vs tidak valid', async () => {
  const { approvalService } = setup();
  assert.ok(approvalService.parseCreatedDateToMs('29/09/2026 08:00:00') > 0);
  assert.equal(approvalService.parseCreatedDateToMs(''), 0);
  assert.equal(approvalService.parseCreatedDateToMs('bukan-tanggal'), 0);
});
