const test = require('node:test');
const assert = require('node:assert/strict');

process.env.SPREADSHEET_ID = 'test-sheet';
process.env.SHEETS_CACHE_TTL_MS = '0';

const { setSheetsClient } = require('../src/config/sheets');
const SCHEMA = require('../src/config/schema');
const { makeFakeClient } = require('./helpers/fakeSheets');

const manualCuttingService = require('../src/services/manualCuttingService');
const timeInOutService = require('../src/services/timeInOutService');
const personalTrainingService = require('../src/services/personalTrainingService');
const groupTrainingService = require('../src/services/groupTrainingService');
const manualGroupService = require('../src/services/manualGroupService');

function setup(extra = {}) {
  const fake = makeFakeClient({
    ManualCutting: [SCHEMA.ManualCutting],
    TimeInOut: [SCHEMA.TimeInOut],
    PersonalTrainingLog: [SCHEMA.PersonalTrainingLog],
    GroupTrainingLog: [SCHEMA.GroupTrainingLog],
    ManualGroupLog: [SCHEMA.ManualGroupLog],
    AuditTrail: [SCHEMA.AuditTrail],
    ...extra,
  });
  setSheetsClient(fake);
  require('../src/repositories/SheetRepository')._clearCaches();
  return fake;
}

// ---------- Manual Cutting ----------
test('manualCuttingService.submit lalu updateStatus', async () => {
  const fake = setup();
  const sub = await manualCuttingService.submit({ ptName: 'Alex PT', memberName: 'John', reason: 'Sakit' }, 'Alex PT');
  assert.equal(sub.success, true);
  assert.match(sub.cutId, /^CUT-0001$/);

  const res = await manualCuttingService.updateStatus({ cutId: sub.cutId, status: 'Processed', adminNotes: 'ok' }, 'Admin');
  assert.equal(res.success, true);
  assert.equal(fake.db.ManualCutting[1][6], 'Processed');
});

test('manualCuttingService.submit: validasi field wajib', async () => {
  setup();
  await assert.rejects(() => manualCuttingService.submit({ ptName: 'Alex' }, 'Alex'), { status: 400 });
});

test('manualCuttingService.list: filter status & search', async () => {
  setup({
    ManualCutting: [
      SCHEMA.ManualCutting,
      ['CUT-0001', '2026-01-01', 'Alex PT', 'John Doe', 'Sakit', '', 'Pending', '', '01/01/2026 08:00:00'],
      ['CUT-0002', '2026-01-02', 'Siti PT', 'Jane Smith', 'Cuti', '', 'Processed', '', '02/01/2026 08:00:00'],
    ],
  });
  const res = await manualCuttingService.list({ status: 'Pending' });
  assert.equal(res.totalRecords, 1);
  assert.equal(res.data[0].cutId, 'CUT-0001');
});

// ---------- Time In/Out (contoh utama alur approval) ----------
test('timeInOutService: submit => ID harian format TIO.yyMMdd.NN', async () => {
  setup();
  const res = await timeInOutService.submit({ member: 'John', type: 'Time In' }, 'Alex PT');
  assert.equal(res.success, true);

  const list = await timeInOutService.list();
  assert.match(list.records[0].LogID, /^TIO\.\d{6}\.01$/);
  assert.equal(list.records[0].IsArchived, false);
});

test('timeInOutService: dua submit di hari sama => nomor urut naik (01, 02)', async () => {
  const fake = setup();
  await timeInOutService.submit({ member: 'A', type: 'Time In' }, 'Alex PT');
  await timeInOutService.submit({ member: 'B', type: 'Time In' }, 'Alex PT');
  assert.equal(fake.db.TimeInOut.length, 3); // header + 2
  assert.ok(fake.db.TimeInOut[1][0].endsWith('.01'));
  assert.ok(fake.db.TimeInOut[2][0].endsWith('.02'));
});

test('timeInOutService.update: Pending => edit biasa, status tidak berubah', async () => {
  const fake = setup();
  await timeInOutService.submit({ member: 'John', type: 'Time In' }, 'Alex PT');
  const logId = fake.db.TimeInOut[1][0];

  await timeInOutService.update({ logId, member: 'John Updated', type: 'Time Out' }, 'Alex PT');
  assert.equal(fake.db.TimeInOut[1][2], 'John Updated');
  assert.equal(fake.db.TimeInOut[1][4], 'Pending'); // status tidak berubah
});

