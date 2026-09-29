# Roxit Ops

Fitness Club Monitoring — dimigrasi dari Google Apps Script ke Node.js.

| Lapisan | Teknologi | Deploy |
|---|---|---|
| Frontend | HTML/CSS/JS (vanilla) | GitHub Pages (otomatis via GitHub Actions) |
| Backend | Node.js 20+ · Express 5 | Render / Railway / Fly.io / VPS |
| Database | Google Sheets (sementara) → PostgreSQL | — |

## Struktur

```
roxit-ops/
├── backend/
│   ├── src/
│   │   ├── config/        env, koneksi Sheets, schema (header tiap sheet)
│   │   ├── repositories/  SATU-SATUNYA yang tahu data disimpan di Google Sheets
│   │   ├── services/      business logic (isi fungsi-fungsi lama code.gs)
│   │   ├── controllers/   tipis: request -> service -> response
│   │   ├── routes/        definisi endpoint REST
│   │   ├── middlewares/   auth (JWT), error handler
│   │   └── utils/         date, id generator, helpers
│   ├── scripts/           setupDatabase.js (port setup.gs), seedData.js
│   └── tests/             unit test (fake Google Sheets, tanpa internet)
├── frontend/              hasil pecahan index.html lama (tahap berikutnya)
├── docs/MIGRATION.md      pelacak: tiap fungsi code.gs -> modul & endpoint baru
└── .github/workflows/     deploy frontend + CI backend
```

Alur data: `route -> controller -> service -> repository -> Google Sheets`.
Karena hanya repository yang menyentuh Sheets, migrasi ke PostgreSQL nanti cukup mengganti isi `repositories/`.

**Status backend: selesai 100%** — semua 77 fungsi `code.gs` sudah dipindah/dipetakan (lihat `docs/MIGRATION.md` untuk rincian tiap fungsi dan endpoint penggantinya). 75 test otomatis, semua pakai Google Sheets palsu di memori (tidak menyentuh Sheet asli saat `npm test`).

## Setup lokal

### 1. Siapkan akses Google Sheets (sekali saja)
1. Buka [Google Cloud Console](https://console.cloud.google.com) → buat project → aktifkan **Google Sheets API**.
2. *IAM & Admin → Service Accounts* → buat service account → tab **Keys** → *Add key → JSON*. Simpan file JSON-nya (jangan di-commit!).
3. Buka Google Sheet database kamu → **Share** → tambahkan `client_email` dari file JSON tadi sebagai **Editor**.
4. Salin ID spreadsheet dari URL (`.../spreadsheets/d/<ID>/edit`).

### 2. Jalankan backend
```bash
cd backend
cp .env.example .env      # lalu isi SPREADSHEET_ID, GOOGLE_*, JWT_SECRET
npm install
npm run db:setup          # OPSIONAL: buat sheet + header + data dummy (aman untuk sheet yang sudah ada, data tidak dihapus)
npm run dev               # http://localhost:3000/api/health
npm test
```
> Kalau memakai spreadsheet lama yang sudah berisi data, **tidak perlu** `db:setup`; cukup share ke service account.

### 3. Jalankan frontend
Buka folder `frontend/` dengan ekstensi **Live Server** di VS Code (port 5500), atau `npx serve frontend`.

## Deploy lewat GitHub
1. Push ke repo GitHub (branch `main`).
2. **Frontend**: *Settings → Pages → Source: GitHub Actions*. Setiap push yang mengubah `frontend/` otomatis ter-deploy.
   Ganti URL backend di `frontend/src/scripts/config.js`.
3. **Backend**: deploy folder `backend/` ke host Node.js pilihanmu (root directory `backend`, build `npm install`, start `npm start`),
   isi semua variabel dari `.env.example` di dashboard host, dan set `CORS_ORIGIN` ke URL GitHub Pages kamu.

## Keamanan
- `.env` dan file key service account **tidak boleh** masuk Git (sudah ada di `.gitignore`).
- Password disimpan sebagai hash bcrypt. Data lama (plain text) otomatis di-upgrade saat user login.
- Semua endpoint kecuali `/api/auth/login` dan `/api/health` wajib token (`Authorization: Bearer <token>`).

Lanjutkan migrasi lewat [`docs/MIGRATION.md`](docs/MIGRATION.md).
