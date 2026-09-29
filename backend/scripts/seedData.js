/**
 * Data awal (dummy) untuk sheet baru. Port dari setup.gs.
 * Password user dummy ditulis plain di sini lalu di-hash oleh setupDatabase.js sebelum masuk Sheet.
 */

function buildPermissionRows() {
  const roles = ['Super Admin', 'Admin', 'Personal Trainer', 'Muay Thai/MMA'];
  const modules = [
    { name: 'Dashboard', actions: ['View'] },
    { name: 'Manual Cutting', actions: ['View', 'Add', 'Edit', 'Delete'] },
    { name: 'Time Tracking', actions: ['View', 'Add', 'Edit', 'Delete'] },
    { name: 'Operations', actions: ['View', 'Edit'] },
    { name: 'Report', actions: ['View', 'Export'] },
    { name: 'Manage Staff', actions: ['View', 'Add', 'Edit', 'Delete'] },
    { name: 'Master Data', actions: ['View', 'Add', 'Edit', 'Delete'] },
  ];
  const allActions = ['View', 'Add', 'Edit', 'Delete', 'Export'];
  const rows = [];
  roles.forEach((role) => {
    modules.forEach((mod) => {
      rows.push([role, mod.name, ...allActions.map((a) => (mod.actions.includes(a) ? 'true' : ''))]);
    });
  });
  return rows;
}

const DEFAULT_PASSWORD = 'password123';

module.exports = {
  DEFAULT_PASSWORD,
  Users: [
    ['USR-0001', 'Alex PT', 'alex.pt@gmail.com', DEFAULT_PASSWORD, 'Personal Trainer', 'Main Gym', '081234567890', 'false', ''],
    ['USR-0002', 'Siti PT', 'siti.pt@gmail.com', DEFAULT_PASSWORD, 'Personal Trainer', 'Branch Gym', '082345678901', 'false', ''],
    ['USR-0003', 'Roni Muay Thai', 'roni.muay@gmail.com', DEFAULT_PASSWORD, 'Muay Thai/MMA', 'Main Gym', '085678901234', 'false', ''],
    ['USR-0004', 'Budi Admin', 'budi.admin@gmail.com', DEFAULT_PASSWORD, 'Admin', 'Main Gym', '083456789012', 'false', ''],
    ['USR-0005', 'Super Admin', 'super@gmail.com', DEFAULT_PASSWORD, 'Super Admin', 'Main Gym', '084567890123', 'false', ''],
  ],
  Role: [
    ['ROLE-0001', 'Super Admin', 'Full system access', '2026-01-01'],
    ['ROLE-0002', 'Admin', 'Administrative access', '2026-01-01'],
    ['ROLE-0003', 'Personal Trainer', 'Personal trainer access', '2026-01-01'],
    ['ROLE-0004', 'Muay Thai/MMA', 'Muay Thai/MMA trainer access', '2026-01-01'],
  ],
  Club: [
    ['CLUB-0001', 'Main Gym', 'Jl. Utama No. 1', '2026-01-01'],
    ['CLUB-0002', 'Branch Gym', 'Jl. Cabang No. 2', '2026-01-01'],
  ],
  SessionType: [
    ['SES-0001', 'Strength Training', 'Latihan kekuatan dengan beban', '2026-01-01'],
    ['SES-0002', 'Cardio', 'Latihan kardiovaskular', '2026-01-01'],
    ['SES-0003', 'Flexibility', 'Latihan fleksibilitas dan stretching', '2026-01-01'],
    ['SES-0004', 'HIIT', 'High Intensity Interval Training', '2026-01-01'],
    ['SES-0005', 'Boxing', 'Latihan tinju', '2026-01-01'],
  ],
  ManualCutting: [
    ['CUT-0001', '2026-08-26', 'Alex PT', 'John Doe', 'Member Cuti Sakit', 'Surat dokter terlampir', 'Pending', '', '26/08/2026 09:00:00'],
    ['CUT-0002', '2026-08-25', 'Siti PT', 'Jane Smith', 'Salah Input Sesi PT', 'Minta potong manual 1 session', 'Processed', 'Sudah disesuaikan di sistem', '25/08/2026 14:20:00'],
    ['CUT-0003', '2026-08-24', 'Alex PT', 'Michael Tan', 'Perpanjangan Masa Cuti', 'Sesuai kesepakatan management', 'Rejected', 'Alasan kurang lengkap', '24/08/2026 11:15:00'],
  ],
  AuditTrail: [
    ['26/08/2026 08:00:00', 'Alex PT', 'Time In', 'Clock-in at 08:00:00'],
    ['26/08/2026 09:00:00', 'Alex PT', 'Submit Manual Cutting', 'ID: CUT-0001 for Member: John Doe'],
    ['26/08/2026 09:30:00', 'System', 'Setup Database', 'System database initialized cleanly'],
  ],
  Permission: buildPermissionRows(),
};
