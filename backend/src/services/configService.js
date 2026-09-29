const repos = require('../repositories');

/** Pengganti convertDriveUrlToDirect(): ubah link share Google Drive jadi link gambar langsung. */
function convertDriveUrlToDirect(url) {
  if (!url) return '';
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return `https://lh3.googleusercontent.com/d/${match[1]}`;
  return url; // sudah URL langsung / format lain, pakai apa adanya
}

/** Pengganti getAppConfig(): logo & pengaturan tampilan halaman login. PUBLIC, dipanggil sebelum login. */
async function getConfig() {
  const rows = await repos.config.findAll();
  const config = {};
  rows.forEach((r) => {
    const key = r.Keterangan;
    if (!key) return;
    config[key.trim().toLowerCase()] = convertDriveUrlToDirect(r['URL Photo']);
  });
  return { success: true, config };
}

module.exports = { getConfig, convertDriveUrlToDirect };
