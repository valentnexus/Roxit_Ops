const repos = require('../repositories');
const AppError = require('../utils/AppError');
const { formatDateISO } = require('../utils/date');
const { nextSequentialId } = require('../utils/idGenerator');
const audit = require('./auditService');

/** Pengganti getRolesList() */
async function list() {
  return { success: true, roles: await repos.roles.findAll() };
}

/** Pengganti saveRole(): roleId ada => edit, kosong => tambah baru */
async function save(data, actor) {
  const roleName = String(data.roleName || '').trim();
  const description = String(data.description || '').trim();
  if (!roleName) throw new AppError('Nama role wajib diisi.', 400);

  if (data.roleId) {
    const updated = await repos.roles.update(data.roleId, { RoleName: roleName, Description: description });
    if (!updated) throw new AppError('Role tidak ditemukan.', 404);
    await audit.log(actor, 'Update Role', `Updated: ${roleName}`);
    return { success: true, message: 'Role berhasil diperbarui!' };
  }

  await repos.roles.create({
    RoleID: await nextSequentialId('ROLE', repos.roles),
    RoleName: roleName,
    Description: description,
    CreatedDate: formatDateISO(),
  });
  await audit.log(actor, 'Add Role', `Created: ${roleName}`);
  return { success: true, message: 'Role baru berhasil ditambahkan!' };
}

/** Pengganti deleteRole() */
async function remove(roleId, actor) {
  const removed = await repos.roles.remove(roleId);
  if (!removed) throw new AppError('Role tidak ditemukan.', 404);
  await audit.log(actor, 'Delete Role', `Deleted: ${roleId}`);
  return { success: true, message: 'Role berhasil dihapus!' };
}

module.exports = { list, save, remove };
