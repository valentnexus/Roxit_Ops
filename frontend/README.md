# Frontend — Roxit Ops

Struktur sumber (untuk develop):

```
frontend/
├── index.html              <- HASIL BUILD, jangan diedit langsung (akan ketimpa)
├── scripts/
│   └── build.js             <- gabungkan src/pages + src/partials jadi index.html
└── src/
    ├── styles/main.css       <- semua CSS (dulu inline <style> di index.html lama)
    ├── pages/                <- 1 file = 1 halaman (section yang di-toggle switchPage())
    │   ├── login.html
    │   ├── dashboard.html
    │   ├── pt-portal.html     (halaman "Manual Cutting": hub form Personal/Group/Manual Group Training)
    │   ├── time-tracking.html
    │   ├── admin-ops.html     (approval PT/GT/MG/TIO)
    │   ├── report.html
    │   ├── profile.html
    │   ├── change-password.html
    │   ├── staff.html
    │   ├── staff-detail.html
    │   └── master-data.html   (tab Role/Permission/Club/Session Type)
    ├── partials/
    │   ├── sidebar-header.html  <- sidebar menu + header atas, tampil di semua halaman
    │   └── modals.html          <- semua modal (User/Role/Club/Session Type form, edit PT/GT/MG/TIO, confirm dialog)
    └── scripts/
        ├── config.js         <- alamat backend API
        ├── api.js            <- wrapper fetch() (pengganti google.script.run)
        └── app.js             <- SELURUH logic UI lama (4683 baris, belum dipecah lagi — tahap berikutnya)
```

## Kenapa build-time, bukan runtime fetch()
`app.js` banyak memakai `document.getElementById(...)` begitu halaman dimuat, dan `switchPage()` cuma
toggle class `hidden` (bukan lazy-load). Supaya semua elemen sudah ada di DOM sejak awal — persis
seperti perilaku aslinya — potongan-potongan kecil ini digabung jadi **satu file `index.html` utuh**
lewat build script, bukan di-fetch satu-satu saat runtime.

## Cara pakai
Edit file-file kecil di `src/`, lalu jalankan:
```bash
cd frontend
node scripts/build.js
```
Ini akan menulis ulang `frontend/index.html`. Buka file itu (lewat Live Server) untuk lihat hasilnya.

## Adapter API (api-adapter.js)
Hampir semua 4683 baris app.js manggil backend lewat SATU fungsi pusat: `runServer(functionName, args, onSuccess, onFailure)`.
Dulu itu memanggil `google.script.run.apiCall(functionName, token, args)`. Sekarang `runServer()` didefinisikan
ulang di `api-adapter.js`, isinya peta (`API_MAP`) yang menerjemahkan tiap nama fungsi lama (`loginUser`,
`getClubsList`, `saveUser`, dst — 46 total) ke endpoint REST backend kita lewat `window.Api`.

**Keuntungannya:** ke-61 titik pemanggilan `runServer(...)` di app.js TIDAK PERLU diubah sama sekali — signature-nya
sama persis. Kalau nanti nambah modul baru di backend, cukup tambah 1 baris di `API_MAP`.

58 pengecekan `if (typeof google !== 'undefined' && google.script...)` yang dulu membungkus tiap pemanggilan
(fallback untuk preview di luar Apps Script) sudah diganti jadi `if (true)` (atau `if (currentUser)` untuk 1 kasus
yang punya pengecekan tambahan) — dicek 0 sisa `typeof google` di seluruh file gabungan.

## Catatan pemecahan app.js -> modules/
Beberapa nama section asli MENYESATKAN (peninggalan versi lama app), jadi pengelompokan modul
di sini ikut FUNGSI ASLINYA, bukan ikut nama komentarnya:
- Section berjudul "MANUAL CUTTING HANDLERS" ternyata isinya form submit PT/Group/Manual Group Training
  → dipindah ke `pt-portal.js`, bukan file terpisah "manual-cutting".
- Section berjudul "MASTER DATA HANDLERS" ternyata isinya cuma `submitUserForm` (submit modal Staff)
  → dipindah ke `user-modal.js`, bukan `master-data.js`.

Urutan load di index.html WAJIB: `api-adapter.js` sebelum `auth.js` (karena `auth.js` langsung
memanggil `loadAppConfig()` saat script itu di-parse, butuh `runServer` sudah ada). Modul lainnya
aman dimuat urutan berapa pun karena isinya murni definisi fungsi, baru dipanggil belakangan saat
user klik sesuatu (semua script sudah selesai dimuat duluan).

## Status saat ini
✅ HTML dipecah, CSS dipisah (byte-identik & struktur tag seimbang dengan file asli — diverifikasi otomatis).
✅ Adapter API dibuat, semua 46 fungsi ter-mapping (cross-check dengan yang benar-benar dipanggil: 0 yang kelewat).
✅ 58 guard `google.script` yang blocking sudah diperbaiki.
✅ Login sudah dites manual di browser sungguhan dan BERHASIL tembus ke backend + Google Sheets.
✅ `app.js` (4664 baris) sudah dipecah jadi 10 modul per topik (lihat struktur di atas) — 227 fungsi
   diverifikasi cocok 100% (tidak ada yang hilang/dobel), tiap file lolos cek sintaks sendiri-sendiri.
⬜ Halaman selain Login belum semuanya dites manual satu-satu di browser — lanjutkan pengetesan.
