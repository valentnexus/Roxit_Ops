const repos = require('../repositories');
const AppError = require('../utils/AppError');
const { formatDateISO } = require('../utils/date');
const { nextSequentialId } = require('../utils/idGenerator');
const audit = require('./auditService');

/** Pengganti getSessionTypesList() */
async function list() {
  return { success: true, sessions: await repos.sessionTypes.findAll() };
}

/** Pengganti saveSessionType() */
async function save(data, actor) {
  const sessionName = String(data.sessionName || '').trim();
  const description = String(data.description || '').trim();
  if (!sessionName) throw new AppError('Nama session type wajib diisi.', 400);

  if (data.sessionTypeId) {
    const updated = await repos.sessionTypes.update(data.sessionTypeId, { SessionName: sessionName, Description: description });
    if (!updated) throw new AppError('Session Type tidak ditemukan.', 404);
    await audit.log(actor, 'Update Session Type', `Updated: ${sessionName}`);
    return { success: true, message: 'Session Type berhasil diperbarui!' };
  }

  await repos.sessionTypes.create({
    SessionTypeID: await nextSequentialId('SES', repos.sessionTypes),
    SessionName: sessionName,
    Description: description,
    CreatedDate: formatDateISO(),
  });
  await audit.log(actor, 'Add Session Type', `Created: ${sessionName}`);
  return { success: true, message: 'Session Type baru berhasil ditambahkan!' };
}

/** Pengganti deleteSessionType() */
async function remove(sessionTypeId, actor) {
  const removed = await repos.sessionTypes.remove(sessionTypeId);
  if (!removed) throw new AppError('Session Type tidak ditemukan.', 404);
  await audit.log(actor, 'Delete Session Type', `Deleted: ${sessionTypeId}`);
  return { success: true, message: 'Session Type berhasil dihapus!' };
}

module.exports = { list, save, remove };
