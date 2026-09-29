const env = require('../config/env');

function parts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: env.timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const o = {};
  fmt.formatToParts(date).forEach((p) => {
    if (p.type !== 'literal') o[p.type] = p.value;
  });
  if (o.hour === '24') o.hour = '00';
  return o;
}

/** dd/MM/yyyy HH:mm:ss  (pengganti getFormattedNow di code.gs) */
function formatNow(date = new Date()) {
  const p = parts(date);
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}:${p.second}`;
}

/** yyyy-MM-dd  (dipakai kolom CreatedDate) */
function formatDateISO(date = new Date()) {
  const p = parts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

/** yyyyMMdd  (pengganti getTodayDateString di code.gs) */
function formatDateCompact(date = new Date()) {
  const p = parts(date);
  return `${p.year}${p.month}${p.day}`;
}

/** yyMMdd  (dipakai LogID harian: TIO.260929.01, PT.260929.01, dst) */
function formatDateShort(date = new Date()) {
  const p = parts(date);
  return `${p.year.slice(2)}${p.month}${p.day}`;
}

module.exports = { formatNow, formatDateISO, formatDateCompact, formatDateShort };
