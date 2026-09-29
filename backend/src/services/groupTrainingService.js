const repos = require('../repositories');
const AppError = require('../utils/AppError');
const { formatNow } = require('../utils/date');
const { nextDailyId } = require('../utils/idGenerator');
const { isTruthy } = require('../utils/helpers');
const { evaluateEditRule, checkDeleteAllowed, editStatusChangeDetails } = require('../utils/approvalRules');
const audit = require('./auditService');

const LABEL = 'Group Training';

function toApi(r) {
  return { ...r, IsArchived: isTruthy(r.IsArchived) };
}

/** Pengganti getGroupTrainingLogList() */
async function list() {
  return { success: true, records: (await repos.groupTrainingLog.findAll()).map(toApi) };
}

/** Pengganti submitGroupTraining() */
async function submit(formData, actor) {
  if (!formData.member || !formData.sessionDate) throw new AppError('Member dan tanggal sesi wajib diisi.', 400);

  const logId = await nextDailyId('GT', repos.groupTrainingLog);
  const no = (await repos.groupTrainingLog.findAll()).length + 1;

  await repos.groupTrainingLog.create({
    LogID: logId,
    Club: formData.club,
    Instructor_Name: formData.instruktur || actor,
    Member_Name: formData.member,
    SessionDate: formData.sessionDate,
    SessionType: formData.sessionType,
    BookingTimeStart: formData.timeStart,
    BookingTimeEnd: formData.timeEnd,
    Status: 'Pending',
    AdminNotes: '',
    CreatedDate: formatNow(),
    No: no,
    IsArchived: 'false',
  });
  await audit.log(formData.instruktur || actor, `Submit ${LABEL}`, `LogID: ${logId} for Member: ${formData.member}`);
  return { success: true, message: 'Group Training form berhasil disimpan!' };
}

/** Pengganti updateGroupTrainingLog() */
async function update(formData, actor) {
  const row = await repos.groupTrainingLog.findById(formData.logId);
  if (!row) throw new AppError('Record tidak ditemukan.', 404);

  const rule = evaluateEditRule(row.Status, formData);
  if (!rule.ok) throw new AppError(rule.message, 400);

  const changes = {
    Club: formData.club,
    Member_Name: formData.member,
    SessionDate: formData.sessionDate,
    SessionType: formData.sessionType,
    BookingTimeStart: formData.timeStart,
    BookingTimeEnd: formData.timeEnd,
  };
  if (rule.backToPending) changes.Status = 'Pending';
  await repos.groupTrainingLog.update(formData.logId, changes);

  if (rule.backToPending) {
    await audit.log(actor, `${rule.action} ${LABEL}`, editStatusChangeDetails(formData.logId, row.AdminNotes));
    return { success: true, message: rule.message };
  }
  await audit.log(actor, `Update ${LABEL}`, `Updated: ${formData.logId}`);
  return { success: true, message: 'Group Training record berhasil diperbarui!' };
}

/** Pengganti deleteGroupTrainingLog(): soft delete (arsip). */
async function archive(logId, actor) {
  const row = await repos.groupTrainingLog.findById(logId);
  if (!row) throw new AppError('Record tidak ditemukan.', 404);

  const allowed = checkDeleteAllowed(row.Status);
  if (!allowed.ok) throw new AppError(allowed.message, 400);

  await repos.groupTrainingLog.update(logId, { IsArchived: 'true' });
  await audit.log(actor, `Archive ${LABEL}`, `Archived: ${logId}`);
  return { success: true, message: 'Group Training record berhasil dipindahkan ke arsip!' };
}

/** Pengganti restoreGroupTrainingLog() */
async function restore(logId, actor) {
  const updated = await repos.groupTrainingLog.update(logId, { IsArchived: 'false' });
  if (!updated) throw new AppError('Record tidak ditemukan.', 404);
  await audit.log(actor, `Restore ${LABEL}`, `Restored: ${logId}`);
  return { success: true, message: 'Group Training record berhasil dikembalikan!' };
}

module.exports = { list, submit, update, archive, restore };
