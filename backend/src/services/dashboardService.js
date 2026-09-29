const repos = require('../repositories');
const { isTruthy } = require('../utils/helpers');
const { formatDateISO } = require('../utils/date');
const approvalService = require('./approvalService');

/** yyyy-MM (dipakai untuk cek "bulan ini") */
function monthPrefix(date = new Date()) {
  return formatDateISO(date).slice(0, 7);
}

/** dd/MM/yyyy (format Timestamp AuditTrail & CreatedDate log) */
function formatDMY(date = new Date()) {
  const iso = formatDateISO(date); // yyyy-MM-dd
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function daysAgoISO(days, from = new Date()) {
  return formatDateISO(new Date(from.getTime() - days * 24 * 60 * 60 * 1000));
}

/** Pengganti getDashboardStats(): 4 angka ringkas untuk kartu atas Dashboard. */
async function stats() {
  const allRecords = await approvalService.nonArchivedRecords();
  const totalPending = allRecords.filter((r) => r.Status === 'Pending').length;

  const users = await repos.users.findAll();
  const totalActiveStaff = users.filter((u) => u.UserID && !isTruthy(u.IsArchived)).length;

  const today = formatDMY();
  const auditRows = await repos.auditTrail.findAll();
  let approvedToday = 0;
  let rejectedToday = 0;
  auditRows.forEach((row) => {
    if (!String(row.Timestamp || '').startsWith(today)) return;
    const action = String(row.Action || '');
    if (action.startsWith('Approve ')) approvedToday++;
    else if (action.startsWith('Reject ')) rejectedToday++;
  });

  return { success: true, stats: { totalPending, approvedToday, rejectedToday, totalActiveStaff } };
}

/** Pengganti getDashboardWidgets(): ringkasan cepat, tren 7 hari, leaderboard, antrian terlama. */
async function widgets() {
  const now = new Date();
  const todayStr = formatDateISO(now);
  const todayDMY = formatDMY(now);
  const thisMonth = monthPrefix(now);
  const sevenDaysAgoStr = daysAgoISO(6, now);

  const allRecords = await approvalService.nonArchivedRecords();

  // ---------- 1. Ringkasan Cepat ----------
  const sesiHariIni = allRecords.filter((r) => r.Type !== 'TIO' && r.SessionDate === todayStr).length;
  const sesiBulanIni = allRecords.filter((r) => r.Type !== 'TIO' && String(r.SessionDate).startsWith(thisMonth)).length;
  const sesiMingguIni = allRecords.filter(
    (r) => r.Type !== 'TIO' && String(r.SessionDate) >= sevenDaysAgoStr && String(r.SessionDate) <= todayStr,
  ).length;

  const cutoffMs = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const auditRows = await repos.auditTrail.findAll();
  let approvedCount30d = 0;
  let rejectedCount30d = 0;
  auditRows.forEach((row) => {
    const action = String(row.Action || '');
    const isApprove = action.startsWith('Approve ');
    const isReject = action.startsWith('Reject ');
    if (!isApprove && !isReject) return;
    if (approvalService.parseCreatedDateToMs(row.Timestamp) < cutoffMs) return;
    if (isApprove) approvedCount30d++; else rejectedCount30d++;
  });
  const totalProcessed30d = approvedCount30d + rejectedCount30d;
  const approvalRate30d = totalProcessed30d > 0 ? Math.round((approvedCount30d / totalProcessed30d) * 100) : null;

  // ---------- 2. Grafik Tren (7 hari terakhir) ----------
  const trendLabels = [];
  const trendDates = [];
  for (let d = 6; d >= 0; d--) {
    const day = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    trendDates.push(formatDateISO(day));
    const [, m, dd] = formatDateISO(day).split('-');
    trendLabels.push(`${dd}/${m}`);
  }
  const trendPT = trendDates.map((ds) => allRecords.filter((r) => r.Type === 'PT' && r.SessionDate === ds).length);
  const trendGT = trendDates.map((ds) => allRecords.filter((r) => r.Type === 'GT' && r.SessionDate === ds).length);
  const trendMG = trendDates.map((ds) => allRecords.filter((r) => r.Type === 'MG' && r.SessionDate === ds).length);

  // ---------- 3. Leaderboard ----------
  // Top Pengaju Form Hari Ini: jumlah form PT/GT/MG yang DIAJUKAN hari ini (status apapun, TIO tidak dihitung)
  const submittedToday = allRecords.filter((r) => r.Type !== 'TIO' && String(r.CreatedDate).startsWith(todayDMY));
  const staffCountMap = {};
  submittedToday.forEach((r) => {
    const name = r.Staff || 'Unknown';
    staffCountMap[name] = (staffCountMap[name] || 0) + 1;
  });
  const topStaff = Object.entries(staffCountMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Reject Rate Tertinggi bulan ini (PT/GT/MG, minimal 2 record diproses & minimal 1 reject)
  const processedThisMonth = allRecords.filter(
    (r) => r.Type !== 'TIO' && String(r.SessionDate).startsWith(thisMonth) && (r.Status === 'Success' || r.Status === 'Rejected'),
  );
  const rejectStatMap = {};
  processedThisMonth.forEach((r) => {
    const name = r.Staff || 'Unknown';
    if (!rejectStatMap[name]) rejectStatMap[name] = { total: 0, rejected: 0 };
    rejectStatMap[name].total++;
    if (r.Status === 'Rejected') rejectStatMap[name].rejected++;
  });
  const topReject = Object.entries(rejectStatMap)
    .map(([name, s]) => ({ name, total: s.total, rejected: s.rejected, rate: Math.round((s.rejected / s.total) * 100) }))
    .filter((s) => s.total >= 2 && s.rejected > 0)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);

  // ---------- 4. Widget Operasional: Antrian Terlama (Pending terlama, lintas 4 sistem) ----------
  const pendingRecords = allRecords.filter((r) => r.Status === 'Pending').sort((a, b) => a.SortKey - b.SortKey);
  const attentionList = pendingRecords.slice(0, 5).map((r) => {
    const waitDays = Math.max(0, Math.floor((now.getTime() - r.SortKey) / (24 * 60 * 60 * 1000)));
    return { LogID: r.LogID, Type: r.Type, TypeLabel: r.TypeLabel, Staff: r.Staff, Member: r.Member, CreatedDate: r.CreatedDate, waitDays };
  });

  return {
    success: true,
    quickStats: { sesiHariIni, sesiBulanIni, sesiMingguIni, approvalRate30d, totalProcessed30d },
    trend: { labels: trendLabels, pt: trendPT, gt: trendGT, mg: trendMG },
    leaderboard: { topStaff, topReject },
    attentionList,
  };
}

module.exports = { stats, widgets };
