const bcrypt = require('bcryptjs');
const repos = require('../repositories');
const AppError = require('../utils/AppError');
const { isTruthy } = require('../utils/helpers');
const { nextSequentialId } = require('../utils/idGenerator');
const audit = require('./auditService');

const DEFAULT_PASSWORD = 'password123';

/** Password TIDAK PERNAH dikirim ke client, walau sudah berupa hash bcrypt (kebiasaan lama harus dihentikan). */
function toPublic(u) {
  const { Password, ...rest } = u; // eslint-disable-line no-unused-vars
  return { ...rest, IsArchived: isTruthy(u.IsArchived) };
}

/** Pengganti getUsersList(filterStatus): filterStatus = 'active' | 'archived' | lainnya (semua). */
async function list(filterStatus) {
  const rows = await repos.users.findAll();
  const filtered = rows.filter((u) => {
    const archived = isTruthy(u.IsArchived);
    if (filterStatus === 'active') return !archived;
    if (filterStatus === 'archived') return archived;
    return true;
  });
  return { success: true, users: filtered.map(toPublic) };
}

/** Pengganti getUserProfile(email) */
async function getProfile(email) {
  const user = await repos.users.findOneBy('Email', email);
  if (!user) throw new AppError('User tidak ditemukan.', 404);
  return { success: true, user: toPublic(user) };
}

/**
 * Pengganti saveUser(). userId ada => edit (IsArchived tetap seperti semula, sesuai perilaku lama),
 * kosong => tambah staff baru. Password baru selalu di-hash; kalau tidak dikirim, password lama dipertahankan.
 */
async function save(data, actor) {
  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim();
  if (!name) throw new AppError('Nama wajib diisi.', 400);
  if (!email) throw new AppError('Email wajib diisi.', 400);

  if (data.userId) {
    const changes = {
      Name: name,
      Email: email,
      Role: data.role,
      Club: data.club,
      Phone: data.phone,
    };
    if (data.password) changes.Password = await bcrypt.hash(data.password, 10);
    if (data.photoUrl) changes.PhotoURL = data.photoUrl;

    const updated = await repos.users.update(data.userId, changes);
    if (!updated) throw new AppError('Staff tidak ditemukan.', 404);
    await audit.log(actor, 'Update User', `Updated: ${name}`);
    return { success: true, message: 'Data staff berhasil diperbarui!' };
  }

  await repos.users.create({
    UserID: await nextSequentialId('USR', repos.users),
    Name: name,
    Email: email,
    Password: await bcrypt.hash(data.password || DEFAULT_PASSWORD, 10),
    Role: data.role,
    Club: data.club,
    Phone: data.phone,
    IsArchived: 'false',
    PhotoURL: data.photoUrl || '',
  });
  await audit.log(actor, 'Add User', `Created: ${name}`);
  return { success: true, message: 'Staff baru berhasil ditambahkan!' };
}

/** Pengganti deleteStaff(): soft delete (arsip), bukan hapus permanen. */
async function archive(userId, actor) {
  const updated = await repos.users.update(userId, { IsArchived: 'true' });
  if (!updated) throw new AppError('Staff tidak ditemukan.', 404);
  await audit.log(actor, 'Archive Staff', `Archived: ${userId}`);
  return { success: true, message: 'Staff berhasil dipindahkan ke arsip!' };
}

/** Pengganti restoreStaff() */
async function restore(userId, actor) {
  const updated = await repos.users.update(userId, { IsArchived: 'false' });
  if (!updated) throw new AppError('Staff tidak ditemukan.', 404);
  await audit.log(actor, 'Restore Staff', `Restored: ${userId}`);
  return { success: true, message: 'Staff berhasil dipulihkan dari arsip!' };
}

/** Pengganti getStaffActivities(): 50 aktivitas terbaru dari AuditTrail milik staff tsb. */
async function activities(staffName) {
  const rows = await repos.auditTrail.findAll();
  const logs = rows
    .filter((r) => r.User === staffName)
    .reverse()
    .slice(0, 50)
    .map((r) => ({ timestamp: r.Timestamp, user: r.User, action: r.Action, details: r.Details }));
  return { success: true, data: logs };
}

module.exports = { list, getProfile, save, archive, restore, activities, toPublic };
