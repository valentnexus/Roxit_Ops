/**
 * API client. Pengganti google.script.run / apiCall(functionName, token, args) di index.html lama.
 *
 * Contoh migrasi pemanggilan:
 *   LAMA : google.script.run.withSuccessHandler(cb).apiCall('getClubsList', token, [])
 *   BARU : const res = await Api.get('/clubs');
 *
 *   LAMA : apiCall('saveClub', token, [{ clubName, location, currentUser }])
 *   BARU : await Api.post('/clubs', { clubName, location });          // tambah
 *          await Api.put('/clubs/' + id, { clubName, location });     // edit
 *
 * Bentuk respons tetap sama seperti dulu: { success, message, ...data }.
 */
(function () {
  const TOKEN_KEY = 'roxit_token';

  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
  const clearToken = () => localStorage.removeItem(TOKEN_KEY);

  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    let res;
    try {
      res = await fetch(window.ROXIT_CONFIG.API_BASE_URL + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (_e) {
      return { success: false, message: 'Tidak bisa terhubung ke server.' };
    }

    let data;
    try { data = await res.json(); } catch (_e) { data = { success: false, message: 'Respons server tidak valid.' }; }

    if (res.status === 401 && data.sessionExpired) {
      clearToken();
      window.dispatchEvent(new CustomEvent('roxit:session-expired', { detail: data }));
    }
    return data;
  }

  window.Api = {
    get: (p) => request('GET', p),
    post: (p, b) => request('POST', p, b || {}),
    put: (p, b) => request('PUT', p, b || {}),
    delete: (p) => request('DELETE', p),
    getToken, setToken, clearToken,
  };
})();
