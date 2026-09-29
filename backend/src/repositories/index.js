const SheetRepository = require('./SheetRepository');

/**
 * Satu instance per sheet. Tambah baris baru di sini setiap kali membuat modul baru.
 * (Saat migrasi ke PostgreSQL, ganti isi file ini dengan repository versi Postgres.)
 */
module.exports = {
  users: new SheetRepository('Users'),
  roles: new SheetRepository('Role'),
  clubs: new SheetRepository('Club'),
  sessionTypes: new SheetRepository('SessionType'),
  manualCutting: new SheetRepository('ManualCutting'),
  timeInOut: new SheetRepository('TimeInOut'),
  personalTrainingLog: new SheetRepository('PersonalTrainingLog'),
  groupTrainingLog: new SheetRepository('GroupTrainingLog'),
  manualGroupLog: new SheetRepository('ManualGroupLog'),
  config: new SheetRepository('Config'),
  auditTrail: new SheetRepository('AuditTrail'),
  permission: new SheetRepository('Permission'),
};
