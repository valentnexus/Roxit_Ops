const repos = require('../repositories');
const AppError = require('../utils/AppError');
const { isTruthy } = require('../utils/helpers');
const audit = require('./auditService');

/**
 * Konfigurasi 4 sistem yang record-nya melalui alur approval (Pending -> Success/Rejected).
 * Ini VERSI OBJECT dari getApprovalConfigs() lama (yang dulu memakai indeks kolom array
 * mentah dari Sheets). Karena repository kita sudah mengembalikan object ber-nama field,
 * di sini dipakai nama field langsung — lebih gampang dibaca & tidak gampang salah pas
 * urutan kolom sheet berubah.
 */
const CONFIGS = [
  {
    type: 'PT', label: 'Personal Training', repo: repos.personalTrainingLog,
    staffField: 'PT_Name',
    detail: (r) => `${r.SessionDate} | ${r.BookingTimeStart} - ${r.BookingTimeEnd} | ${r.SessionType} | ${r.Club}`,
    fields: (r) => ({ Club: r.Club, SessionDate: r.SessionDate, SessionTime: `${r.BookingTimeStart} - ${r.BookingTimeEnd}`, SessionType: r.SessionType, ActionType: '' }),
  },
  {
    type: 'GT', label: 'Group Training', repo: repos.groupTrainingLog,
    staffField: 'Instructor_Name',
    detail: (r) => `${r.SessionDate} | ${r.BookingTimeStart} - ${r.BookingTimeEnd} | ${r.SessionType} | ${r.Club}`,
    fields: (r) => ({ Club: r.Club, SessionDate: r.SessionDate, SessionTime: `${r.BookingTimeStart} - ${r.BookingTimeEnd}`, SessionType: r.SessionType, ActionType: '' }),
  },
  {
    type: 'MG', label: 'Manual Group', repo: repos.manualGroupLog,
    staffField: 'Instructor_Name',
    detail: (r) => `${r.ScheduleDate} ${r.ScheduleTime} | ${r.Club}`,
    fields: (r) => ({ Club: r.Club, SessionDate: r.ScheduleDate, SessionTime: r.ScheduleTime, SessionType: '', ActionType: '' }),
  },
  {
    type: 'TIO', label: 'Time In/Out', repo: repos.timeInOut,
    staffField: 'PT_Name',
    detail: (r) => r.Type,
    fields: (r) => ({ Club: '', SessionDate: '', SessionTime: '', SessionType: '', ActionType: r.Type }),
  },
];
// Field yang sama di semua 4 sheet log (lihat config/schema.js)
const MEMBER_FIELD = 'Member_Name';
const STATUS_FIELD = 'Status';
const NOTES_FIELD = 'AdminNotes';
const CREATED_FIELD = 'CreatedDate';
const ARCHIVED_FIELD = 'IsArchived';

/** Pengganti parseCreatedDateToMs(): "dd/MM/yyyy HH:mm:ss" -> milidetik (buat sorting). */
function parseCreatedDateToMs(str) {
  if (!str) return 0;
  const [datePart, timePart = '00:00:00'] = String(str).split(' ');
  const d = datePart.split('/');
  if (d.length !== 3) return 0;
  const t = timePart.split(':');
  const ms = new Date(
    parseInt(d[2], 10), parseInt(d[1], 10) - 1, parseInt(d[0], 10),
    parseInt(t[0] || 0, 10), parseInt(t[1] || 0, 10), parseInt(t[2] || 0, 10),
  ).getTime();
  return ms || 0;
}

/** Pengganti buildApprovalRecord(): 1 baris sheet -> 1 object record seragam. */
function buildRecord(cfg, r) {
  const f = cfg.fields(r);
  return {
    LogID: r.LogID,
    Type: cfg.type,
    TypeLabel: cfg.label,
    Staff: r[cfg.staffField],
    Member: r[MEMBER_FIELD],
    Detail: cfg.detail(r),
    Club: f.Club,
    SessionDate: f.SessionDate,
    SessionTime: f.SessionTime,
    SessionType: f.SessionType,
    ActionType: f.ActionType,
    Status: r[STATUS_FIELD],
    AdminNotes: r[NOTES_FIELD],
    CreatedDate: r[CREATED_FIELD],
    SortKey: parseCreatedDateToMs(r[CREATED_FIELD]),
  };
}