test('timeInOutService.update: Rejected tanpa resubmit => ditolak; dengan resubmit => balik Pending', async () => {
  const fake = setup();
  await timeInOutService.submit({ member: 'John', type: 'Time In' }, 'Alex PT');
  const logId = fake.db.TimeInOut[1][0];
  fake.db.TimeInOut[1][4] = 'Rejected';

  await assert.rejects(() => timeInOutService.update({ logId, member: 'X', type: 'Time In' }, 'Alex PT'), { status: 400 });

  const res = await timeInOutService.update({ logId, member: 'X', type: 'Time In', resubmit: true }, 'Alex PT');
  assert.equal(res.success, true);
  assert.equal(fake.db.TimeInOut[1][4], 'Pending');
});

test('timeInOutService.archive: Success tidak bisa diarsip, Pending bisa', async () => {
  const fake = setup();
  await timeInOutService.submit({ member: 'John', type: 'Time In' }, 'Alex PT');
  const logId = fake.db.TimeInOut[1][0];

  fake.db.TimeInOut[1][4] = 'Success';
  await assert.rejects(() => timeInOutService.archive(logId, 'Admin'), { status: 400 });

  fake.db.TimeInOut[1][4] = 'Pending';
  const res = await timeInOutService.archive(logId, 'Admin');
  assert.equal(res.success, true);
  assert.equal(fake.db.TimeInOut[1][8], 'true');

  await timeInOutService.restore(logId, 'Admin');
  assert.equal(fake.db.TimeInOut[1][8], 'false');
});

// ---------- Personal Training (ExerciseLog builder) ----------
test('personalTrainingService.submit: ExerciseLog terbentuk dari array exercises', async () => {
  const fake = setup();
  await personalTrainingService.submit({
    club: 'Main Gym', ptName: 'Alex PT', member: 'John', sessionDate: '2026-09-29', sessionType: 'Strength',
    timeStart: '10:00', timeEnd: '11:00',
    exercises: [{ name: 'Bench Press', sets: { weights: [40, 45], reps: [10, 8] } }],
  }, 'Alex PT');

  assert.equal(fake.db.PersonalTrainingLog[1][8], 'Bench Press: Set1(40kg,10) Set2(45kg,8)');
});

test('personalTrainingService.submit: validasi field wajib', async () => {
  setup();
  await assert.rejects(() => personalTrainingService.submit({ club: 'Main Gym' }, 'Alex'), { status: 400 });
});

// ---------- Group Training ----------
test('groupTrainingService: submit lalu archive', async () => {
  const fake = setup();
  await groupTrainingService.submit({ club: 'Main Gym', instruktur: 'Roni', member: 'John', sessionDate: '2026-09-29', sessionType: 'Boxing', timeStart: '10:00', timeEnd: '11:00' }, 'Roni');
  const logId = fake.db.GroupTrainingLog[1][0];
  await groupTrainingService.archive(logId, 'Admin');
  assert.equal(fake.db.GroupTrainingLog[1][12], 'true');
});

// ---------- Manual Group ----------
test('manualGroupService.submit: nama member digabung jadi 1 string', async () => {
  const fake = setup();
  await manualGroupService.submit({ club: 'Main Gym', instruktur: 'Roni', members: ['John', 'Jane'], scheduleDate: '2026-09-29', scheduleTime: '10:00' }, 'Roni');
  assert.equal(fake.db.ManualGroupLog[1][3], 'John, Jane');
});

test('manualGroupService.submit: validasi field wajib', async () => {
  setup();
  await assert.rejects(() => manualGroupService.submit({ club: 'Main Gym' }, 'Roni'), { status: 400 });
});

test('semua record baru: kolom ID unik antar modul tidak bentrok', async () => {
  const fake = setup();
  await Promise.resolve(timeInOutService.submit({ member: 'A', type: 'Time In' }, 'X'));
  await personalTrainingService.submit({ club: 'Main Gym', member: 'B', sessionDate: '2026-09-29' }, 'X');
  await groupTrainingService.submit({ club: 'Main Gym', member: 'C', sessionDate: '2026-09-29' }, 'X');
  await manualGroupService.submit({ club: 'Main Gym', members: ['D'], scheduleDate: '2026-09-29' }, 'X');

  assert.match(fake.db.TimeInOut[1][0], /^TIO\./);
  assert.match(fake.db.PersonalTrainingLog[1][0], /^PT\./);
  assert.match(fake.db.GroupTrainingLog[1][0], /^GT\./);
  assert.match(fake.db.ManualGroupLog[1][0], /^MG\./);
});
