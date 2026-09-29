const repos = require('../repositories');
const AppError = require('../utils/AppError');
const { formatNow } = require('../utils/date');
const { nextDailyId } = require('../utils/idGenerator');
const { isTruthy } = require('../utils/helpers');
const { evaluateEditRule, checkDeleteAllowed, editStatusChangeDetails } = require('../utils/approvalRules');
const audit = require('./auditService');

const LABEL = 'Personal Training';

function toApi(r) {
  return { ...r, IsArchived: isTruthy(r.IsArchived) };
}

/** Format daftar latihan jadi 1 string, mis: "Bench Press: Set1(40kg,10) Set2(40kg,8) | Squat: Set1(60kg,10)" */
function buildExerciseLog(exercises) {
  if (!exercises || !exercises.length) return '';
  return exercises
    .map((ex) => {
      const weights = (ex.sets && ex.sets.weights) || [];
      const reps = (ex.sets && ex.sets.reps) || [];
      const sets = weights.map((w, i) => `Set${i + 1}(${w}kg,${reps[i]})`).join(' ');
      return `${ex.name}: ${sets}`;
    })
    .join(' | ');
}

/** Pengganti getPersonalTrainingLogList() */
async function list() {
  return { success: true, records: (await repos.personalTrainingLog.findAll()).map(toApi) };
}

/** Pengganti submitPersonalTraining() */
async function submit(formData, actor) {
  if (!formData.member || !formData.sessionDate) throw new AppError('Member dan tanggal sesi wajib diisi.', 400);

  const logId = await nextDailyId('PT', repos.personalTrainingLog);
  const no = (await repos.personalTrainingLog.findAll()).length + 1;

  await repos.personalTrainingLog.create({
    LogID: logId,
    Club: formData.club,
    PT_Name: formData.ptName || actor,
    Member_Name: formData.member,
    SessionDate: formData.sessionDate,
    SessionType: formData.sessionType,
    BookingTimeStart: formData.timeStart,
    BookingTimeEnd: formData.timeEnd,
    ExerciseLog: buildExerciseLog(formData.exercises),
    Status: 'Pending',
    AdminNotes: '',
    CreatedDate: formatNow(),
    No: no,
    IsArchived: 'false',
  });
  await audit.log(formData.ptName || actor, `Submit ${LABEL}`, `LogID: ${logId} for Member: ${formData.member}`);
  return { success: true, message: 'Personal Training form berhasil disimpan!' };
}

/** Pengganti updatePersonalTrainingLog() */
async function update(formData, actor) {
  const row = await repos.personalTrainingLog.findById(formData.logId);
  if (!row) throw new AppError('Record tidak ditemukan.', 404);

  const rule = evaluateEditRule(row.Status, formData);
  if (!rule.ok) throw new AppError(rule.message, 400);

  const changes = {
    Club: formData.club,
    Member_Name: formData.member,
    SessionDate: formData.sessionDate,
    SessionType: formData.sessionType,
    BookingTimeStart: formData.timeStart,
    BookingTimeEnd: formData.timeEnd,
    ExerciseLog: buildExerciseLog(formData.exercises),
  };
  if (rule.backToPending) changes.Status = 'Pending';
  await repos.personalTrainingLog.update(formData.logId, changes);

  if (rule.backToPending) {
    await audit.log(actor, `${rule.action} ${LABEL}`, editStatusChangeDetails(formData.logId, row.AdminNotes));
    return { success: true, message: rule.message };
  }
  await audit.log(actor, `Update ${LABEL}`, `Updated: ${formData.logId}`);
  return { success: true, message: 'Personal Training record berhasil diperbarui!' };
}

/** Pengganti deletePersonalTrainingLog(): soft delete (arsip). */
async function archive(logId, actor) {
  const row = await repos.personalTrainingLog.findById(logId);
  if (!row) throw new AppError('Record tidak ditemukan.', 404);

  const allowed = checkDeleteAllowed(row.Status);
  if (!allowed.ok) throw new AppError(allowed.message, 400);

  await repos.personalTrainingLog.update(logId, { IsArchived: 'true' });
  await audit.log(actor, `Archive ${LABEL}`, `Archived: ${logId}`);
  return { success: true, message: 'Personal Training record berhasil dipindahkan ke arsip!' };
}

/** Pengganti restorePersonalTrainingLog() */
async function restore(logId, actor) {
  const updated = await repos.personalTrainingLog.update(logId, { IsArchived: 'false' });
  if (!updated) throw new AppError('Record tidak ditemukan.', 404);
  await audit.log(actor, `Restore ${LABEL}`, `Restored: ${logId}`);
  return { success: true, message: 'Personal Training record berhasil dikembalikan!' };
}

module.exports = { list, submit, update, archive, restore, buildExerciseLog };
