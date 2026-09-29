/**
 * Gabungkan semua potongan HTML di src/pages/ + src/partials/ jadi satu file frontend/index.html.
 * Kenapa build-time, bukan fetch() saat runtime: app.js (dipindah dari <script> lama) banyak
 * memakai document.getElementById() secara langsung begitu halaman dimuat, jadi semua section
 * harus sudah ada di DOM dari awal (switchPage() cuma toggle class 'hidden', bukan lazy-load).
 * File-file kecil ini murni supaya gampang di-develop; hasil akhirnya tetap 1 file HTML utuh.
 *
 * Jalankan: node scripts/build.js   (dari folder frontend/)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\n$/, '');

const PAGE_ORDER = [
  'dashboard', 'pt-portal', 'time-tracking', 'admin-ops',
  'report', 'profile', 'change-password', 'staff', 'staff-detail', 'master-data',
];

const pages = PAGE_ORDER.map((name) => read(`src/pages/${name}.html`)).join('\n');

const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Roxit Ops - Fitness Club Monitoring</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"><\/script>
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <!-- Chart.js (untuk grafik tren di Dashboard) -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"><\/script>
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="src/styles/main.css">
</head>
<body>

${read('src/pages/login.html')}

${read('src/partials/sidebar-header.html')}
${pages}

    </main>
  </div>

${read('src/partials/modals.html')}

  <script src="src/scripts/config.js"><\/script>
  <script src="src/scripts/api.js"><\/script>
  <script src="src/scripts/api-adapter.js"><\/script>
  <script src="src/scripts/modules/core.js"><\/script>
  <script src="src/scripts/modules/navigation.js"><\/script>
  <script src="src/scripts/modules/auth.js"><\/script>
  <script src="src/scripts/modules/dashboard.js"><\/script>
  <script src="src/scripts/modules/pt-portal.js"><\/script>
  <script src="src/scripts/modules/admin-ops.js"><\/script>
  <script src="src/scripts/modules/report.js"><\/script>
  <script src="src/scripts/modules/user-modal.js"><\/script>
  <script src="src/scripts/modules/staff.js"><\/script>
  <script src="src/scripts/modules/master-data.js"><\/script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'index.html'), html);
console.log(`Berhasil: index.html dibuat (${html.split('\n').length} baris).`);
