const repos = require('../repositories');
const AppError = require('../utils/AppError');
const { isTruthy } = require('../utils/helpers');
const audit = require('./auditService');

const ACTIONS = ['View', 'Add', 'Edit', 'Delete', 'Export'];

/** Pengganti getPermissionMatrix(). Cell kosong di sheet ('') => aksi tidak berlaku untuk module itu (null). */
async function getMatrix(roleName) {
  const rows = (await repos.permission.findAll())
    .filter((r) => r.RoleName === roleName)
    .map((r) => {
      const row = { Module: r.Module };
      ACTIONS.forEach((a) => { row[a] = r[a] === '' ? null : isTruthy(r[a]); });
      return row;
    });
  return { success: true, rows };
}

/**
 * Pengganti savePermissionMatrix(). Super Admin tidak bisa diubah (selalu full access).
 * Cell yang di sheet-nya kosong (N/A) sengaja tidak ditulis, meski dikirim dari frontend.
 */
async function saveMatrix(roleName, rows, actor) {
  if (!roleName) throw new AppError('Role tidak valid.', 400);
  if (roleName === 'Super Admin') {
    throw new AppError('Permission Super Admin tidak bisa diubah (selalu full access).', 403);
  }

  const current = await repos.permission.findAll({ fresh: true });
  for (const rowUpdate of rows || []) {
    const existing = current.find((r) => r.RoleName === roleName && r.Module === rowUpdate.Module);
    if (!existing) continue;

    const changes = {};
    ACTIONS.forEach((action) => {
      if (existing[action] === '') return; // N/A, jangan ditulis
      changes[action] = rowUpdate[action] ? 'true' : 'false';
    });
    if (Object.keys(changes).length) {
      // Kunci Permission = kombinasi RoleName + Module (bukan kolom ID tunggal), jadi pakai updateByMatch.
      await repos.permission.updateByMatch(
        (r) => r.RoleName === roleName && r.Module === rowUpdate.Module,
        changes,
      );
    }
  }

  await audit.log(actor, 'Update Permission', `Role: ${roleName}`);
  return { success: true, message: `Permission untuk role ${roleName} berhasil disimpan!` };
}

module.exports = { getMatrix, saveMatrix };
