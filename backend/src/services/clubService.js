const repos = require('../repositories');
const AppError = require('../utils/AppError');
const { formatDateISO } = require('../utils/date');
const { nextSequentialId } = require('../utils/idGenerator');
const audit = require('./auditService');

/** Pengganti getClubsList() */
async function list() {
  return { success: true, clubs: await repos.clubs.findAll() };
}

/** Pengganti saveClub(): clubId ada => edit, kosong => tambah baru */
async function save(data, actor) {
  const clubName = String(data.clubName || '').trim();
  const location = String(data.location || '').trim();
  if (!clubName) throw new AppError('Nama club wajib diisi.', 400);

  if (data.clubId) {
    const updated = await repos.clubs.update(data.clubId, { ClubName: clubName, Location: location });
    if (!updated) throw new AppError('Club tidak ditemukan.', 404);
    await audit.log(actor, 'Update Club', `Updated: ${clubName}`);
    return { success: true, message: 'Club berhasil diperbarui!' };
  }

  await repos.clubs.create({
    ClubID: await nextSequentialId('CLUB', repos.clubs),
    ClubName: clubName,
    Location: location,
    CreatedDate: formatDateISO(),
  });
  await audit.log(actor, 'Add Club', `Created: ${clubName}`);
  return { success: true, message: 'Club baru berhasil ditambahkan!' };
}

/** Pengganti deleteClub() */
async function remove(clubId, actor) {
  const removed = await repos.clubs.remove(clubId);
  if (!removed) throw new AppError('Club tidak ditemukan.', 404);
  await audit.log(actor, 'Delete Club', `Deleted: ${clubId}`);
  return { success: true, message: 'Club berhasil dihapus!' };
}

module.exports = { list, save, remove };
