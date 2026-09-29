    // ==================== NAVIGATION ====================
    function toggleSidebar() {
      document.getElementById('sidebarMenu').classList.toggle('active');
      document.getElementById('sidebarOverlay').classList.toggle('active');
    }

    function closeSidebar() {
      document.getElementById('sidebarMenu').classList.remove('active');
      document.getElementById('sidebarOverlay').classList.remove('active');
    }

    function toggleProfileMenu() {
      document.getElementById('profileMenu').classList.toggle('hidden');
    }

    // Tutup dropdown profil kalau klik di luar area-nya.
    // Dipindah dari akhir app.js lama (nyasar dekat kode Master Data, padahal ini urusan navigasi/header).
    // Sekalian diperbaiki: versi lama pakai event.target.closest('div').querySelector('button'), yang error
    // (Cannot read properties of null) kalau elemen yang diklik nggak punya ancestor <div> sama sekali
    // -- misalnya elemen <a> sementara yang dibuat exportReportCsv() untuk trigger download, ditempel
    // langsung ke <body>. Sekarang cukup cek langsung apakah target ada di dalam tombol toggle profil.
    document.addEventListener('click', function(event) {
      const profileMenu = document.getElementById('profileMenu');
      if (!profileMenu) return;

      const isProfileButton = event.target.closest('button[onclick*="toggleProfileMenu"]');
      if (!isProfileButton && !profileMenu.contains(event.target)) {
        profileMenu.classList.add('hidden');
      }
    });

    function resetManualCuttingPage() {
      // Balik ke tab Personal Training (default)
      switchManualCuttingTab('personal');

      // Reset form Personal Training
      document.getElementById('formPersonalTraining').reset();
      document.getElementById('ptName').value = currentUser ? currentUser.name : '';
      document.getElementById('ptClub').innerHTML = '';
      document.getElementById('ptSessionType').innerHTML = '';
      resetExerciseFormsContainer();

      // Reset form Group Training
      document.getElementById('formGroupTraining').reset();
      document.getElementById('gtClub').innerHTML = '';
      document.getElementById('gtSessionType').innerHTML = '';

      // Reset form Manual Group
      document.getElementById('formManualGroup').reset();
      document.getElementById('mgClub').innerHTML = '';
      resetMGMemberFields();
    }

    function resetStaffPage() {
      document.getElementById('staffSearch').value = '';
      document.getElementById('roleFilter').innerHTML = '<option value="">-- All Roles --</option>';
      document.getElementById('clubFilter').innerHTML = '<option value="">-- All Clubs --</option>';
      document.getElementById('staffStatusFilter').value = 'active';
    }

    function resetMasterDataPage() {
      // Balik ke tab Role (default)
      switchMasterDataTab('role');
    }

    function resetTimeTrackingPage() {
      const memberField = document.getElementById('tioMember');
      if (memberField) memberField.value = '';
    }

    function switchPage(pageName) {
      // Defense-in-depth: blokir navigasi langsung ke module yang View-nya gak diizinkan
      // (menu sidebar-nya udah disembunyikan juga, ini cuma jaga-jaga kalau dipanggil manual)
      const guardModule = PERMISSION_PAGE_MODULE_MAP[pageName];
      if (guardModule && !hasPermission(guardModule, 'View')) {
        showToast('Anda tidak punya akses ke halaman ini.', 'error');
        return;
      }

      // Hide all pages
      document.getElementById('dashboardPage').classList.add('hidden');
      document.getElementById('manualCuttingPage').classList.add('hidden');
      document.getElementById('timeTrackingPage').classList.add('hidden');
      document.getElementById('adminOpsPage').classList.add('hidden');
      document.getElementById('reportPage').classList.add('hidden');
      document.getElementById('staffPage').classList.add('hidden');
      document.getElementById('staffDetailPage').classList.add('hidden');
      document.getElementById('masterDataPage').classList.add('hidden');
      document.getElementById('profilePage').classList.add('hidden');
      document.getElementById('changePasswordPage').classList.add('hidden');

      // Update menu active state
      document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('bg-teal-100', 'text-teal-700');
      });

      // Update breadcrumb
      const breadcrumbMap = {
        'dashboard': 'Dashboard',
        'manualCutting': 'Manual Cutting',
        'timeTracking': 'Time Tracking',
        'adminOps': 'Operations',
        'report': 'Report',
        'staff': 'Manage Staff',
        'staffDetail': 'Staff Detail',
        'masterData': 'Master data',
        'profile': 'Profile',
        'changePassword': 'Change Password'
      };
      document.getElementById('breadcrumbPage').textContent = breadcrumbMap[pageName] || 'Dashboard';

      // Show selected page
      switch(pageName) {
        case 'dashboard':
          document.getElementById('dashboardPage').classList.remove('hidden');
          document.querySelector('[data-page="dashboard"]').classList.add('bg-teal-100', 'text-teal-700');
          loadDashboardWidgets();
          break;
        case 'manualCutting':
          document.getElementById('manualCuttingPage').classList.remove('hidden');
          document.querySelector('[data-page="manualCutting"]').classList.add('bg-teal-100', 'text-teal-700');
          resetManualCuttingPage();
          loadPTHistory();
          loadSessionTypes();
          break;
        case 'timeTracking':
          document.getElementById('timeTrackingPage').classList.remove('hidden');
          document.querySelector('[data-page="timeTracking"]').classList.add('bg-teal-100', 'text-teal-700');
          resetTimeTrackingPage();
          loadTimeTrackingFormData();
          loadTimeInOutHistory();
          break;
        case 'adminOps':
          document.getElementById('adminOpsPage').classList.remove('hidden');
          document.querySelector('[data-page="adminOps"]').classList.add('bg-teal-100', 'text-teal-700');
          resetAdminOpsPage();
          loadDashboardStats();
          loadPendingApprovals();
          loadRecentProcessed();
          break;
        case 'report':
          document.getElementById('reportPage').classList.remove('hidden');
          document.querySelector('[data-page="report"]').classList.add('bg-teal-100', 'text-teal-700');
          resetReportPage();
          loadReportData(currentReportTab);
          break;
        case 'staff':
          document.getElementById('staffPage').classList.remove('hidden');
          document.querySelector('[data-page="staff"]').classList.add('bg-teal-100', 'text-teal-700');
          resetStaffPage();
          loadStaffList();
          loadRolesForFilter();
          loadClubsForFilter();
          break;
        case 'staffDetail':
          document.getElementById('staffDetailPage').classList.remove('hidden');
          document.querySelector('[data-page="staff"]').classList.add('bg-teal-100', 'text-teal-700');
          showDetailTabsByRole();
          break;
        case 'masterData':
          document.getElementById('masterDataPage').classList.remove('hidden');
          document.querySelector('[data-page="masterData"]').classList.add('bg-teal-100', 'text-teal-700');
          resetMasterDataPage();
          loadRolesList();
          loadClubsList();
          loadSessionTypesList();
          break;
        case 'profile':
          document.getElementById('profilePage').classList.remove('hidden');
          break;
        case 'changePassword':
          document.getElementById('changePasswordPage').classList.remove('hidden');
          break;
      }

      closeSidebar();
    }

    // Ubah tombol Delete <-> Restore di popup detail sesuai status arsip record
    function setDetailArchiveButton(btnId, isArchived, status) {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      // Record Success tidak bisa diarsipkan (harus Cancel Approval dulu lewat Edit)
      btn.classList.toggle('hidden', !isArchived && status === 'Success');
      if (isArchived) {
        btn.classList.remove('bg-red-500', 'hover:bg-red-600');
        btn.classList.add('bg-green-500', 'hover:bg-green-600');
        btn.innerHTML = '<i class="fa-solid fa-rotate-left mr-2"></i> Restore';
      } else {
        btn.classList.remove('bg-green-500', 'hover:bg-green-600');
        btn.classList.add('bg-red-500', 'hover:bg-red-600');
        btn.innerHTML = '<i class="fa-solid fa-trash mr-2"></i> Delete';
      }
    }

    // ---- Aturan Edit berdasarkan status record (popup Edit) ----
    // Pending : tombol "Save Changes" (status tetap Pending)
    // Rejected: tombol "Resubmit"       -> konfirmasi -> status kembali ke Pending
    // Success : tombol "Cancel Approval" -> konfirmasi -> status kembali ke Pending
    const editRecordStatus = { PT: '', GT: '', MG: '', TIO: '' };

    function configureEditModalButtons(prefix, type, status) {
      editRecordStatus[type] = status || '';
      const submitBtn = document.getElementById(prefix + 'EditSubmitBtn');
      const closeBtn = document.getElementById(prefix + 'EditCloseBtn');
      if (!submitBtn || !closeBtn) return;

      submitBtn.classList.remove('bg-teal-500', 'hover:bg-teal-600', 'bg-amber-500', 'hover:bg-amber-600', 'bg-orange-500', 'hover:bg-orange-600');

      if (status === 'Rejected') {
        submitBtn.classList.add('bg-amber-500', 'hover:bg-amber-600');
        submitBtn.textContent = 'Resubmit';
        closeBtn.textContent = 'Cancel';
      } else if (status === 'Success') {
        submitBtn.classList.add('bg-orange-500', 'hover:bg-orange-600');
        submitBtn.textContent = 'Cancel Approval';
        closeBtn.textContent = 'Close';
      } else {
        submitBtn.classList.add('bg-teal-500', 'hover:bg-teal-600');
        submitBtn.textContent = 'Save Changes';
        closeBtn.textContent = 'Cancel';
      }
    }

    function submitEditWithStatusRule(type, formData, sendFn) {
      const status = editRecordStatus[type];
      if (status === 'Rejected') {
        formData.resubmit = true;
        showConfirmModal('Kirim ulang (resubmit) record ini? Status akan kembali ke Pending dan menunggu review admin. Catatan admin sebelumnya tetap tersimpan.', function() {
          sendFn(formData);
        });
      } else if (status === 'Success') {
        formData.cancelApproval = true;
        showConfirmModal('Batalkan approval record ini? Status akan kembali ke Pending dan perlu di-approve ulang oleh admin.', function() {
          sendFn(formData);
        });
      } else {
        sendFn(formData);
      }
    }

    // ==================== UTILITY FUNCTIONS ====================
    function showToast(message, type = 'info') {
      const toast = document.getElementById('toast');
      const icon = document.getElementById('toastIcon');
      const msg = document.getElementById('toastMessage');

      toast.classList.remove('hidden', 'bg-green-100', 'text-green-700', 'bg-red-100', 'text-red-700', 'bg-blue-100', 'text-blue-700');

      if (type === 'success') {
        toast.classList.add('bg-green-100', 'text-green-700');
        icon.className = 'fa-solid fa-check-circle';
      } else if (type === 'error') {
        toast.classList.add('bg-red-100', 'text-red-700');
        icon.className = 'fa-solid fa-exclamation-circle';
      } else {
        toast.classList.add('bg-blue-100', 'text-blue-700');
        icon.className = 'fa-solid fa-info-circle';
      }

      msg.textContent = message;
      setTimeout(hideToast, 3000);
    }

    function hideToast() {
      document.getElementById('toast').classList.add('hidden');
    }

