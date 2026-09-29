# Pelacak Migrasi: `code.gs` → Node.js

Total fungsi di `code.gs`: **77** · ✅ selesai: **75** · ➖ tidak perlu: **2** · ⬜ belum: **0**

🎉 **Semua fungsi `code.gs` sudah dipindah ke Node.js.** Backend siap lanjut ke tahap frontend (pecah `index.html`).

Update kolom Status setiap kali satu fungsi selesai dipindah.

| # | Fungsi lama (`code.gs`) | Modul baru (`backend/src/…`) | Endpoint / catatan | Status |
|---|---|---|---|---|
| 1 | `doGet` | — | Digantikan frontend statis (GitHub Pages) | ➖ tidak perlu |
| 2 | `include` | — | Tidak dipakai lagi (template GAS); CSS/JS jadi file terpisah | ➖ tidak perlu |
| 3 | `getDb` | repositories/SheetRepository | Sheets API via service account | ✅ selesai |
| 4 | `createSession` | middlewares/auth + authService | JWT (jwt.sign saat login) | ✅ selesai |
| 5 | `validateSession` | middlewares/auth | JWT (jwt.verify di middleware authenticate) | ✅ selesai |
| 6 | `destroySession` | authService.logout | Stateless: client membuang token | ✅ selesai |
| 7 | `getApiRegistry` | routes/index | Digantikan REST routes | ✅ selesai |
| 8 | `apiCall` | routes/index + middlewares/auth | Digantikan REST routes + middleware authenticate | ✅ selesai |
| 9 | `isTruthy` | utils/helpers |  | ✅ selesai |
| 10 | `getFormattedNow` | utils/date.formatNow |  | ✅ selesai |
| 11 | `getTodayDateString` | utils/date.formatDateCompact |  | ✅ selesai |
| 12 | `generateSequentialID` | utils/idGenerator.nextSequentialId | Logika diperbaiki (lihat Temuan #1) | ✅ selesai |
| 13 | `logAudit` | services/auditService.log |  | ✅ selesai |
| 14 | `getApprovalConfigs` | approvalService | Helper internal | ✅ selesai |
| 15 | `parseCreatedDateToMs` | utils/date | Helper internal | ✅ selesai |
| 16 | `buildApprovalRecord` | approvalService | Helper internal | ✅ selesai |
| 17 | `getApprovalList` | approvalService | GET /approvals | ✅ selesai |
| 18 | `getRecentProcessed` | approvalService | GET /approvals/recent | ✅ selesai |
| 19 | `getRecordHistory` | approvalService | GET /approvals/history/:logId | ✅ selesai |
| 20 | `getAllOpsRecordsForDashboard` | dashboardService | Helper internal | ✅ selesai |
| 21 | `getDashboardWidgets` | dashboardService | GET /dashboard/widgets | ✅ selesai |
| 22 | `evaluateEditRule` | approvalService | Helper internal | ✅ selesai |
| 23 | `logEditStatusChange` | approvalService | Helper internal | ✅ selesai |
| 24 | `checkDeleteAllowed` | approvalService | Helper internal | ✅ selesai |
| 25 | `processApproval` | approvalService | POST /approvals/process | ✅ selesai |
| 26 | `getDashboardStats` | dashboardService | GET /dashboard/stats | ✅ selesai |
| 27 | `getManualCuttingData` | manualCuttingService | GET /manual-cutting | ✅ selesai |
| 28 | `getTimeInOutData` | timeInOutService | GET /time-in-out/summary | ✅ selesai |
| 29 | `submitManualCutting` | manualCuttingService | POST /manual-cutting | ✅ selesai |
| 30 | `generateTIOLogId` | timeInOutService | Helper internal (pakai nextSequentialId / format ID lama) | ✅ selesai |
| 31 | `submitTimeInOut` | timeInOutService | POST /time-in-out | ✅ selesai |
| 32 | `getTimeInOutLogList` | timeInOutService | GET /time-in-out | ✅ selesai |
| 33 | `updateTimeInOutLog` | timeInOutService | PUT /time-in-out/:id | ✅ selesai |
| 34 | `deleteTimeInOutLog` | timeInOutService | DELETE /time-in-out/:id | ✅ selesai |
| 35 | `restoreTimeInOutLog` | timeInOutService | POST /time-in-out/:id/restore | ✅ selesai |
| 36 | `updateCuttingStatus` | manualCuttingService | PATCH /manual-cutting/:id/status | ✅ selesai |
| 37 | `getUsersList` | userService | GET /users?status= | ✅ selesai |
| 38 | `saveUser` | userService | POST /users, PUT /users/:id | ✅ selesai |
| 39 | `getAppConfig` | configService | GET /config  (PUBLIC, tanpa token) | ✅ selesai |
| 40 | `convertDriveUrlToDirect` | utils | Helper internal untuk getAppConfig / foto profil | ✅ selesai |
| 41 | `changePassword` | authService | POST /auth/change-password (hash bcrypt) | ✅ selesai |
| 42 | `logUserLogout` | authService | POST /auth/logout | ✅ selesai |
| 43 | `getRolesList` | roleService | GET /roles | ✅ selesai |
| 44 | `getPermissionMatrix` | permissionService | GET /permissions/:roleName | ✅ selesai |
| 45 | `savePermissionMatrix` | permissionService | PUT /permissions/:roleName | ✅ selesai |
| 46 | `saveRole` | roleService | POST /roles, PUT /roles/:id | ✅ selesai |
| 47 | `deleteRole` | roleService | DELETE /roles/:id | ✅ selesai |
| 48 | `getClubsList` | clubService | GET /clubs | ✅ selesai |
| 49 | `saveClub` | clubService | POST /clubs, PUT /clubs/:id | ✅ selesai |
| 50 | `deleteClub` | clubService | DELETE /clubs/:id | ✅ selesai |
| 51 | `getAuditTrailData` | auditService | GET /audit-trail | ✅ selesai |
| 52 | `getStaffActivities` | userService | GET /users/:name/activities | ✅ selesai |
| 53 | `loginUser` | authService | POST /auth/login | ✅ selesai |
| 54 | `getUserProfile` | userService | GET /users/profile | ✅ selesai |
| 55 | `deleteStaff` | userService | DELETE /users/:id | ✅ selesai |
| 56 | `restoreStaff` | userService | POST /users/:id/restore | ✅ selesai |
| 57 | `getSessionTypesList` | sessionTypeService | GET /session-types | ✅ selesai |
| 58 | `saveSessionType` | sessionTypeService | POST /session-types, PUT /session-types/:id | ✅ selesai |
| 59 | `deleteSessionType` | sessionTypeService | DELETE /session-types/:id | ✅ selesai |
| 60 | `generatePTLogId` | personalTrainingService | Helper internal | ✅ selesai |
| 61 | `submitPersonalTraining` | personalTrainingService | POST /personal-training | ✅ selesai |
| 62 | `generateGTLogId` | groupTrainingService | Helper internal | ✅ selesai |
| 63 | `submitGroupTraining` | groupTrainingService | POST /group-training | ✅ selesai |
| 64 | `generateMGLogId` | manualGroupService | Helper internal | ✅ selesai |
| 65 | `submitManualGroup` | manualGroupService | POST /manual-group | ✅ selesai |
| 66 | `getGroupTrainingLogList` | groupTrainingService | GET /group-training | ✅ selesai |
| 67 | `updateGroupTrainingLog` | groupTrainingService | PUT /group-training/:id | ✅ selesai |
| 68 | `deleteGroupTrainingLog` | groupTrainingService | DELETE /group-training/:id | ✅ selesai |
| 69 | `restoreGroupTrainingLog` | groupTrainingService | POST /group-training/:id/restore | ✅ selesai |
| 70 | `getManualGroupLogList` | manualGroupService | GET /manual-group | ✅ selesai |
| 71 | `updateManualGroupLog` | manualGroupService | PUT /manual-group/:id | ✅ selesai |
| 72 | `deleteManualGroupLog` | manualGroupService | DELETE /manual-group/:id | ✅ selesai |
| 73 | `restoreManualGroupLog` | manualGroupService | POST /manual-group/:id/restore | ✅ selesai |
| 74 | `getPersonalTrainingLogList` | personalTrainingService | GET /personal-training | ✅ selesai |
| 75 | `updatePersonalTrainingLog` | personalTrainingService | PUT /personal-training/:id | ✅ selesai |
| 76 | `deletePersonalTrainingLog` | personalTrainingService | DELETE /personal-training/:id | ✅ selesai |
| 77 | `restorePersonalTrainingLog` | personalTrainingService | POST /personal-training/:id/restore | ✅ selesai |

## Endpoint yang sudah jadi

Semua butuh header `Authorization: Bearer <token>`, kecuali yang ditandai PUBLIC.

| Method | Path | Pengganti fungsi lama |
|---|---|---|
| POST | `/api/auth/login` | `loginUser` (PUBLIC) |
| POST | `/api/auth/logout` | `logUserLogout` |
| GET | `/api/auth/me` | — (baru, baca user dari token) |
| POST | `/api/auth/change-password` | `changePassword` — body: `{ currentPassword, newPassword }` |
| GET | `/api/clubs` | `getClubsList` |
| POST | `/api/clubs` | `saveClub` (tambah) |
| PUT | `/api/clubs/:id` | `saveClub` (edit) |
| DELETE | `/api/clubs/:id` | `deleteClub` |
| GET | `/api/roles` | `getRolesList` |
| POST | `/api/roles` | `saveRole` (tambah) |
| PUT | `/api/roles/:id` | `saveRole` (edit) |
| DELETE | `/api/roles/:id` | `deleteRole` |
| GET | `/api/roles/:roleName/permissions` | `getPermissionMatrix` |
| PUT | `/api/roles/:roleName/permissions` | `savePermissionMatrix` — body: `{ rows: [...] }` |
| GET | `/api/session-types` | `getSessionTypesList` |
| POST | `/api/session-types` | `saveSessionType` (tambah) |
| PUT | `/api/session-types/:id` | `saveSessionType` (edit) |
| DELETE | `/api/session-types/:id` | `deleteSessionType` |
| GET | `/api/users?status=active\|archived` | `getUsersList` |
| GET | `/api/users/profile?email=...` | `getUserProfile` |
| POST | `/api/users` | `saveUser` (tambah) |
| PUT | `/api/users/:id` | `saveUser` (edit) |
| POST | `/api/users/:id/archive` | `deleteStaff` (soft delete) |
| POST | `/api/users/:id/restore` | `restoreStaff` |
| GET | `/api/users/:name/activities` | `getStaffActivities` |
| GET | `/api/manual-cutting?page=&limit=&search=&status=&user=` | `getManualCuttingData` |
| POST | `/api/manual-cutting` | `submitManualCutting` |
| PATCH | `/api/manual-cutting/:id/status` | `updateCuttingStatus` — body: `{ status: 'Processed'\|'Rejected', adminNotes }` |
| GET | `/api/time-in-out` | `getTimeInOutLogList` (daftar lengkap, halaman kelola) |
| GET | `/api/time-in-out/summary?page=&limit=&user=` | `getTimeInOutData` (ringkasan berpaginasi) |
| POST | `/api/time-in-out` | `submitTimeInOut` |
| PUT | `/api/time-in-out/:id` | `updateTimeInOutLog` — body bisa berisi `resubmit: true` atau `cancelApproval: true` |
| POST | `/api/time-in-out/:id/archive` | `deleteTimeInOutLog` (soft delete) |
| POST | `/api/time-in-out/:id/restore` | `restoreTimeInOutLog` |
| GET / POST / PUT / archive / restore `/api/personal-training[...]` | sama polanya seperti time-in-out | `*PersonalTrainingLog` |
| GET / POST / PUT / archive / restore `/api/group-training[...]` | sama polanya seperti time-in-out | `*GroupTrainingLog` |
| GET / POST / PUT / archive / restore `/api/manual-group[...]` | sama polanya seperti time-in-out | `*ManualGroupLog` |
| GET | `/api/approvals` | `getApprovalList` — gabungan record Pending/Success/Rejected non-archived dari 4 sheet (PT/GT/MG/TIO) |
| GET | `/api/approvals/recent?limit=20` | `getRecentProcessed` |
| GET | `/api/approvals/history/:logId` | `getRecordHistory` |
| POST | `/api/approvals/process` | `processApproval` — body: `{ type: 'PT'\|'GT'\|'MG'\|'TIO', logId, status: 'Success'\|'Rejected', notes }` |
| GET | `/api/dashboard/stats` | `getDashboardStats` |
| GET | `/api/dashboard/widgets` | `getDashboardWidgets` |
| GET | `/api/config` | `getAppConfig` (PUBLIC — logo & nama app di halaman login) |
| GET | `/api/audit-trail` | `getAuditTrailData` |

## Cara memindahkan satu modul (resep)

1. **Repository** — pastikan sheet-nya sudah ada di `config/schema.js` dan `repositories/index.js` (sudah ada semua).
2. **Service** — salin logika dari fungsi lama ke `services/xxxService.js`. Ganti:
   - `sheet.getDataRange().getDisplayValues()` + loop → `repos.xxx.findAll()` / `findById()` / `findOneBy()`
   - `sheet.appendRow([...])` → `repos.xxx.create({ Kolom: nilai })`
   - `sheet.getRange(row,col).setValue()` → `repos.xxx.update(id, { Kolom: nilai })`
   - `sheet.deleteRow()` → `repos.xxx.remove(id)`
   - `generateSequentialID(...)` → `nextSequentialId('PREFIX', repos.xxx)`
   - `logAudit(...)` → `audit.log(...)`
   - `return { success:false, message }` di catch → `throw new AppError(message, status)`
   - parameter `currentUser` dari client → pakai `req.user.name` (dari token)
3. **Controller** — tipis saja: ambil dari `req`, panggil service, `res.json(...)`.
4. **Routes** — buat `routes/xxxRoutes.js`, daftarkan di `routes/index.js`.
5. **Test** — tambah test di `backend/tests/` (fake Sheets sudah tersedia di `tests/helpers/fakeSheets.js`).
6. **Frontend** — ganti pemanggilan `apiCall('namaFungsi', token, [...])` dengan `Api.get/post/put/delete(...)`.

## Temuan saat membaca kode lama (perlu keputusan / perhatian)

1. **Bug ID duplikat.** `generateSequentialID` menghitung baris "hari ini" dengan mencocokkan kolom terakhir dengan format `dd/MM/yyyy`.
   Untuk `Club` kolom terakhir adalah `CreatedDate` berformat `yyyy-MM-dd`, jadi hitungannya selalu 0 dan club baru selalu mendapat `CLUB-0001`
   (duplikat dengan yang sudah ada). Versi baru memakai *nomor terbesar yang ada + 1*. Cek juga fungsi `generate*LogId` saat modul log dipindah.
2. **Password plain text** di sheet `Users`. Versi baru: login menerima format lama, lalu otomatis mengubahnya jadi bcrypt saat user berhasil login.
   Setelah semua user pernah login, tidak ada lagi plain text.
3. **`currentUser` dikirim dari client** (mis. `deleteClub(clubId, currentUser)`) sehingga bisa dipalsukan untuk audit trail. Versi baru memakai identitas dari token.
4. **Hak akses per role belum ditegakkan di server.** Di `apiCall` lama hanya sesi yang divalidasi; matriks `Permission` tampaknya dipakai di UI.
   Disarankan membuat middleware `requirePermission(module, action)` yang membaca sheet `Permission`. Cek juga apakah ada pengecekan role di dalam fungsi lama.
5. **Akun terarsip sekarang tidak bisa login** (perilaku baru; `loginUser` lama tidak mengecek `IsArchived`). Hapus pengecekan di `authService.login` bila tidak diinginkan.
6. **Konkurensi Google Sheets.** Sheets tidak punya transaksi; dua tulis bersamaan bisa saling menimpa. Ini salah satu alasan utama migrasi ke PostgreSQL di tahap berikutnya.
7. **Sesi lama 6 jam sliding** (diperpanjang tiap request). JWT saat ini 6 jam tetap (tidak sliding). Bisa ditambah refresh token bila perlu.
8. **Sheet `Permission` tidak punya kolom ID unik per baris** (kunci sebenarnya kombinasi `RoleName`+`Module`). `SheetRepository.update(id, ...)` mengasumsikan kolom pertama unik, jadi tidak cocok dipakai untuk sheet ini. Ditambahkan method baru `updateByMatch(predicate, changes)` khusus untuk kasus seperti ini — dipakai di `permissionService`. Kalau nanti ada sheet lain dengan pola serupa (kunci gabungan), pakai method ini juga.
9. **Password sekarang tidak pernah dikirim ke client.** `getUsersList`/`getUserProfile` lama mengirim kolom `Password` mentah (plain text) ke frontend — risiko keamanan besar. `userService.toPublic()` sekarang selalu membuang field itu dari respons, termasuk saat sudah berbentuk hash.
10. **`saveUser` edit mode sekarang tidak menimpa password dengan string kosong.** Kode lama menulis ulang seluruh baris termasuk password; kalau field password di form edit kosong, dulu ditangani dengan fallback ke nilai lama secara manual. Versi baru: password hanya diubah kalau field `password` dikirim (dan langsung di-hash); kalau tidak dikirim, kolom itu tidak disentuh sama sekali.
11. **`evaluateEditRule`, `checkDeleteAllowed`, `logEditStatusChange` dipakai bersama oleh 4 sheet log** (TimeInOut, PersonalTrainingLog, GroupTrainingLog, ManualGroupLog) — aturannya: record `Pending` bisa diedit bebas, `Rejected` cuma bisa diedit lewat Resubmit (balik ke Pending), `Success` cuma bisa diedit lewat Cancel Approval (balik ke Pending juga), dan record `Success` tidak bisa diarsipkan sebelum di-Cancel Approval dulu. Dipindah jadi `utils/approvalRules.js` (pure function, gampang di-test) dan dipakai ulang oleh `timeInOutService`, `personalTrainingService`, `groupTrainingService`, `manualGroupService`.
12. **`generateTIOLogId`/`generatePTLogId`/`generateGTLogId`/`generateMGLogId` sebenarnya sudah benar** (beda dari bug ID Club di temuan #1) — karena tanggal ikut jadi bagian ID (`TIO.260929.01`), jadi pencocokan prefix persis aman dipakai untuk hitung nomor urut hari itu. Diporting apa adanya jadi `utils/idGenerator.nextDailyId()`.
13. **Manual Cutting TIDAK memakai alur approval yang sama** dengan 4 sheet log lainnya — dia tidak ada di `getApprovalConfigs()` sheet lama, statusnya langsung diubah admin lewat `updateCuttingStatus` (`Pending → Processed/Rejected`) tanpa Resubmit/Cancel Approval. Ini dipertahankan apa adanya di `manualCuttingService` (terpisah dari `approvalRules.js`).
14. **`getApprovalConfigs` lama memetakan kolom lewat indeks array** (mis. `staff: 2, member: 3, status: 9`) karena waktu itu datanya masih raw array dari Sheets. Karena repository kita sudah mengembalikan object ber-nama field, `approvalService.js` menulis ulang config itu pakai nama field langsung (`staffField: 'PT_Name'`, dst) — perilakunya identik, tapi kalau urutan kolom sheet berubah di masa depan, versi baru ini tidak akan diam-diam salah ambil kolom seperti versi lama berpotensi terjadi.
15. **`processApproval` lama pakai `LockService.getScriptLock()`** untuk mencegah race condition saat 2 admin approve record yang sama bersamaan. Versi Node saat ini belum ada penggantinya (lihat temuan #6 soal konkurensi Sheets secara umum) — risikonya kecil untuk approval satu-satu, tapi kalau nanti terasa perlu, bisa ditambah semacam in-memory mutex per `logId` di `approvalService.process()`.
16. **`getDashboardWidgets`/`getDashboardStats`/`getApprovalList` sama-sama butuh "semua record non-archived dari 4 sistem"** — supaya tidak triplikasi logika, dibuat 1 fungsi bersama `approvalService.nonArchivedRecords()` yang dipakai oleh ketiganya (`approvalService.list()` tinggal mengurutkannya, `dashboardService` memfilternya lebih lanjut untuk tiap widget).
17. **`getAuditTrailData(params)` di kode lama menerima parameter `params` tapi tidak pernah memakainya** untuk filter apa pun — cuma selalu mengembalikan 50 entri audit terbaru. Diporting apa adanya (bukan bug yang perlu diperbaiki, memang begitu perilakunya).

## Bug frontend ditemukan saat testing manual (setelah split app.js -> modules/)

1. **Export CSV di halaman Report bikin error di Console** (`Cannot read properties of null (reading 'querySelector')`).
   Penyebab: listener global "tutup dropdown profil kalau klik di luar" (dulu nempel di akhir `app.js`, dekat kode
   Master Data — bukan tempat yang tepat, sudah dipindah ke `navigation.js`) memakai
   `event.target.closest('div').querySelector('button')`. Elemen `<a>` sementara yang dibuat `exportReportCsv()`
   buat trigger download ditempel langsung ke `<body>` (tanpa pembungkus `<div>`), jadi `closest('div')`
   mengembalikan `null` dan crash. **Ini bug bawaan dari kode lama** (bukan disebabkan proses pemecahan modul),
   baru ketauan sekarang karena fitur Export CSV baru dites manual belakangan.
   **Perbaikan:** logic diganti jadi langsung cek `event.target.closest('button[onclick*="toggleProfileMenu"]')`
   (lebih aman, `closest()` mengembalikan `null` dengan tenang kalau tidak ketemu, tidak pernah crash) dan
   ditambah guard `if (!profileMenu) return;`.
