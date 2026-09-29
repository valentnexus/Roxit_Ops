    let currentUser = null;
    let sessionToken = null; // Token sesi dari server, wajib disertakan di tiap request data setelah login

    // ==================== SECURE API WRAPPER ====================
    // runServer() sekarang didefinisikan di api-adapter.js (bukan lagi di sini), yang
    // menerjemahkan nama fungsi lama ini ke endpoint REST backend Node.js kita lewat window.Api.
    // Signature-nya sama persis, jadi semua pemanggilan runServer(...) di bawah ini TIDAK diubah.

    function handleSessionExpired(message) {
      sessionToken = null;
      currentUser = null;
      document.getElementById('appContainer').classList.remove('active');
      document.getElementById('loginPage').classList.remove('hidden');
      showToast(message || 'Sesi Anda telah berakhir. Silakan login ulang.', 'error');
    }

    let pendingConfirmCallback = null;

    // ==================== PERMISSION ENFORCEMENT (Stage 2) ====================
    let isSuperAdminUser = false;
    let currentUserPermissions = {}; // { ModuleName: { View, Add, Edit, Delete, Export } }

    const PERMISSION_PAGE_MODULE_MAP = {
      dashboard: 'Dashboard',
      manualCutting: 'Manual Cutting',
      timeTracking: 'Time Tracking',
      adminOps: 'Operations',
      report: 'Report',
      staff: 'Manage Staff',
      masterData: 'Master Data'
    };

    // Fail-open kalau module belum ada di data permission (mis. role baru belum sempat di-setup ulang)
    // atau kalau aksinya memang N/A (null) untuk module itu, supaya tidak ada yang keblokir gak sengaja.
    function hasPermission(moduleName, action) {
      if (isSuperAdminUser) return true;
      const row = currentUserPermissions[moduleName];
      if (!row) return true;
      const val = row[action];
      if (val === null || val === undefined) return true;
      return !!val;
    }

    // Dipakai di dalam template literal render tabel (Manage Staff, Master Data) untuk
    // menyembunyikan tombol Edit/Delete per baris sesuai permission role yang login.
    function permActionButton(moduleName, action, onclickAttr, colorClass, iconClass, title) {
      if (!hasPermission(moduleName, action)) return '';
      return `<button onclick="${onclickAttr}" class="${colorClass}" title="${title}"><i class="fa-solid ${iconClass}"></i></button>`;
    }

    function applySidebarPermissions() {
      Object.keys(PERMISSION_PAGE_MODULE_MAP).forEach(function(page) {
        const moduleName = PERMISSION_PAGE_MODULE_MAP[page];
        const btn = document.querySelector('[data-page="' + page + '"]');
        if (!btn) return;
        const li = btn.closest('li');
        if (li) li.classList.toggle('hidden', !hasPermission(moduleName, 'View'));
      });
    }

    // Tombol statis (Add / Submit / Export) yang gak lewat template dinamis
    function applyStaticButtonPermissions() {
      const map = [
        ['staffAddBtn', 'Manage Staff', 'Add'],
        ['masterAddRoleBtn', 'Master Data', 'Add'],
        ['masterAddClubBtn', 'Master Data', 'Add'],
        ['masterAddSessionTypeBtn', 'Master Data', 'Add'],
        ['ptSubmitFormBtn', 'Manual Cutting', 'Add'],
        ['gtSubmitFormBtn', 'Manual Cutting', 'Add'],
        ['mgSubmitFormBtn', 'Manual Cutting', 'Add'],
        ['timeClockInBtn', 'Time Tracking', 'Add'],
        ['timeClockOutBtn', 'Time Tracking', 'Add'],
        ['reportExportBtn', 'Report', 'Export']
      ];
      map.forEach(function(entry) {
        const el = document.getElementById(entry[0]);
        if (el) el.classList.toggle('hidden', !hasPermission(entry[1], entry[2]));
      });
    }

    // Tombol Edit + Delete/Restore di popup Detail PT/GT/MG/TIO.
    // Hanya MENAMBAH 'hidden' kalau Delete gak diizinkan, gak pernah menghapusnya,
    // supaya gak nabrak logika Success/Archived yang udah ngatur tombol itu sebelumnya.
    function applyDetailButtonPermissions(editBtnId, archiveBtnId, moduleName) {
      const editBtn = document.getElementById(editBtnId);
      if (editBtn) editBtn.classList.toggle('hidden', !hasPermission(moduleName, 'Edit'));

      const archiveBtn = document.getElementById(archiveBtnId);
      if (archiveBtn && !hasPermission(moduleName, 'Delete')) {
        archiveBtn.classList.add('hidden');
      }
    }

    // Ambil permission matrix untuk role yang login, lalu jalankan callback setelah siap.
    // Super Admin gak perlu fetch, langsung dianggap full access (sesuai aturan bisnis).
    function loadUserPermissionsThenProceed(afterFn) {
      if (currentUser && currentUser.role === 'Super Admin') {
        isSuperAdminUser = true;
        currentUserPermissions = {};
        applySidebarPermissions();
        applyStaticButtonPermissions();
        afterFn();
        return;
      }

      isSuperAdminUser = false;

      if (true) {
        runServer('getPermissionMatrix', [currentUser.role], function(res) {
            currentUserPermissions = {};
            if (res.success) {
              (res.rows || []).forEach(function(row) {
                currentUserPermissions[row.Module] = row;
              });
            }
            applySidebarPermissions();
            applyStaticButtonPermissions();
            afterFn();
          }, function(err) {
            console.error('Error loading permissions:', err);
            currentUserPermissions = {}; // fail-open
            applySidebarPermissions();
            applyStaticButtonPermissions();
            afterFn();
          })
      } else {
        currentUserPermissions = {};
        applySidebarPermissions();
        applyStaticButtonPermissions();
        afterFn();
      }
    }

    function showConfirmModal(message, onConfirm) {
      document.getElementById('customConfirmMessage').textContent = message;
      pendingConfirmCallback = onConfirm;
      document.getElementById('customConfirmModal').classList.remove('hidden');
    }

    function closeConfirmModal() {
      document.getElementById('customConfirmModal').classList.add('hidden');
      pendingConfirmCallback = null;
    }

    function confirmModalYes() {
      const cb = pendingConfirmCallback;
      closeConfirmModal();
      if (cb) cb();
    }

