const { getSheetsClient } = require('../config/sheets');
const env = require('../config/env');
const SCHEMA = require('../config/schema');

/**
 * SATU-SATUNYA tempat yang boleh tahu bahwa datanya disimpan di Google Sheets.
 * Service/controller hanya memanggil method di sini (findAll, findById, create, update, remove).
 *
 * Saat pindah ke PostgreSQL nanti, cukup buat class dengan method yang sama
 * (findAll/findById/findOneBy/create/update/remove) lalu ganti isi folder repositories/.
 *
 * Catatan: dibaca sebagai FORMATTED_VALUE (setara getDisplayValues di Apps Script),
 * jadi semua nilai selalu string. Ditulis sebagai RAW agar string tidak diubah Sheets
 * (mis. nomor telepon '0812...' tidak kehilangan angka 0 di depan).
 */

const readCache = new Map(); // sheetName -> { at, values }
const sheetIdCache = new Map(); // sheetName -> sheetId

function colLetter(n) {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

class SheetRepository {
  constructor(sheetName) {
    this.sheetName = sheetName;
    this.headers = SCHEMA[sheetName];
    if (!this.headers) throw new Error(`Sheet "${sheetName}" belum didefinisikan di config/schema.js`);
    this.idField = this.headers[0];
  }

  // ---------- internal ----------
  async _values({ fresh = false } = {}) {
    const cached = readCache.get(this.sheetName);
    if (!fresh && cached && Date.now() - cached.at < env.cacheTtlMs) return cached.values;

    const res = await getSheetsClient().spreadsheets.values.get({
      spreadsheetId: env.spreadsheetId,
      range: `'${this.sheetName}'`,
      valueRenderOption: 'FORMATTED_VALUE',
    });
    const values = res.data.values || [];
    readCache.set(this.sheetName, { at: Date.now(), values });
    return values;
  }

  _invalidate() {
    readCache.delete(this.sheetName);
  }

  _toObject(row) {
    const obj = {};
    this.headers.forEach((h, i) => {
      obj[h] = row[i] === undefined || row[i] === null ? '' : String(row[i]);
    });
    return obj;
  }

  _rowFromObject(obj) {
    return this.headers.map((h) => (obj[h] === undefined || obj[h] === null ? '' : obj[h]));
  }

  /** Nomor baris (1-based, termasuk header) untuk ID tertentu, atau -1. */
  async _findRowNumber(id) {
    const values = await this._values({ fresh: true }); // selalu fresh sebelum tulis
    for (let i = 1; i < values.length; i++) {
      if (String((values[i] || [])[0] ?? '') === String(id)) return i + 1;
    }
    return -1;
  }

  /**
   * Nomor baris untuk baris pertama yang cocok dengan predicate (dipakai untuk sheet
   * tanpa kolom ID unik per baris, mis. Permission yang kuncinya kombinasi RoleName+Module).
   */
  async _findRowNumberByMatch(matchFn) {
    const values = await this._values({ fresh: true });
    for (let i = 1; i < values.length; i++) {
      if (!values[i] || values[i].length === 0) continue;
      if (matchFn(this._toObject(values[i]))) return i + 1;
    }
    return -1;
  }

  async _sheetId() {
    if (sheetIdCache.has(this.sheetName)) return sheetIdCache.get(this.sheetName);
    const meta = await getSheetsClient().spreadsheets.get({
      spreadsheetId: env.spreadsheetId,
      fields: 'sheets.properties(sheetId,title)',
    });
    meta.data.sheets.forEach((s) => sheetIdCache.set(s.properties.title, s.properties.sheetId));
    if (!sheetIdCache.has(this.sheetName)) throw new Error(`Sheet "${this.sheetName}" tidak ditemukan di spreadsheet.`);
    return sheetIdCache.get(this.sheetName);
  }

  // ---------- public API ----------
  /** Semua baris data (tanpa header) sebagai array of object. */
  async findAll({ fresh = false } = {}) {
    const values = await this._values({ fresh });
    return values.slice(1).filter((r) => r && r.length > 0).map((r) => this._toObject(r));
  }

  async findById(id) {
    const rows = await this.findAll();
    return rows.find((r) => r[this.idField] === String(id)) || null;
  }

  /** Cari satu baris berdasarkan kolom tertentu, mis. findOneBy('Email', x). */
  async findOneBy(field, value, { fresh = false } = {}) {
    if (!this.headers.includes(field)) throw new Error(`Kolom "${field}" tidak ada di sheet ${this.sheetName}`);
    const rows = await this.findAll({ fresh });
    return rows.find((r) => r[field] === String(value)) || null;
  }

  /** Tambah baris baru di paling bawah. */
  async create(obj) {
    await getSheetsClient().spreadsheets.values.append({
      spreadsheetId: env.spreadsheetId,
      range: `'${this.sheetName}'`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [this._rowFromObject(obj)] },
    });
    this._invalidate();
    return this._toObject(this._rowFromObject(obj));
  }

  /** Ubah sebagian kolom pada baris dengan ID tertentu. Return object terbaru, atau null bila ID tidak ada. */
  async update(id, changes) {
    const unknown = Object.keys(changes).filter((k) => !this.headers.includes(k));
    if (unknown.length) throw new Error(`Kolom tidak dikenal di ${this.sheetName}: ${unknown.join(', ')}`);

    const rowNumber = await this._findRowNumber(id);
    if (rowNumber === -1) return null;

    const data = Object.entries(changes).map(([key, value]) => ({
      range: `'${this.sheetName}'!${colLetter(this.headers.indexOf(key) + 1)}${rowNumber}`,
      values: [[value === undefined || value === null ? '' : value]],
    }));

    if (data.length) {
      await getSheetsClient().spreadsheets.values.batchUpdate({
        spreadsheetId: env.spreadsheetId,
        requestBody: { valueInputOption: 'RAW', data },
      });
    }
    this._invalidate();
    return this.findOneBy(this.idField, id, { fresh: true });
  }

  /**
   * Sama seperti update(), tapi baris dicari lewat predicate(obj) => boolean, bukan lewat ID kolom pertama.
   * Dipakai untuk sheet yang kuncinya kombinasi beberapa kolom (mis. Permission: RoleName + Module).
   * Return object terbaru, atau null bila tidak ada baris yang cocok.
   */
  async updateByMatch(matchFn, changes) {
    const unknown = Object.keys(changes).filter((k) => !this.headers.includes(k));
    if (unknown.length) throw new Error(`Kolom tidak dikenal di ${this.sheetName}: ${unknown.join(', ')}`);

    const rowNumber = await this._findRowNumberByMatch(matchFn);
    if (rowNumber === -1) return null;

    const data = Object.entries(changes).map(([key, value]) => ({
      range: `'${this.sheetName}'!${colLetter(this.headers.indexOf(key) + 1)}${rowNumber}`,
      values: [[value === undefined || value === null ? '' : value]],
    }));

    if (data.length) {
      await getSheetsClient().spreadsheets.values.batchUpdate({
        spreadsheetId: env.spreadsheetId,
        requestBody: { valueInputOption: 'RAW', data },
      });
    }
    this._invalidate();

    const values = await this._values({ fresh: true });
    return this._toObject(values[rowNumber - 1]);
  }

  /** Hapus baris permanen. Return true bila berhasil, false bila ID tidak ada. */
  async remove(id) {
    const rowNumber = await this._findRowNumber(id);
    if (rowNumber === -1) return false;

    await getSheetsClient().spreadsheets.batchUpdate({
      spreadsheetId: env.spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: { sheetId: await this._sheetId(), dimension: 'ROWS', startIndex: rowNumber - 1, endIndex: rowNumber },
          },
        }],
      },
    });
    this._invalidate();
    return true;
  }
}

module.exports = SheetRepository;
module.exports._clearCaches = () => { readCache.clear(); sheetIdCache.clear(); };
