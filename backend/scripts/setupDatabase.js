/**
 * Roxit Ops - Database Initializer & Safe Migration (port dari setup.gs)
 *
 *  - Sheet belum ada  -> dibuat + header + data dummy
 *  - Sheet sudah ada  -> hanya header baris 1 yang disamakan dengan config/schema.js (data TIDAK dihapus)
 *
 * Jalankan:  npm run db:setup
 */
const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const SCHEMA = require('../src/config/schema');
const seed = require('./seedData');
const { getSheetsClient } = require('../src/config/sheets');

const HEADER_BG = { red: 2 / 255, green: 132 / 255, blue: 199 / 255 }; // #0284c7
const WHITE = { red: 1, green: 1, blue: 1 };

async function main() {
  env.assertConfig();
  const sheets = getSheetsClient();
  const spreadsheetId = env.spreadsheetId;

  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties(sheetId,title)' });
  const existing = new Map(meta.data.sheets.map((s) => [s.properties.title, s.properties.sheetId]));

  for (const [name, headers] of Object.entries(SCHEMA)) {
    let sheetId = existing.get(name);
    let isNew = false;

    if (sheetId === undefined) {
      const res = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: name } } }] },
      });
      sheetId = res.data.replies[0].addSheet.properties.sheetId;
      isNew = true;
    }

    // Header (baris 1)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${name}'!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });

    // Styling header + freeze + auto resize
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: headers.length },
              cell: { userEnteredFormat: { backgroundColor: HEADER_BG, textFormat: { bold: true, foregroundColor: WHITE } } },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          { updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
          { autoResizeDimensions: { dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: headers.length } } },
        ],
      },
    });

    // Data dummy hanya untuk sheet yang baru dibuat
    let seeded = 0;
    if (isNew && seed[name] && seed[name].length) {
      let rows = seed[name];
      if (name === 'Users') {
        const hash = bcrypt.hashSync(seed.DEFAULT_PASSWORD, 10);
        rows = rows.map((r) => r.map((cell, i) => (headers[i] === 'Password' ? hash : cell)));
      }
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${name}'!A2`,
        valueInputOption: 'RAW',
        requestBody: { values: rows },
      });
      seeded = rows.length;
    }

    console.log(`${isNew ? '[BARU]  ' : '[UPDATE]'} ${name}${seeded ? `  (+${seeded} baris dummy)` : ''}`);
  }

  console.log('\nRoxit Ops Database Setup Complete!');
  console.log(`Password semua user dummy: ${seed.DEFAULT_PASSWORD}  (WAJIB diganti di production)`);
}

main().catch((err) => {
  console.error('Setup gagal:', err.message);
  process.exit(1);
});
