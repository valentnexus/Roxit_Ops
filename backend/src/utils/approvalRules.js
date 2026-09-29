/**
 * Aturan bersama untuk record yang melalui alur approval (Pending -> Success/Rejected):
 * dipakai oleh Time In/Out, Personal Training, Group Training, dan Manual Group.
 * (Manual Cutting punya alur sendiri yang lebih sederhana, lihat manualCuttingService.)
 */

/**
 * Tentukan apakah sebuah edit terhadap record boleh dilakukan, tergantung status saat ini.
 *  - Pending  : edit biasa, status tidak berubah.
 *  - Rejected : hanya boleh diedit lewat "Resubmit" (formData.resubmit === true), lalu balik ke Pending.
 *  - Success  : hanya boleh diedit lewat "Cancel Approval" (formData.cancelApproval === true), balik ke Pending.
 */
function evaluateEditRule(currentStatus, formData) {
  if (currentStatus === 'Rejected') {
    if (formData.resubmit !== true) {
      return { ok: false, message: 'Record berstatus Rejected hanya bisa diedit lewat Resubmit.' };
    }
    return { ok: true, backToPending: true, action: 'Resubmit', message: 'Record berhasil dikirim ulang dan kembali ke Pending!' };
  }
  if (currentStatus === 'Success') {
    if (formData.cancelApproval !== true) {
      return { ok: false, message: 'Record berstatus Success hanya bisa diedit lewat Cancel Approval.' };
    }
    return { ok: true, backToPending: true, action: 'Cancel Approval', message: 'Approval dibatalkan, record kembali ke Pending!' };
  }
  return { ok: true, backToPending: false };
}

/** Record berstatus Success tidak boleh diarsipkan sebelum di-Cancel Approval. */
function checkDeleteAllowed(currentStatus) {
  if (currentStatus === 'Success') {
    return { ok: false, message: 'Record berstatus Success tidak bisa diarsipkan. Lakukan Cancel Approval terlebih dahulu.' };
  }
  return { ok: true };
}

/** Detail teks untuk dicatat ke AuditTrail saat Resubmit / Cancel Approval. */
function editStatusChangeDetails(logId, previousNotes) {
  let details = `LogID: ${logId}`;
  if (previousNotes) details += ` | Catatan admin sebelumnya: ${previousNotes}`;
  return details;
}

module.exports = { evaluateEditRule, checkDeleteAllowed, editStatusChangeDetails };
