const repos = require('../repositories');
const AppError = require('../utils/AppError');
const { formatNow } = require('../utils/date');
const { nextDailyId } = require('../utils/idGenerator');
const { isTruthy } = require('../utils/helpers');
const { evaluateEditRule, checkDeleteAllowed, editStatusChangeDetails } = require('../utils/approvalRules');
const audit = require('./auditService');

const LABEL = 'Manual Group';

function toApi(r) {
  return { ...r, IsArchived: isTruthy(r.IsArchived) };
}

/** Pengganti getManualGroupLogList() */
async function list() {
  return { success: true, records: (await repos.manualGroupLog.findAll()).map(toApi) };
}

/** Pengganti submitManualGroup() */
async function submit(formData, actor) {
  const memberNames = (formData.members || []).join(', ');
  if (!memberNames || !formData.scheduleDate) throw new AppError('Minimal 1 member dan tanggal jadwal wajib diisi.', 400);

  const logId = await nextDailyId('MG', repos.manualGroupLog);
  const no = (await repos.manualGroupLog.findAll()).length + 1;

  await repos.manualGroupLog.create({
    LogID: logId,
    Club: formData.club,
    Instructor_Name: formData.instruktur || actor,
    Member_Name: memberNames,
    ScheduleDate: formData.scheduleDate,
    ScheduleTime: formData.scheduleTime,
    Status: 'Pending',
    AdminNotes: '',
    CreatedDate: formatNow(),
    No: no,
    IsArchived: 'false',
  });
  await audit.log(formData.instruktur || actor, `Submit ${LABEL}`, `LogID: ${logId} for Member: ${memberNames}`);
  return { success: true, message: 'Add Manual Group berhasil disimpan!' };
}

/** Pengganti updateManualGroupLog() */
async function update(formData, actor) {
  const row = await repos.manualGroupLog.findById(formData.logId);
  if (!row) throw new AppError('Record tidak ditemukan.', 404);

  const rule = evaluateEditRule(row.Status, formData);
  if (!rule.ok) throw new AppError(rule.message, 400);

  const changes = {
    Club: formData.club,
    Member_Name: (formData.members || []).join(', '),
    ScheduleDate: formData.scheduleDate,
    ScheduleTime: formData.scheduleTime,
  };
  if (rule.backToPending) changes.Status = 'Pending';
  await repos.manualGroupLog.update(formData.logId, changes);

  if (rule.backToPending) {
    await audit.log(actor, `${rule.action} ${LABEL}`, editStatusChangeDetails(formData.logId, row.AdminNotes));
    return { success: true, message: rule.message };
  }
  await audit.log(actor, `Update ${LABEL}`, `Updated: ${formData.logId}`);
  return { success: true, message: 'Manual Group record berhasil diperbarui!' };
}

/** Pengganti deleteManualGroupLog(): soft delete (arsip). */
async function archive(logId, actor) {
  const row = await repos.manualGroupLog.findById(logId);
  if (!row) throw new AppError('Record tidak ditemukan.', 404);

  const allowed = checkDeleteAllowed(row.Status);
  if (!allowed.ok) throw new AppError(allowed.message, 400);

  await repos.manualGroupLog.update(logId, { IsArchived: 'true' });
  await audit.log(actor, `Archive ${LABEL}`, `Archived: ${logId}`);
  return { success: true, message: 'Manual Group record berhasil dipindahkan ke arsip!' };
}

/** Pengganti restoreManualGroupLog() */
async function restore(logId, actor) {
  const updated = await repos.manualGroupLog.update(logId, { IsArchived: 'false' });
  if (!updated) throw new AppError('Record tidak ditemukan.', 404);
  await audit.log(actor, `Restore ${LABEL}`, `Restored: ${logId}`);
  return { success: true, message: 'Manual Group record berhasil dikembalikan!' };
}

module.exports = { list, submit, update, archive, restore };
