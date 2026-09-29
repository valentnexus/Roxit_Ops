/** Fake Google Sheets client di memori (cukup untuk method yang dipakai SheetRepository). */
function makeFakeClient(initial) {
  const db = JSON.parse(JSON.stringify(initial)); // { SheetName: [[...], ...] }
  const ids = Object.fromEntries(Object.keys(db).map((n, i) => [n, 100 + i]));
  const nameOf = (id) => Object.keys(ids).find((n) => ids[n] === id);
  const sheetOf = (range) => range.match(/^'([^']+)'/)[1];

  return {
    db,
    spreadsheets: {
      get: async () => ({ data: { sheets: Object.keys(ids).map((t) => ({ properties: { title: t, sheetId: ids[t] } })) } }),
      batchUpdate: async ({ requestBody }) => {
        for (const r of requestBody.requests) {
          if (r.deleteDimension) {
            const { sheetId, startIndex, endIndex } = r.deleteDimension.range;
            db[nameOf(sheetId)].splice(startIndex, endIndex - startIndex);
          }
        }
        return { data: {} };
      },
      values: {
        get: async ({ range }) => ({ data: { values: db[sheetOf(range)].map((r) => [...r]) } }),
        append: async ({ range, requestBody }) => {
          db[sheetOf(range)].push(...requestBody.values);
          return { data: {} };
        },
        batchUpdate: async ({ requestBody }) => {
          for (const d of requestBody.data) {
            const [, col, row] = d.range.match(/!([A-Z]+)(\d+)$/);
            const c = col.charCodeAt(0) - 65;
            const rows = db[sheetOf(d.range)];
            while (rows[row - 1].length <= c) rows[row - 1].push('');
            rows[row - 1][c] = d.values[0][0];
          }
          return { data: {} };
        },
      },
    },
  };
}

module.exports = { makeFakeClient };
