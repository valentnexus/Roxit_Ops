const repos = require('../repositories');
const { formatNow } = require('../utils/date');

/** Pengganti logAudit() di code.gs. Gagal mencatat audit tidak boleh menggagalkan request utama. */
async function log(user, action, details) {
  try {
    await repos.auditTrail.create({
      Timestamp: formatNow(),
      User: user || 'System',
      Action: action,
      Details: details,
    });
  } catch (err) {
    console.error('Audit Log Error:', err.message);
  }
}

/** Pengganti getAuditTrailData(): 50 entri audit trail terbaru (params di versi lama tidak dipakai untuk filter). */
async function list() {
  const rows = await repos.auditTrail.findAll();
  const data = rows
    .slice()
    .reverse()
    .slice(0, 50)
    .map((r) => ({ timestamp: r.Timestamp, user: r.User, action: r.Action, details: r.Details }));
  return { success: true, data };
}

module.exports = { log, list };
