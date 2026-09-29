/**
 * Adapter kompatibilitas: menerjemahkan nama fungsi lama gaya Apps Script
 * (dulu dipanggil lewat google.script.run.apiCall(functionName, token, args))
 * ke endpoint REST backend Node.js kita, lewat window.Api (lihat api.js).
 *
 * Ini dibuat supaya app.js (4683 baris logic UI dari index.html lama) TIDAK perlu
 * ditulis ulang satu-satu — semua 61 titik pemanggilan di app.js tetap memanggil
 * runServer('namaFungsiLama', [args], onSuccess, onFailure) persis seperti sebelumnya.
 * Cukup file ini yang tahu ke endpoint REST mana nama itu diterjemahkan.
 *
 * Menambah modul baru? Tambahkan satu baris di API_MAP di bawah, pola:
 *   namaFungsiLama: (args) => Api.method('/path', body)
 */

const API_MAP = {
  // ---------- Auth ----------
  loginUser: async ([email, password]) => {
    const res = await Api.post('/auth/login', { email, password });
    if (res.success && res.token) Api.setToken(res.token);
    return res;
  },
  logUserLogout: async () => {
    const res = await Api.post('/auth/logout');
    Api.clearToken();
    return res;
  },
  changePassword: ([, currentPassword, newPassword]) =>
    Api.post('/auth/change-password', { currentPassword, newPassword }),
  getAppConfig: () => Api.get('/config'),

  // ---------- Clubs ----------
  getClubsList: () => Api.get('/clubs'),
  saveClub: ([data]) => (data.clubId ? Api.put(`/clubs/${data.clubId}`, data) : Api.post('/clubs', data)),
  deleteClub: ([clubId]) => Api.delete(`/clubs/${clubId}`),

  // ---------- Roles & Permission ----------
  getRolesList: () => Api.get('/roles'),
  saveRole: ([data]) => (data.roleId ? Api.put(`/roles/${data.roleId}`, data) : Api.post('/roles', data)),
  deleteRole: ([roleId]) => Api.delete(`/roles/${roleId}`),
  getPermissionMatrix: ([roleName]) => Api.get(`/roles/${encodeURIComponent(roleName)}/permissions`),
  savePermissionMatrix: ([params]) => Api.put(`/roles/${encodeURIComponent(params.roleName)}/permissions`, { rows: params.rows }),

  // ---------- Session Types ----------
  getSessionTypesList: () => Api.get('/session-types'),
  saveSessionType: ([data]) =>
    (data.sessionTypeId ? Api.put(`/session-types/${data.sessionTypeId}`, data) : Api.post('/session-types', data)),
  deleteSessionType: ([id]) => Api.delete(`/session-types/${id}`),

  // ---------- Users / Staff ----------
  getUsersList: ([status]) => Api.get(`/users${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  saveUser: ([data]) => (data.userId ? Api.put(`/users/${data.userId}`, data) : Api.post('/users', data)),
  deleteStaff: ([userId]) => Api.post(`/users/${userId}/archive`),
  getStaffActivities: ([name]) => Api.get(`/users/${encodeURIComponent(name)}/activities`),
  getAuditTrailData: () => Api.get('/audit-trail'),

  // ---------- Manual Cutting ----------
  submitManualCutting: ([data]) => Api.post('/manual-cutting', data),

  // ---------- Time In/Out ----------
  submitTimeInOut: ([data]) => Api.post('/time-in-out', data),
  getTimeInOutLogList: () => Api.get('/time-in-out'),
  updateTimeInOutLog: ([data]) => Api.put(`/time-in-out/${data.logId}`, data),
  deleteTimeInOutLog: ([logId]) => Api.post(`/time-in-out/${logId}/archive`),
  restoreTimeInOutLog: ([logId]) => Api.post(`/time-in-out/${logId}/restore`),

  // ---------- Personal Training ----------
  submitPersonalTraining: ([data]) => Api.post('/personal-training', data),
  getPersonalTrainingLogList: () => Api.get('/personal-training'),
  updatePersonalTrainingLog: ([data]) => Api.put(`/personal-training/${data.logId}`, data),
  deletePersonalTrainingLog: ([logId]) => Api.post(`/personal-training/${logId}/archive`),
  restorePersonalTrainingLog: ([logId]) => Api.post(`/personal-training/${logId}/restore`),

  // ---------- Group Training ----------
  submitGroupTraining: ([data]) => Api.post('/group-training', data),
  getGroupTrainingLogList: () => Api.get('/group-training'),
  updateGroupTrainingLog: ([data]) => Api.put(`/group-training/${data.logId}`, data),
  deleteGroupTrainingLog: ([logId]) => Api.post(`/group-training/${logId}/archive`),
  restoreGroupTrainingLog: ([logId]) => Api.post(`/group-training/${logId}/restore`),

  // ---------- Manual Group ----------
  submitManualGroup: ([data]) => Api.post('/manual-group', data),
  getManualGroupLogList: () => Api.get('/manual-group'),
  updateManualGroupLog: ([data]) => Api.put(`/manual-group/${data.logId}`, data),
  deleteManualGroupLog: ([logId]) => Api.post(`/manual-group/${logId}/archive`),
  restoreManualGroupLog: ([logId]) => Api.post(`/manual-group/${logId}/restore`),

  // ---------- Approvals ----------
  getApprovalList: () => Api.get('/approvals'),
  getRecentProcessed: ([limit]) => Api.get(`/approvals/recent?limit=${limit || 20}`),
  processApproval: ([params]) => Api.post('/approvals/process', params),

  // ---------- Dashboard ----------
  getDashboardStats: () => Api.get('/dashboard/stats'),
  getDashboardWidgets: () => Api.get('/dashboard/widgets'),
};

/**
 * Pengganti runServer() lama. Signature SAMA PERSIS (functionName, args, onSuccess, onFailure)
 * supaya semua 61 titik pemanggilan di app.js tidak perlu diubah sama sekali.
 */
function runServer(functionName, args, onSuccess, onFailure) {
  const handler = API_MAP[functionName];
  if (!handler) {
    const err = new Error(`Fungsi API tidak dikenal di adapter: ${functionName}`);
    console.error(err.message);
    if (onFailure) onFailure(err);
    return;
  }

  handler(args || [])
    .then((res) => {
      if (res && res.sessionExpired) {
        handleSessionExpired(res.message);
        return;
      }
      if (onSuccess) onSuccess(res);
    })
    .catch((err) => {
      if (onFailure) onFailure(err);
      else console.error(`Server error (${functionName}):`, err);
    });
}
