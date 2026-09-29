const repos = require('../repositories');
const AppError = require('../utils/AppError');
const { formatNow, formatDateISO } = require('../utils/date');
const { nextSequentialId } = require('../utils/idGenerator');
const audit = require('./auditService');

/** Pengganti getManualCuttingData(): list dengan paginasi, pencarian, filter status & PT. */
async function list(params = {}) {
  const page = parseInt(params.page, 10) || 1;
  const limit = parseInt(params.limit, 10) || 10;
  const search = String(params.search || '').toLowerCase();
  const statusFilter = params.status || 'ALL';
  const userFilter = String(params.user || '').toLowerCase();

  let rows = await repos.manualCutting.findAll();
  rows = rows.filter((r) => {
    if (userFilter && r.PT_Name.toLowerCase() !== userFilter) return false;
    if (statusFilter !== 'ALL' && r.Status.toLowerCase() !== String(statusFilter).toLowerCase()) return false;
    if (search) {
      const haystack = `${r.CutID} ${r.PT_Name} ${r.Member_Name} ${r.Reason}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
  rows = rows.reverse(); // terbaru dulu

  const totalRecords = rows.length;
  const totalPages = Math.ceil(totalRecords / limit) || 1;
  const start = (page - 1) * limit;
  const data = rows.slice(start, start + limit).map((r) => ({
    cutId: r.CutID, date: r.Date, ptName: r.PT_Name, memberName: r.Member_Name,
    reason: r.Reason, notes: r.Notes, status: r.Status, adminNotes: r.AdminNotes, timestamp: r.Timestamp,
  }));

  return { success: true, data, totalPages, totalRecords, currentPage: page };
}

/** Pengganti submitManualCutting() */
async function submit(formData, actor) {
  if (!formData.ptName || !formData.memberName || !formData.reason) {
    throw new AppError('PT, nama member, dan alasan wajib diisi.', 400);
  }

  const cutId = await nextSequentialId('CUT', repos.manualCutting);
  await repos.manualCutting.create({
    CutID: cutId,
    Date: formData.date || formatDateISO(),
    PT_Name: formData.ptName,
    Member_Name: formData.memberName,
    Reason: formData.reason,
    Notes: formData.notes || '',
    Status: 'Pending',
    AdminNotes: '',
    Timestamp: formatNow(),
  });
  await audit.log(actor, 'Submit Manual Cutting', `ID: ${cutId} for Member: ${formData.memberName}`);
  return { success: true, message: 'Form Manual Cutting berhasil dikirim!', cutId };
}

/** Pengganti updateCuttingStatus(). Admin approve/reject langsung, tidak lewat evaluateEditRule (alur beda dari log training). */
async function updateStatus(params, actor) {
  const { cutId, status } = params;
  const adminNotes = params.adminNotes || '';
  if (status !== 'Processed' && status !== 'Rejected') throw new AppError('Status tidak valid.', 400);

  const updated = await repos.manualCutting.update(cutId, { Status: status, AdminNotes: adminNotes });
  if (!updated) throw new AppError(`Form ID ${cutId} tidak ditemukan.`, 404);

  await audit.log(actor, 'Update Cutting Status', `ID: ${cutId} -> ${status} | Notes: ${adminNotes}`);
  return { success: true, message: `Status form ${cutId} berhasil diperbarui menjadi ${status}` };
}

module.exports = { list, submit, updateStatus };
