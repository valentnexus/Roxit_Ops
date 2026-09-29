/** Pengganti isTruthy di code.gs: sel Sheet bisa berisi 'true', 'TRUE', atau boolean. */
function isTruthy(val) {
  return String(val).trim().toLowerCase() === 'true';
}

module.exports = { isTruthy };
