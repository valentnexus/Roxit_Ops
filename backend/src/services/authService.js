const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const repos = require('../repositories');
const AppError = require('../utils/AppError');
const { isTruthy } = require('../utils/helpers');
const audit = require('./auditService');

const REQUIRED_EMAIL_DOMAIN = '@gmail.com'; // aturan bisnis dari loginUser() lama

/**
 * Cek password. Mendukung dua format supaya data lama tetap bisa login:
 *  - hash bcrypt (diawali "$2")  -> format baru
 *  - plain text                  -> format lama; otomatis di-hash saat login berhasil
 */
async function verifyPassword(input, stored) {
  if (!stored) return { ok: false, legacy: false };
  if (stored.startsWith('$2')) return { ok: await bcrypt.compare(input, stored), legacy: false };

  const a = Buffer.from(String(input));
  const b = Buffer.from(String(stored));
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  return { ok, legacy: ok };
}

function toSessionUser(u) {
  return {
    userId: u.UserID,
    name: u.Name,
    email: u.Email,
    role: u.Role,
    club: u.Club,
    phone: u.Phone,
    photoUrl: u.PhotoURL || '',
  };
}

async function login(email, password) {
  if (!email || !String(email).includes(REQUIRED_EMAIL_DOMAIN)) {
    throw new AppError(`Email harus menggunakan format ${REQUIRED_EMAIL_DOMAIN}`, 400);
  }
  if (!password) throw new AppError('Password wajib diisi.', 400);

  const user = await repos.users.findOneBy('Email', String(email).trim(), { fresh: true });
  const { ok, legacy } = user ? await verifyPassword(password, user.Password) : { ok: false };
  if (!ok) throw new AppError('Email atau password salah.', 401);

  // BEHAVIOR BARU: akun yang diarsipkan (IsArchived=true) tidak boleh login.
  if (isTruthy(user.IsArchived)) {
    throw new AppError('Akun ini sudah tidak aktif. Hubungi admin.', 403);
  }

  // Migrasi bertahap password plain text -> bcrypt
  if (legacy) {
    try {
      await repos.users.update(user.UserID, { Password: await bcrypt.hash(password, 10) });
    } catch (err) {
      console.error('Gagal upgrade hash password:', err.message);
    }
  }

  const sessionUser = toSessionUser(user);
  const token = jwt.sign(sessionUser, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

  await audit.log(user.Name, 'Login', 'User berhasil login');
  return { success: true, message: 'Login berhasil!', user: sessionUser, token };
}

async function logout(user) {
  // JWT stateless: token tidak bisa dicabut dari server; client cukup membuang token.
  await audit.log(user.name, 'Logout', 'User logout');
  return { success: true };
}

/** Pengganti changePassword(). currentPassword divalidasi terhadap hash ATAU plain text lama. */
async function changePassword(user, currentPassword, newPassword) {
  if (!newPassword || String(newPassword).length < 6) {
    throw new AppError('Password baru minimal 6 karakter.', 400);
  }

  const row = await repos.users.findById(user.userId);
  if (!row) throw new AppError('User tidak ditemukan.', 404);

  const { ok } = await verifyPassword(currentPassword, row.Password);
  if (!ok) throw new AppError('Password saat ini salah.', 400);

  await repos.users.update(user.userId, { Password: await bcrypt.hash(newPassword, 10) });
  await audit.log(user.name, 'Change Password', 'Password berhasil diubah');
  return { success: true, message: 'Password berhasil diubah!' };
}

module.exports = { login, logout, changePassword, verifyPassword };