/** Pengganti getAllOpsRecordsForDashboard(): record non-archived dari 4 sistem, TANPA diurutkan. */
async function nonArchivedRecords() {
  const records = [];
  for (const cfg of CONFIGS) {
    const rows = await cfg.repo.findAll();
    rows.forEach((r) => {
      if (!r.LogID || isTruthy(r[ARCHIVED_FIELD])) return;
      records.push(buildRecord(cfg, r));
    });
  }
  return records;
}

/** Pengganti getApprovalList(): gabungan record non-archived dari 4 sistem, terbaru di atas. */
async function list() {
  const records = await nonArchivedRecords();
  records.sort((a, b) => b.SortKey - a.SortKey);
  return { success: true, records };
}

/** Pengganti getRecentProcessed(): N record terakhir yang sudah Success/Rejected, waktu proses dari AuditTrail. */
async function recentProcessed(limit = 20) {
  const auditRows = await repos.auditTrail.findAll();

  // Waktu diproses terbaru per LogID (dari log "Approve X" / "Reject X" di AuditTrail)
  const processedMap = new Map();
  auditRows.forEach((row) => {
    const action = String(row.Action || '');
    if (!action.startsWith('Approve ') && !action.startsWith('Reject ')) return;
    const match = String(row.Details || '').match(/^LogID:\s*(\S+)/);
    if (!match) return;

    const ms = parseCreatedDateToMs(row.Timestamp);
    const prev = processedMap.get(match[1]);
    if (!prev || ms >= prev.ms) processedMap.set(match[1], { ms, str: row.Timestamp });
  });

  const records = [];
  for (const cfg of CONFIGS) {
    const rows = await cfg.repo.findAll();
    rows.forEach((r) => {
      if (!r.LogID || isTruthy(r[ARCHIVED_FIELD])) return;
      if (r[STATUS_FIELD] !== 'Success' && r[STATUS_FIELD] !== 'Rejected') return;

      const rec = buildRecord(cfg, r);
      const pm = processedMap.get(r.LogID);
      rec.ProcessedAt = pm ? pm.str : rec.CreatedDate;
      rec.SortKey = pm ? pm.ms : rec.SortKey;
      records.push(rec);
    });
  }
  records.sort((a, b) => b.SortKey - a.SortKey);
  return { success: true, records: records.slice(0, limit) };
}

/** Pengganti getRecordHistory(): riwayat 1 record (Submit, Reject, Resubmit, Approve, dst) dari AuditTrail. */
async function recordHistory(logId) {
  const auditRows = await repos.auditTrail.findAll();
  const events = [];

  auditRows.forEach((row) => {
    const details = String(row.Details || '');
    const match = details.match(/^LogID:\s*(\S+)/);
    if (!match || match[1] !== logId) return;

    events.push({
      timestamp: row.Timestamp,
      sortKey: parseCreatedDateToMs(row.Timestamp),
      user: row.User,
      action: row.Action,
      details: details.replace(/^LogID:\s*\S+\s*\|?\s*/, ''),
    });
  });

  events.sort((a, b) => a.sortKey - b.sortKey);
  return { success: true, events };
}

/** Pengganti processApproval(): Approve/Reject 1 record, Pending -> Success/Rejected. */
async function process(params, actor) {
  const { type, logId, status: newStatus, notes = '' } = params;

  if (newStatus !== 'Success' && newStatus !== 'Rejected') {
    throw new AppError('Status tidak valid.', 400);
  }
  const cfg = CONFIGS.find((c) => c.type === type);
  if (!cfg) throw new AppError('Tipe record tidak dikenali.', 400);

  const row = await cfg.repo.findById(logId);
  if (!row) throw new AppError('Record tidak ditemukan.', 404);
  if (isTruthy(row[ARCHIVED_FIELD])) throw new AppError('Record sudah diarsipkan.', 400);
  if (row[STATUS_FIELD] !== 'Pending') {
    throw new AppError(`Record ini sudah diproses (${row[STATUS_FIELD]}).`, 400);
  }

  await cfg.repo.update(logId, { [STATUS_FIELD]: newStatus, [NOTES_FIELD]: notes });

  const actionName = `${newStatus === 'Success' ? 'Approve' : 'Reject'} ${cfg.label}`;
  await audit.log(actor, actionName, `LogID: ${logId}${notes ? ` | Notes: ${notes}` : ''}`);

  return { success: true, message: newStatus === 'Success' ? 'Record berhasil di-approve!' : 'Record berhasil di-reject!' };
}

module.exports = { list, recentProcessed, recordHistory, process, parseCreatedDateToMs, nonArchivedRecords };
