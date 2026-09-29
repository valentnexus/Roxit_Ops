/**
 * Definisi header tiap sheet. Urutan kolom = urutan array.
 * Kolom pertama selalu dianggap sebagai ID (primary key).
 * Sumber: setup.gs (sheetsConfig). Kalau kolom di Sheet berubah, ubah di sini.
 */
module.exports = {
  Users: ['UserID', 'Name', 'Email', 'Password', 'Role', 'Club', 'Phone', 'IsArchived', 'PhotoURL'],
  Role: ['RoleID', 'RoleName', 'Description', 'CreatedDate'],
  Club: ['ClubID', 'ClubName', 'Location', 'CreatedDate'],
  SessionType: ['SessionTypeID', 'SessionName', 'Description', 'CreatedDate'],
  ManualCutting: ['CutID', 'Date', 'PT_Name', 'Member_Name', 'Reason', 'Notes', 'Status', 'AdminNotes', 'Timestamp'],
  TimeInOut: ['LogID', 'PT_Name', 'Member_Name', 'Type', 'Status', 'AdminNotes', 'CreatedDate', 'No', 'IsArchived'],
  PersonalTrainingLog: ['LogID', 'Club', 'PT_Name', 'Member_Name', 'SessionDate', 'SessionType', 'BookingTimeStart', 'BookingTimeEnd', 'ExerciseLog', 'Status', 'AdminNotes', 'CreatedDate', 'No', 'IsArchived'],
  GroupTrainingLog: ['LogID', 'Club', 'Instructor_Name', 'Member_Name', 'SessionDate', 'SessionType', 'BookingTimeStart', 'BookingTimeEnd', 'Status', 'AdminNotes', 'CreatedDate', 'No', 'IsArchived'],
  ManualGroupLog: ['LogID', 'Club', 'Instructor_Name', 'Member_Name', 'ScheduleDate', 'ScheduleTime', 'Status', 'AdminNotes', 'CreatedDate', 'No', 'IsArchived'],
  Config: ['Keterangan', 'URL Photo'],
  AuditTrail: ['Timestamp', 'User', 'Action', 'Details'],
  Permission: ['RoleName', 'Module', 'View', 'Add', 'Edit', 'Delete', 'Export'],
};
