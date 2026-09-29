const test = require('node:test');
const assert = require('node:assert/strict');

process.env.SPREADSHEET_ID = 'test-sheet';
process.env.SHEETS_CACHE_TTL_MS = '0';

const { setSheetsClient } = require('../src/config/sheets');
const SheetRepository = require('../src/repositories/SheetRepository');
const { nextSequentialId } = require('../src/utils/idGenerator');

const { makeFakeClient } = require('./helpers/fakeSheets');

const CLUB_HEADER = ['ClubID', 'ClubName', 'Location', 'CreatedDate'];
function setup() {
  const fake = makeFakeClient({
    Club: [CLUB_HEADER, ['CLUB-0001', 'Main Gym', 'Jl. A', '2026-01-01'], ['CLUB-0002', 'Branch Gym', 'Jl. B', '2026-01-01']],
  });
  setSheetsClient(fake);
  require('../src/repositories/SheetRepository')._clearCaches();
  return { fake, repo: new SheetRepository('Club') };
}

test('findAll memetakan baris ke object sesuai header & melewati header', async () => {
  const { repo } = setup();
  const rows = await repo.findAll();
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { ClubID: 'CLUB-0001', ClubName: 'Main Gym', Location: 'Jl. A', CreatedDate: '2026-01-01' });
});

test('findAll mengisi sel kosong di ujung baris (Sheets API memotong trailing empty)', async () => {
  const { fake, repo } = setup();
  fake.db.Club.push(['CLUB-0003', 'Tiny']);
  const rows = await repo.findAll();
  assert.equal(rows[2].Location, '');
  assert.equal(rows[2].CreatedDate, '');
});

test('create menambah baris sesuai urutan header', async () => {
  const { fake, repo } = setup();
  await repo.create({ ClubID: 'CLUB-0009', Location: 'X', ClubName: 'Nine', CreatedDate: '2026-02-02' });
  assert.deepEqual(fake.db.Club.at(-1), ['CLUB-0009', 'Nine', 'X', '2026-02-02']);
});

test('update hanya mengubah kolom yang diminta', async () => {
  const { fake, repo } = setup();
  const updated = await repo.update('CLUB-0002', { ClubName: 'Renamed' });
  assert.equal(updated.ClubName, 'Renamed');
  assert.equal(updated.Location, 'Jl. B');
  assert.deepEqual(fake.db.Club[1], ['CLUB-0001', 'Main Gym', 'Jl. A', '2026-01-01']);
});

test('update: ID tidak ada => null; kolom tidak dikenal => error', async () => {
  const { repo } = setup();
  assert.equal(await repo.update('NOPE', { ClubName: 'x' }), null);
  await assert.rejects(() => repo.update('CLUB-0001', { Typo: 'x' }), /Kolom tidak dikenal/);
});

test('remove menghapus baris yang tepat', async () => {
  const { fake, repo } = setup();
  assert.equal(await repo.remove('CLUB-0001'), true);
  assert.equal(fake.db.Club.length, 2); // header + 1
  assert.equal(fake.db.Club[1][0], 'CLUB-0002');
  assert.equal(await repo.remove('CLUB-0001'), false);
});

test('nextSequentialId: berbasis nomor terbesar, bukan hitungan harian', async () => {
  const { fake, repo } = setup();
  assert.equal(await nextSequentialId('CLUB', repo), 'CLUB-0003');
  fake.db.Club.push(['CLUB-0007', 'Seven', '', '2026-01-01']);
  assert.equal(await nextSequentialId('CLUB', repo), 'CLUB-0008');
});
