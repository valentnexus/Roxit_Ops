const repos = require('../repositories');
const AppError = require('../utils/AppError');
const { formatNow } = require('../utils/date');
const { nextDailyId } = require('../utils/idGenerator');
const { isTruthy } = require('../utils/helpers');
const { evaluateEditRule, checkDeleteAllowed, editStatusChangeDetails } = require('../utils/approvalRules');
const audit = require('./auditService');

const LABEL = 'Time In/Out';

function toApi(r) {
  return { ...r, IsArchived: isTruthy(r.IsArchived) };
}

/** Pengganti getTimeInOutData(): ringkasan dengan paginasi + filter PT (dipakai widget dashboard). */
async function summary(params = {}) {
  const page = parseInt(params.page, 10) || 1;
  const limit = parseInt(params.limit, 10) || 10;
  const userFilter = String(params.user || '').toLowerCase();

  let rows = await repos.timeInOut.findAll();
  if (userFilter) rows = rows.filter((r) => r.PT_Name.toLowerCase() === userFilter);
  rows = rows.reverse();

  const totalRecords = rows.length;
  const totalPages = Math.ceil(totalRecords / limit) || 1;
  const start = (page - 1) * limit;
  const data = rows.slice(start, start + limit).map((r) => ({
    logId: r.LogID, ptName: r.PT_Name, memberName: r.Member_Name, type: r.Type,
    status: r.Status, adminNotes: r.AdminNotes, createdDate: r.CreatedDate,
  }));

  return { success: true, data, totalPages, totalRecords, currentPage: page };
}

/** Pengganti getTimeInOutLogList(): daftar lengkap (halaman kelola/edit). */
async function list() {
  return { success: true, records: (await repos.timeInOut.findAll()).map(toApi) };
}

/** Pengganti submitTimeInOut() */
async function submit(formData, actor) {
  if (!formData.member || !formData.type) throw new AppError('Member dan tipe (Time In/Time Out) wajib diisi.', 400);

  const logId = await nextDailyId('TIO', repos.timeInOut);
  const no = (await repos.timeInOut.findAll()).length + 1;

  await repos.timeInOut.create({
    LogID: logId,
    PT_Name: formData.ptName || actor,
    Member_Name: formData.member,
    Type: formData.type,
    Status: 'Pending',
    AdminNotes: '',
    CreatedDate: formatNow(),
    No: no,
    IsArchived: 'false',
  });
  await audit.log(formData.ptName || actor, `Submit ${formData.type}`, `LogID: ${logId} for Member: ${formData.member}`);
  return { success: true, message: `${formData.type} berhasil dicatat!` };
}

/** Pengganti updateTimeInOutLog() */
async function update(formData, actor) {
  const row = await repos.timeInOut.findById(formData.logId);
  if (!row) throw new AppError('Record tidak ditemukan.', 404);

  const rule = evaluateEditRule(row.Status, formData);
  if (!rule.ok) throw new AppError(rule.message, 400);

  const changes = { Member_Name: formData.member, Type: formData.type };
  if (rule.backToPending) changes.Status = 'Pending';
  await repos.timeInOut.update(formData.logId, changes);

  if (rule.backToPending) {
    await audit.log(actor, `${rule.action} ${LABEL}`, editStatusChangeDetails(formData.logId, row.AdminNotes));
    return { success: true, message: rule.message };
  }
  await audit.log(actor, `Update ${LABEL}`, `Updated: ${formData.logId}`);
  return { success: true, message: 'Time In/Out record berhasil diperbarui!' };
}

/** Pengganti deleteTimeInOutLog(): soft delete (arsip), bukan hapus permanen. */
async function archive(logId, actor) {
  const row = await repos.timeInOut.findById(logId);
  if (!row) throw new AppError('Record tidak ditemukan.', 404);

  const allowed = checkDeleteAllowed(row.Status);
  if (!allowed.ok) throw new AppError(allowed.message, 400);

  await repos.timeInOut.update(logId, { IsArchived: 'true' });
  await audit.log(actor, `Archive ${LABEL}`, `Archived: ${logId}`);
  return { success: true, message: 'Time In/Out record berhasil dipindahkan ke arsip!' };
}

/** Pengganti restoreTimeInOutLog() */
async function restore(logId, actor) {
  const updated = await repos.timeInOut.update(logId, { IsArchived: 'false' });
  if (!updated) throw new AppError('Record tidak ditemukan.', 404);
  await audit.log(actor, `Restore ${LABEL}`, `Restored: ${logId}`);
  return { success: true, message: 'Time In/Out record berhasil dikembalikan!' };
}

module.exports = { summary, list, submit, update, archive, restore };
