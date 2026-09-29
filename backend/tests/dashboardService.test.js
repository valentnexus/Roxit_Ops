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
    Users: [SCHEMA.Users],
    AuditTrail: [SCHEMA.AuditTrail],
    ...extra,
  });
  setSheetsClient(fake);
  require('../src/repositories/SheetRepository')._clearCaches();
  delete require.cache[require.resolve('../src/services/approvalService')];
  delete require.cache[require.resolve('../src/services/dashboardService')];
  return { fake, dashboardService: require('../src/services/dashboardService') };
}

// Tanggal "hari ini" dipakai relatif terhadap now, biar test tetap valid kapan pun dijalankan.
function isoDaysAgo(days) {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}
function dmyToday() {
  const [y, m, d] = new Date().toISOString().slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

const PT_ROW = (id, sessionDate, status, staff = 'Alex PT') =>
  [id, 'Main Gym', staff, 'John', sessionDate, 'Strength', '10:00', '11:00', '', status, '', `${dmyToday()} 09:00:00`, '1', 'false'];

test('dashboardService.stats: totalPending gabungan 4 sistem, staff aktif, approved/rejected hari ini', async () => {
  const { dashboardService } = setup({
    PersonalTrainingLog: [SCHEMA.PersonalTrainingLog, PT_ROW('PT.1', isoDaysAgo(0), 'Pending')],
    TimeInOut: [SCHEMA.TimeInOut, ['TIO.1', 'Alex PT', 'John', 'Time In', 'Pending', '', `${dmyToday()} 08:00:00`, '1', 'false']],
    Users: [
      SCHEMA.Users,
      ['USR-0001', 'Alex PT', 'a@gmail.com', 'x', 'Personal Trainer', 'Main Gym', '0812', 'false', ''],
      ['USR-0002', 'Old Staff', 'o@gmail.com', 'x', 'Personal Trainer', 'Main Gym', '0813', 'true', ''], // archived, tidak dihitung
    ],
    AuditTrail: [
      SCHEMA.AuditTrail,
      [`${dmyToday()} 10:00:00`, 'Admin', 'Approve Personal Training', 'LogID: X'],
      [`${dmyToday()} 10:05:00`, 'Admin', 'Reject Personal Training', 'LogID: Y'],
    ],
  });

  const res = await dashboardService.stats();
  assert.equal(res.stats.totalPending, 2);
  assert.equal(res.stats.totalActiveStaff, 1);
  assert.equal(res.stats.approvedToday, 1);
  assert.equal(res.stats.rejectedToday, 1);
});

test('dashboardService.stats: record archived tidak dihitung sebagai pending', async () => {
  const archived = PT_ROW('PT.1', isoDaysAgo(0), 'Pending'); archived[13] = 'true';
  const { dashboardService } = setup({ PersonalTrainingLog: [SCHEMA.PersonalTrainingLog, archived] });
  const res = await dashboardService.stats();
  assert.equal(res.stats.totalPending, 0);
});

test('dashboardService.widgets: sesi hari ini / minggu ini / bulan ini dihitung benar, TIO tidak ikut', async () => {
  const { dashboardService } = setup({
    PersonalTrainingLog: [
      SCHEMA.PersonalTrainingLog,
      PT_ROW('PT.1', isoDaysAgo(0), 'Pending'),   // hari ini
      PT_ROW('PT.2', isoDaysAgo(3), 'Success'),   // minggu ini (dalam 7 hari)
      PT_ROW('PT.3', isoDaysAgo(20), 'Success'),  // bulan ini mungkin, minggu ini bukan
    ],
    TimeInOut: [SCHEMA.TimeInOut, ['TIO.1', 'Alex PT', 'John', 'Time In', 'Pending', '', `${dmyToday()} 08:00:00`, '1', 'false']],
  });

  const res = await dashboardService.widgets();
  assert.equal(res.quickStats.sesiHariIni, 1);
  assert.equal(res.quickStats.sesiMingguIni, 2); // hari ini + 3 hari lalu, TIO tidak dihitung
});

test('dashboardService.widgets: trend 7 hari punya 7 label & sinkron urutan tanggal', async () => {
  const { dashboardService } = setup({
    PersonalTrainingLog: [SCHEMA.PersonalTrainingLog, PT_ROW('PT.1', isoDaysAgo(0), 'Pending')],
  });
  const res = await dashboardService.widgets();
  assert.equal(res.trend.labels.length, 7);
  assert.equal(res.trend.pt.length, 7);
  assert.equal(res.trend.pt.at(-1), 1); // hari ini = index terakhir, ada 1 sesi PT
  assert.equal(res.trend.gt.reduce((a, b) => a + b, 0), 0);
});

test('dashboardService.widgets: leaderboard topStaff hitung form yang diajukan hari ini', async () => {
  const { dashboardService } = setup({
    PersonalTrainingLog: [
      SCHEMA.PersonalTrainingLog,
      PT_ROW('PT.1', isoDaysAgo(0), 'Pending', 'Alex PT'),
      PT_ROW('PT.2', isoDaysAgo(0), 'Pending', 'Alex PT'),
      PT_ROW('PT.3', isoDaysAgo(0), 'Pending', 'Siti PT'),
    ],
  });
  const res = await dashboardService.widgets();
  assert.equal(res.leaderboard.topStaff[0].name, 'Alex PT');
  assert.equal(res.leaderboard.topStaff[0].count, 2);
  assert.equal(res.leaderboard.topStaff[1].name, 'Siti PT');
});

test('dashboardService.widgets: leaderboard topReject minimal 2 diproses & minimal 1 reject', async () => {
  const thisMonth = isoDaysAgo(0);
  const { dashboardService } = setup({
    PersonalTrainingLog: [
      SCHEMA.PersonalTrainingLog,
      PT_ROW('PT.1', thisMonth, 'Success', 'Alex PT'),
      PT_ROW('PT.2', thisMonth, 'Rejected', 'Alex PT'), // Alex: 2 diproses, 1 rejected => rate 50%
      PT_ROW('PT.3', thisMonth, 'Rejected', 'Siti PT'), // Siti: cuma 1 diproses => tidak masuk (syarat >=2)
    ],
  });
  const res = await dashboardService.widgets();
  assert.equal(res.leaderboard.topReject.length, 1);
  assert.equal(res.leaderboard.topReject[0].name, 'Alex PT');
  assert.equal(res.leaderboard.topReject[0].rate, 50);
});

test('dashboardService.widgets: attentionList cuma Pending, urut dari yang paling lama nunggu', async () => {
  const { fake, dashboardService } = setup({
    PersonalTrainingLog: [
      SCHEMA.PersonalTrainingLog,
      PT_ROW('PT.NEW', isoDaysAgo(0), 'Pending'),
      PT_ROW('PT.OLD', isoDaysAgo(0), 'Success'), // Success tidak masuk attentionList
    ],
  });
  // buat PT.OLD jadi benar2 lebih lama dan Pending, biar urutan teruji
  fake.db.PersonalTrainingLog[2][9] = 'Pending';
  fake.db.PersonalTrainingLog[2][11] = fake.db.PersonalTrainingLog[2][11].replace(/^\d{2}\/\d{2}\/\d{4}/, (m) => {
    const [d, mo, y] = m.split('/');
    return `${String(+d - 1).padStart(2, '0')}/${mo}/${y}`; // 1 hari lebih lama
  });

  const res = await dashboardService.widgets();
  assert.equal(res.attentionList.length, 2);
  assert.equal(res.attentionList[0].LogID, 'PT.OLD'); // paling lama nunggu di urutan pertama
});
