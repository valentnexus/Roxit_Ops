/**
 * Generate ID berurutan: PREFIX-0001, PREFIX-0002, ...
 * Berbasis nomor terbesar yang sudah ada (bukan hitungan per hari seperti
 * generateSequentialID di code.gs, yang bisa menghasilkan ID duplikat).
 */
async function nextSequentialId(prefix, repo) {
  const rows = await repo.findAll({ fresh: true });
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  let max = 0;
  rows.forEach((row) => {
    const m = re.exec(String(row[repo.idField] || ''));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

/**
 * ID harian reset tiap hari: PREFIX.yyMMdd.01, PREFIX.yyMMdd.02, ...
 * Dipakai LogID Time In/Out, Personal Training, Group Training, Manual Group.
 * Beda dari nextSequentialId(): tanggal ikut jadi bagian ID, jadi penghitungan
 * "berapa row hari ini" aman (cocokkan prefix persis, bukan kolom tanggal terpisah).
 */
async function nextDailyId(prefix, repo) {
  const { formatDateShort } = require('./date');
  const idPrefix = `${prefix}.${formatDateShort()}.`;
  const rows = await repo.findAll({ fresh: true });
  const countToday = rows.filter((row) => String(row[repo.idField] || '').startsWith(idPrefix)).length;
  return `${idPrefix}${String(countToday + 1).padStart(2, '0')}`;
}

module.exports = { nextSequentialId, nextDailyId };
