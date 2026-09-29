    // ==================== STAFF LIST FUNCTIONS ====================
    function loadStaffList() {
      loadStaffListByStatus();
    }

    function loadStaffListByStatus() {
      const status = document.getElementById('staffStatusFilter').value || 'active';
      const tbody = document.getElementById('staffTableBody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-4 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Memuat staff...</td></tr>';

      if (true) {
        runServer('getUsersList', [status], function(res) {
            if (res.success && res.users) {
              renderStaffTable(res.users);
            }
          }, null)
      } else {
        // Demo data
        renderStaffTable([
          { UserID: 'USR-0001', Name: 'Alex PT', Email: 'alex.pt@gmail.com', Role: 'Personal Trainer', Club: 'Main Gym', Phone: '081234567890', IsArchived: false },
          { UserID: 'USR-0002', Name: 'Siti PT', Email: 'siti.pt@gmail.com', Role: 'Personal Trainer', Club: 'Branch Gym', Phone: '082345678901', IsArchived: false }
        ]);
      }
    }

    function renderStaffTable(users) {
      const tbody = document.getElementById('staffTableBody');
      tbody.innerHTML = '';
      
      if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-4 text-center text-slate-400">Tidak ada data staff</td></tr>';
        return;
      }

      users.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer';
        row.innerHTML = `
          <td class="px-4 py-3 text-sm text-slate-700">${user.UserID}</td>
          <td class="px-4 py-3 text-sm font-bold text-slate-800">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs flex-shrink-0 overflow-hidden">
                ${user.PhotoURL ? `<img src="${user.PhotoURL}" referrerpolicy="no-referrer" class="w-full h-full object-cover">` : '<i class="fa-solid fa-user"></i>'}
              </div>
              <span onclick="showStaffDetail('${user.UserID}', '${user.Name}', '${user.Email}', '${user.Phone}', '${user.Role}', '${user.Club}', '${user.PhotoURL || ''}')" class="cursor-pointer hover:text-teal-600 hover:underline">${user.Name}</span>
            </div>
          </td>
          <td class="px-4 py-3 text-sm text-slate-700">${user.Role}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${user.Club}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${user.Email}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${user.Phone}</td>
          <td class="px-4 py-3 text-center">
            <div class="flex justify-center gap-3">
              <button onclick="showStaffDetail('${user.UserID}', '${user.Name}', '${user.Email}', '${user.Phone}', '${user.Role}', '${user.Club}', '${user.PhotoURL || ''}')" class="text-teal-500 hover:text-teal-700" title="Detail">
                <i class="fa-solid fa-eye"></i>
              </button>
              ${permActionButton('Manage Staff', 'Edit', `editUser('${user.UserID}', '${user.Name}', '${user.Email}', '${user.Role}', '${user.Club}', '${user.Phone}', '${user.PhotoURL || ''}')`, 'text-blue-500 hover:text-blue-700', 'fa-pen-to-square', 'Edit')}
              ${permActionButton('Manage Staff', 'Delete', `deleteStaffFunc('${user.UserID}', '${user.Name}')`, 'text-red-500 hover:text-red-700', 'fa-trash', 'Delete')}
            </div>
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    let staffDetailTabsLoaded = {};
    let cachedActivitiesData = [];

    function showStaffDetail(id, name, email, phone, role, club, photoUrl) {
      // Reset per-tab cache: fresh entry into Staff Detail always reloads tabs from scratch
      staffDetailTabsLoaded = {};

      // Store current staff data
      window.currentStaffDetail = { id, name, email, phone, role, club, photoUrl };

      const staffDetailEditBtn = document.getElementById('staffDetailEditBtn');
      if (staffDetailEditBtn) staffDetailEditBtn.classList.toggle('hidden', !hasPermission('Manage Staff', 'Edit'));


      // Populate sidebar
      document.getElementById('detailStaffId').textContent = id;
      document.getElementById('detailStaffName').textContent = name;
      document.getElementById('detailStaffRole').textContent = role;
      document.getElementById('detailStaffEmail').textContent = email;
      document.getElementById('detailStaffPhone').textContent = phone;
      document.getElementById('detailStaffClub').textContent = club;

      const avatar = document.getElementById('detailStaffAvatar');
      if (photoUrl) {
        avatar.innerHTML = `<img src="${photoUrl}" referrerpolicy="no-referrer" class="w-full h-full object-cover">`;
      } else {
        avatar.innerHTML = '<i class="fa-solid fa-user"></i>';
      }

      // Navigate to detail page
      switchPage('staffDetail');
    }

    function goBackToStaff() {
      switchPage('staff');
    }

    function editStaffDetail() {
      const staff = window.currentStaffDetail;
      editUser(staff.id, staff.name, staff.email, staff.role, staff.club, staff.phone, staff.photoUrl);
    }

    function openMyProfile() {
      if (!currentUser) return;
      document.getElementById('profileMenu').classList.add('hidden');
      showStaffDetail(currentUser.userId, currentUser.name, currentUser.email, currentUser.phone || '', currentUser.role, currentUser.club || '', currentUser.photoUrl || '');
    }

    function deleteStaffFunc(userId, userName) {
      showConfirmModal(`Yakin ingin memindahkan staff ${userName} ke arsip?`, function() {
        showToast('Memindahkan staff ke arsip...', 'info');

        if (true) {
          runServer('deleteStaff', [userId, currentUser.name], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                loadStaffListByStatus();
              } else {
                showToast(res.message, 'error');
              }
            }, null)
        } else {
          showToast('Simulasi: Staff dipindahkan ke arsip!', 'success');
          loadStaffListByStatus();
        }
      });
    }

    function filterStaffTable() {
      const searchTerm = document.getElementById('staffSearch').value.toLowerCase();
      const roleFilter = document.getElementById('roleFilter').value;
      const clubFilter = document.getElementById('clubFilter').value;
      const rows = document.getElementById('staffTableBody').querySelectorAll('tr');

      rows.forEach(row => {
        if (row.cells.length < 7) return;
        const name = row.cells[1].textContent.toLowerCase();
        const role = row.cells[2].textContent;
        const club = row.cells[3].textContent;

        const nameMatch = name.includes(searchTerm);
        const roleMatch = !roleFilter || role === roleFilter;
        const clubMatch = !clubFilter || club === clubFilter;

        row.style.display = nameMatch && roleMatch && clubMatch ? '' : 'none';
      });
    }

    function loadRolesForFilter() {
      if (true) {
        runServer('getRolesList', [], function(res) {
            if (res.success && res.roles) {
              const select = document.getElementById('roleFilter');
              select.innerHTML = '<option value="">-- All Roles --</option>';
              res.roles.forEach(role => {
                const option = document.createElement('option');
                option.value = role.RoleName;
                option.textContent = role.RoleName;
                select.appendChild(option);
              });
            }
          }, null)
      }
    }

    function loadClubsForFilter() {
      if (true) {
        runServer('getClubsList', [], function(res) {
            if (res.success && res.clubs) {
              const select = document.getElementById('clubFilter');
              select.innerHTML = '<option value="">-- All Clubs --</option>';
              res.clubs.forEach(club => {
                const option = document.createElement('option');
                option.value = club.ClubName;
                option.textContent = club.ClubName;
                select.appendChild(option);
              });
            }
          }, null)
      }
    }

    function loadUserFormDropdowns(selectedRole, selectedClub) {
      loadRolesForUserForm(selectedRole);
      loadClubsForUserForm(selectedClub);
    }

    function loadRolesForUserForm(selectedRole) {
      const select = document.getElementById('userRoleInput');
      
      if (true) {
        runServer('getRolesList', [], function(res) {
            if (res.success && res.roles) {
              select.innerHTML = '<option value="">-- Select Role --</option>';
              res.roles.forEach(role => {
                const option = document.createElement('option');
                option.value = role.RoleName;
                option.textContent = role.RoleName;
                select.appendChild(option);
              });
              if (selectedRole) select.value = selectedRole;
            }
          }, null)
      } else {
        select.innerHTML = `
          <option value="">-- Select Role --</option>
          <option value="Super Admin">Super Admin</option>
          <option value="Admin">Admin</option>
          <option value="Personal Trainer">Personal Trainer</option>
        `;
        if (selectedRole) select.value = selectedRole;
      }
    }

    function loadClubsForUserForm(selectedClub) {
      const select = document.getElementById('userClubInput');
      
      if (true) {
        runServer('getClubsList', [], function(res) {
            if (res.success && res.clubs) {
              select.innerHTML = '<option value="">-- Select Club --</option>';
              res.clubs.forEach(club => {
                const option = document.createElement('option');
                option.value = club.ClubName;
                option.textContent = club.ClubName;
                select.appendChild(option);
              });
              if (selectedClub) select.value = selectedClub;
            }
          }, null)
      } else {
        select.innerHTML = `
          <option value="">-- Select Club --</option>
          <option value="Main Gym">Main Gym</option>
          <option value="Branch Gym">Branch Gym</option>
        `;
        if (selectedClub) select.value = selectedClub;
      }
    }

    function switchDetailTab(tab) {
      // Hide all detail tabs
      document.getElementById('timeinoutTab').classList.add('hidden');
      document.getElementById('activitiesTab').classList.add('hidden');
      document.getElementById('personaltrainingTab').classList.add('hidden');
      document.getElementById('grouptrainingTab').classList.add('hidden');
      document.getElementById('manualgroupDetailTab').classList.add('hidden');

      // Remove active class from all detail tabs
      document.querySelectorAll('.detail-tab').forEach(t => {
        t.classList.remove('border-teal-500', 'text-teal-700');
        t.classList.add('border-transparent', 'text-slate-700');
      });

      // Show selected tab (if it exists - for role-based display)
      const tabElement = document.getElementById(tab + 'Tab');
      if (tabElement) {
        tabElement.classList.remove('hidden');
        
        // Load data when switching to personal training tab (skip if already loaded this session)
        if (tab === 'personaltraining') {
          if (!staffDetailTabsLoaded.personaltraining) {
            loadPersonalTrainingHistory();
            staffDetailTabsLoaded.personaltraining = true;
          } else {
            renderPTTable();
            renderPTPagination();
          }
        }

        // Load data when switching to activities tab (skip if already loaded this session)
        if (tab === 'activities') {
          if (!staffDetailTabsLoaded.activities) {
            loadStaffActivities();
            staffDetailTabsLoaded.activities = true;
          } else {
            renderStaffActivities(cachedActivitiesData);
          }
        }

        // Load data when switching to group training tab (skip if already loaded this session)
        if (tab === 'grouptraining') {
          if (!staffDetailTabsLoaded.grouptraining) {
            loadGroupTrainingHistory();
            staffDetailTabsLoaded.grouptraining = true;
          } else {
            renderGTTable();
            renderGTPagination();
          }
        }

        // Load data when switching to manual group tab (skip if already loaded this session)
        if (tab === 'manualgroupDetail') {
          if (!staffDetailTabsLoaded.manualgroupDetail) {
            loadManualGroupHistory();
            staffDetailTabsLoaded.manualgroupDetail = true;
          } else {
            renderMGTable();
            renderMGPagination();
          }
        }

        // Load data when switching to time in/out tab (skip if already loaded this session)
        if (tab === 'timeinout') {
          if (!staffDetailTabsLoaded.timeinout) {
            loadTioHistory();
            staffDetailTabsLoaded.timeinout = true;
          } else {
            renderTioTable();
            renderTioPagination();
          }
        }
      }
      
      const tabButton = document.querySelector(`[data-tab="${tab}"]`);
      if (tabButton) {
        tabButton.classList.add('border-teal-500', 'text-teal-700');
        tabButton.classList.remove('border-transparent', 'text-slate-700');
      }
    }

    // ==================== PERSONAL TRAINING HISTORY HANDLERS ====================
    let ptCurrentPage = 1;
    const ptRecordsPerPage = 10;
    let ptAllRecords = [];
    let currentPTDetailLogId = null;

    function handlePTDateFilterChange() {
      const val = document.getElementById('ptDateFilter').value;
      document.getElementById('ptCustomDateRange').classList.toggle('hidden', val !== 'custom');
      if (val !== 'custom') {
        loadPersonalTrainingHistory();
      }
    }

    function loadPersonalTrainingHistory() {
      if (!currentStaffDetail) return;

      const tbody = document.getElementById('ptRecordsTableBody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-4 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Memuat data...</td></tr>';

      if (true) {
        runServer('getPersonalTrainingLogList', [], function(res) {
            if (res.success && res.records) {
              const statusFilter = document.getElementById('ptStatusFilter')?.value || 'active';
              ptAllRecords = res.records.filter(r => r.PT_Name === currentStaffDetail.name && (statusFilter === 'archived' ? r.IsArchived : !r.IsArchived));

              const dateFilter = document.getElementById('ptDateFilter')?.value || 'all';
              const dateFrom = document.getElementById('ptDateFrom')?.value;
              const dateTo = document.getElementById('ptDateTo')?.value;
              ptAllRecords = filterRecordsByDateRange(ptAllRecords, 'SessionDate', dateFilter, dateFrom, dateTo);

              // Sort by SessionDate (tanggal sesi, bukan waktu submit)
              const sortOrder = document.getElementById('ptSortOrder')?.value || 'oldest';
              if (sortOrder === 'oldest') {
                ptAllRecords.sort((a, b) => new Date(b.SessionDate) - new Date(a.SessionDate));
              } else {
                ptAllRecords.sort((a, b) => new Date(a.SessionDate) - new Date(b.SessionDate));
              }

              ptCurrentPage = 1;
              renderPTTable();
              renderPTPagination();
            }
          }, null)
      } else {
        ptAllRecords = [];
        renderPTTable();
        renderPTPagination();
      }
    }

    function renderPTTable() {
      const tbody = document.getElementById('ptRecordsTableBody');
      tbody.innerHTML = '';

      const start = (ptCurrentPage - 1) * ptRecordsPerPage;
      const end = start + ptRecordsPerPage;
      const paginatedRecords = ptAllRecords.slice(start, end);

      if (paginatedRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-4 text-center text-slate-400">Tidak ada data personal training</td></tr>';
        document.getElementById('ptRecordCount').textContent = `Showing 0 records`;
        return;
      }

      paginatedRecords.forEach((record, index) => {
        const statusColor = record.Status === 'Success' ? 'bg-green-100 text-green-700' : 
                           record.Status === 'Rejected' ? 'bg-red-100 text-red-700' : 
                           'bg-yellow-100 text-yellow-700';

        const tanggalFormatted = formatDateToDDMMYYYY(record.SessionDate);
        const displayNo = start + index + 1;

        const row = document.createElement('tr');
        row.className = 'border-b border-slate-100 hover:bg-slate-50 transition';
        row.innerHTML = `
          <td class="px-4 py-3 text-sm text-slate-700">${displayNo}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${record.LogID}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${tanggalFormatted}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${record.Member_Name}</td>
          <td class="px-4 py-3 text-sm font-semibold text-slate-800">${record.Club}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${record.SessionType}</td>
          <td class="px-4 py-3 text-sm text-slate-700">
            <span class="inline-block border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700">${record.BookingTimeStart}</span>
          </td>
          <td class="px-4 py-3 text-sm text-slate-700">
            <span class="inline-block border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700">${record.BookingTimeEnd}</span>
          </td>
          <td class="px-4 py-3 text-center">
            <span class="px-2 py-1 text-xs font-bold rounded-full ${statusColor}">
              ${record.Status}
            </span>
          </td>
          <td class="px-4 py-3 text-center">
            <div class="flex justify-center gap-2">
              <button onclick="openPTDetailModal('${record.LogID}')" class="text-blue-500 hover:text-blue-700 text-lg" title="Detail">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(row);
      });

      document.getElementById('ptRecordCount').textContent = `Showing ${start + 1}-${Math.min(end, ptAllRecords.length)} of ${ptAllRecords.length} records`;
    }

    function formatDateToDDMMYYYY(dateString) {
      if (!dateString) return '-';
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateString;
    }

    function getDateRangeForPreset(preset, customFrom, customTo) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (preset === 'today') {
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);
        return { start: today, end: end };
      }
      if (preset === 'yesterday') {
        const start = new Date(today);
        start.setDate(start.getDate() - 1);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        return { start: start, end: end };
      }
      if (preset === 'thisMonth') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start: start, end: end };
      }
      if (preset === 'lastMonth') {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        return { start: start, end: end };
      }
      if (preset === 'custom') {
        if (!customFrom || !customTo) return null;
        const start = new Date(customFrom);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customTo);
        end.setHours(23, 59, 59, 999);
        return { start: start, end: end };
      }
      return null; // 'all'
    }

    function filterRecordsByDateRange(records, dateField, preset, customFrom, customTo) {
      const range = getDateRangeForPreset(preset, customFrom, customTo);
      if (!range) return records;
      return records.filter(r => {
        const d = new Date(r[dateField]);
        if (isNaN(d.getTime())) return true;
        return d >= range.start && d <= range.end;
      });
    }

    function parseCreatedDateForSort(dateStr) {
      if (!dateStr) return 0;
      const parts = dateStr.split(' ');
      const datePart = parts[0];
      const timePart = parts[1] || '00:00:00';
      const dateSegments = datePart.split('/');
      if (dateSegments.length !== 3) return 0;
      const day = dateSegments[0];
      const month = dateSegments[1];
      const year = dateSegments[2];
      return new Date(`${year}-${month}-${day}T${timePart}`).getTime();
    }

    function normalizeTimeForInput(rawTime) {
      if (!rawTime) return '';
      const str = String(rawTime).trim();

      // Format 12 jam dengan AM/PM (misal "9:00:00 AM", "9:00 PM")
      const ampmMatch = str.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])/);
      if (ampmMatch) {
        let hour = parseInt(ampmMatch[1], 10);
        const minute = ampmMatch[2];
        const period = ampmMatch[3].toUpperCase();
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        return String(hour).padStart(2, '0') + ':' + minute;
      }

      // Format 24 jam, dengan/tanpa detik, dengan/tanpa leading zero (misal "9:00:00", "09:00")
      const hmMatch = str.match(/^(\d{1,2}):(\d{2})/);
      if (hmMatch) {
        const hour = String(parseInt(hmMatch[1], 10)).padStart(2, '0');
        const minute = hmMatch[2];
        return hour + ':' + minute;
      }

      return '';
    }

    // Cache Club & Session Type khusus buat popup Edit (PT/GT/MG), biar gak fetch ulang ke server tiap dibuka
    let cachedClubsData = null;
    let cachedSessionTypesData = null;

    function getClubsListCached(callback) {
      if (cachedClubsData) {
        callback({ success: true, clubs: cachedClubsData });
        return;
      }
      if (true) {
        runServer('getClubsList', [], function(res) {
            if (res.success && res.clubs) cachedClubsData = res.clubs;
            callback(res);
          }, function(err) {
            callback({ success: false, message: err.message });
          })
      } else {
        callback({ success: false, clubs: [] });
      }
    }

    function getSessionTypesListCached(callback) {
      if (cachedSessionTypesData) {
        callback({ success: true, sessions: cachedSessionTypesData });
        return;
      }
      if (true) {
        runServer('getSessionTypesList', [], function(res) {
            if (res.success && res.sessions) cachedSessionTypesData = res.sessions;
            callback(res);
          }, function(err) {
            callback({ success: false, message: err.message });
          })
      } else {
        callback({ success: false, sessions: [] });
      }
    }

    function renderPTPagination() {
      const totalPages = Math.ceil(ptAllRecords.length / ptRecordsPerPage);
      const container = document.getElementById('ptPageButtons');
      container.innerHTML = '';

      if (totalPages <= 1) {
        document.getElementById('ptPaginationContainer').classList.add('hidden');
        return;
      }

      document.getElementById('ptPaginationContainer').classList.remove('hidden');

      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = i;
        btn.className = `px-3 py-2 rounded-lg font-bold transition ${
          i === ptCurrentPage
            ? 'bg-teal-500 text-white'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
        }`;
        btn.onclick = () => {
          ptCurrentPage = i;
          renderPTTable();
          renderPTPagination();
        };
        container.appendChild(btn);
      }
    }

    function previousPTPage() {
      if (ptCurrentPage > 1) {
        ptCurrentPage--;
        renderPTTable();
        renderPTPagination();
      }
    }

    function nextPTPage() {
      const totalPages = Math.ceil(ptAllRecords.length / ptRecordsPerPage);
      if (ptCurrentPage < totalPages) {
        ptCurrentPage++;
        renderPTTable();
        renderPTPagination();
      }
    }

    // ==================== GROUP TRAINING HISTORY HANDLERS ====================
    let gtCurrentPage = 1;
    const gtRecordsPerPage = 10;
    let gtAllRecords = [];
    let currentGTDetailLogId = null;

    function handleGTDateFilterChange() {
      const val = document.getElementById('gtDateFilter').value;
      document.getElementById('gtCustomDateRange').classList.toggle('hidden', val !== 'custom');
      if (val !== 'custom') {
        loadGroupTrainingHistory();
      }
    }

    function loadGroupTrainingHistory() {
      if (!currentStaffDetail) return;

      const tbody = document.getElementById('gtRecordsTableBody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-4 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Memuat data...</td></tr>';

      if (true) {
        runServer('getGroupTrainingLogList', [], function(res) {
            if (res.success && res.records) {
              const statusFilter = document.getElementById('gtStatusFilter')?.value || 'active';
              gtAllRecords = res.records.filter(r => r.Instructor_Name === currentStaffDetail.name && (statusFilter === 'archived' ? r.IsArchived : !r.IsArchived));

              const dateFilter = document.getElementById('gtDateFilter')?.value || 'all';
              const dateFrom = document.getElementById('gtDateFrom')?.value;
              const dateTo = document.getElementById('gtDateTo')?.value;
              gtAllRecords = filterRecordsByDateRange(gtAllRecords, 'SessionDate', dateFilter, dateFrom, dateTo);

              const sortOrder = document.getElementById('gtSortOrder')?.value || 'oldest';
              if (sortOrder === 'oldest') {
                gtAllRecords.sort((a, b) => new Date(b.SessionDate) - new Date(a.SessionDate));
              } else {
                gtAllRecords.sort((a, b) => new Date(a.SessionDate) - new Date(b.SessionDate));
              }

              gtCurrentPage = 1;
              renderGTTable();
              renderGTPagination();
            }
          }, null)
      } else {
        gtAllRecords = [];
        renderGTTable();
        renderGTPagination();
      }
    }

    function renderGTTable() {
      const tbody = document.getElementById('gtRecordsTableBody');
      tbody.innerHTML = '';

      const start = (gtCurrentPage - 1) * gtRecordsPerPage;
      const end = start + gtRecordsPerPage;
      const paginatedRecords = gtAllRecords.slice(start, end);

      if (paginatedRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-4 text-center text-slate-400">Tidak ada data group training</td></tr>';
        document.getElementById('gtRecordCount').textContent = `Showing 0 records`;
        return;
      }

      paginatedRecords.forEach((record, index) => {
        const statusColor = record.Status === 'Success' ? 'bg-green-100 text-green-700' :
                           record.Status === 'Rejected' ? 'bg-red-100 text-red-700' :
                           'bg-yellow-100 text-yellow-700';

        const tanggalFormatted = formatDateToDDMMYYYY(record.SessionDate);
        const displayNo = start + index + 1;

        const row = document.createElement('tr');
        row.className = 'border-b border-slate-100 hover:bg-slate-50 transition';
        row.innerHTML = `
          <td class="px-4 py-3 text-sm text-slate-700">${displayNo}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${record.LogID}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${tanggalFormatted}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${record.Member_Name}</td>
          <td class="px-4 py-3 text-sm font-semibold text-slate-800">${record.Club}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${record.SessionType}</td>
          <td class="px-4 py-3 text-sm text-slate-700">
            <span class="inline-block border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700">${record.BookingTimeStart}</span>
          </td>
          <td class="px-4 py-3 text-sm text-slate-700">
            <span class="inline-block border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700">${record.BookingTimeEnd}</span>
          </td>
          <td class="px-4 py-3 text-center">
            <span class="px-2 py-1 text-xs font-bold rounded-full ${statusColor}">
              ${record.Status}
            </span>
          </td>
          <td class="px-4 py-3 text-center">
            <div class="flex justify-center gap-2">
              <button onclick="openGTDetailModal('${record.LogID}')" class="text-blue-500 hover:text-blue-700 text-lg" title="Detail">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(row);
      });

      document.getElementById('gtRecordCount').textContent = `Showing ${start + 1}-${Math.min(end, gtAllRecords.length)} of ${gtAllRecords.length} records`;
    }

    function renderGTPagination() {
      const totalPages = Math.ceil(gtAllRecords.length / gtRecordsPerPage);
      const container = document.getElementById('gtPageButtons');
      container.innerHTML = '';

      if (totalPages <= 1) {
        document.getElementById('gtPaginationContainer').classList.add('hidden');
        return;
      }

      document.getElementById('gtPaginationContainer').classList.remove('hidden');

      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = i;
        btn.className = `px-3 py-2 rounded-lg font-bold transition ${
          i === gtCurrentPage
            ? 'bg-teal-500 text-white'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
        }`;
        btn.onclick = () => {
          gtCurrentPage = i;
          renderGTTable();
          renderGTPagination();
        };
        container.appendChild(btn);
      }
    }

    function previousGTPage() {
      if (gtCurrentPage > 1) {
        gtCurrentPage--;
        renderGTTable();
        renderGTPagination();
      }
    }

    function nextGTPage() {
      const totalPages = Math.ceil(gtAllRecords.length / gtRecordsPerPage);
      if (gtCurrentPage < totalPages) {
        gtCurrentPage++;
        renderGTTable();
        renderGTPagination();
      }
    }

    function openGTDetailModal(logId) {
      const record = gtAllRecords.find(r => r.LogID === logId);
      if (!record) return;

      currentGTDetailLogId = logId;

      const statusColor = record.Status === 'Success' ? 'bg-green-100 text-green-700' :
                         record.Status === 'Rejected' ? 'bg-red-100 text-red-700' :
                         'bg-yellow-100 text-yellow-700';

      document.getElementById('gtDetailID').textContent = record.LogID;
      document.getElementById('gtDetailCreatedDate').textContent = record.CreatedDate || '-';
      document.getElementById('gtDetailClub').innerHTML = `<span class="inline-block bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-sm font-bold">${record.Club}</span>`;
      document.getElementById('gtDetailSessionType').textContent = record.SessionType;
      document.getElementById('gtDetailMember').textContent = record.Member_Name;
      document.getElementById('gtDetailTanggal').textContent = formatDateToDDMMYYYY(record.SessionDate);
      document.getElementById('gtDetailInstruktur').textContent = record.Instructor_Name || '-';
      document.getElementById('gtDetailBookingTime').innerHTML = `<span class="inline-block border border-slate-300 rounded-lg px-3 py-1 text-sm font-semibold text-slate-700">${record.BookingTimeStart} - ${record.BookingTimeEnd}</span>`;
      document.getElementById('gtDetailStatus').innerHTML = `<span class="inline-block px-3 py-1 text-sm font-bold rounded-full ${statusColor}">${record.Status}</span>`;
      document.getElementById('gtDetailAdminNotes').textContent = record.AdminNotes || '-';

      setDetailArchiveButton('gtDetailArchiveBtn', !!record.IsArchived, record.Status);
      applyDetailButtonPermissions('gtDetailEditBtn', 'gtDetailArchiveBtn', 'Manual Cutting');
      document.getElementById('gtDetailModal').classList.remove('hidden');
    }

    function closeGTDetailModal() {
      document.getElementById('gtDetailModal').classList.add('hidden');
    }

    function editGTFromDetail() {
      if (!currentGTDetailLogId) return;
      openGTEditModal(currentGTDetailLogId);
    }

    function deleteGTFromDetail() {
      if (!currentGTDetailLogId) return;
      const record = gtAllRecords.find(r => r.LogID === currentGTDetailLogId);
      if (!record) return;
      closeGTDetailModal();
      if (record.IsArchived) {
        restoreGTRecord(record.LogID, record.Member_Name);
      } else {
        deleteGTRecord(record.LogID, record.Member_Name);
      }
    }

    function openGTEditModal(logId) {
      const record = gtAllRecords.find(r => r.LogID === logId);
      if (!record) return;

      document.getElementById('gtEditLogId').value = logId;
      document.getElementById('gtEditMember').value = record.Member_Name;
      document.getElementById('gtEditTanggal').value = record.SessionDate;
      document.getElementById('gtEditTimeStart').value = normalizeTimeForInput(record.BookingTimeStart);
      document.getElementById('gtEditTimeEnd').value = normalizeTimeForInput(record.BookingTimeEnd);

      loadGTEditDropdowns(record.Club, record.SessionType);
      configureEditModalButtons('gt', 'GT', record.Status);

      closeGTDetailModal();
      document.getElementById('gtEditModal').classList.remove('hidden');
    }

    function closeGTEditModal() {
      document.getElementById('gtEditModal').classList.add('hidden');
    }

    function loadGTEditDropdowns(selectedClub, selectedSessionType) {
      const clubSelect = document.getElementById('gtEditClub');
      const sessionSelect = document.getElementById('gtEditSessionType');

      getClubsListCached(function(res) {
        if (res.success && res.clubs) {
          clubSelect.innerHTML = '';
          res.clubs.forEach(club => {
            const option = document.createElement('option');
            option.value = club.ClubName;
            option.textContent = club.ClubName;
            clubSelect.appendChild(option);
          });
          if (selectedClub) clubSelect.value = selectedClub;
        }
      });

      getSessionTypesListCached(function(res) {
        if (res.success && res.sessions) {
          sessionSelect.innerHTML = '';
          res.sessions.forEach(session => {
            const option = document.createElement('option');
            option.value = session.SessionName;
            option.textContent = session.SessionName;
            sessionSelect.appendChild(option);
          });
          if (selectedSessionType) sessionSelect.value = selectedSessionType;
        }
      });
    }

    function submitGTEditForm(event) {
      event.preventDefault();
      const logId = document.getElementById('gtEditLogId').value;

      const formData = {
        logId: logId,
        club: document.getElementById('gtEditClub').value,
        sessionType: document.getElementById('gtEditSessionType').value,
        member: document.getElementById('gtEditMember').value,
        sessionDate: document.getElementById('gtEditTanggal').value,
        timeStart: document.getElementById('gtEditTimeStart').value,
        timeEnd: document.getElementById('gtEditTimeEnd').value,
        currentUser: currentUser.name
      };

      const sendUpdate = function(data) {
        showToast('Menyimpan perubahan...', 'info');

        if (true) {
          runServer('updateGroupTrainingLog', [data], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                closeGTEditModal();
                loadGroupTrainingHistory();
              } else {
                showToast(res.message, 'error');
              }
            }, null)
        } else {
          showToast('Simulasi: Perubahan disimpan!', 'success');
          closeGTEditModal();
          loadGroupTrainingHistory();
        }
      };
      submitEditWithStatusRule('GT', formData, sendUpdate);
    }

    function deleteGTRecord(logId, memberName) {
      showConfirmModal(`Yakin ingin memindahkan record ${logId} untuk member ${memberName} ke arsip?`, function() {
        showToast('Memindahkan record ke arsip...', 'info');

        if (true) {
          runServer('deleteGroupTrainingLog', [logId, currentUser.name], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                loadGroupTrainingHistory();
              } else {
                showToast(res.message, 'error');
              }
            }, null)
        } else {
          showToast('Simulasi: Record diarsipkan!', 'success');
          loadGroupTrainingHistory();
        }
      });
    }

    function restoreGTRecord(logId, memberName) {
      showConfirmModal(`Yakin ingin mengembalikan record ${logId} untuk member ${memberName} dari arsip?`, function() {
        showToast('Mengembalikan record...', 'info');

        if (true) {
          runServer('restoreGroupTrainingLog', [logId, currentUser.name], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                loadGroupTrainingHistory();
              } else {
                showToast(res.message, 'error');
              }
            }, null)
        } else {
          showToast('Simulasi: Record dikembalikan!', 'success');
          loadGroupTrainingHistory();
        }
      });
    }

    // ==================== MANUAL GROUP HISTORY HANDLERS ====================
    let mgCurrentPage = 1;
    const mgRecordsPerPage = 10;
    let mgAllRecords = [];
    let currentMGDetailLogId = null;

    function handleMGDateFilterChange() {
      const val = document.getElementById('mgDateFilter').value;
      document.getElementById('mgCustomDateRange').classList.toggle('hidden', val !== 'custom');
      if (val !== 'custom') {
        loadManualGroupHistory();
      }
    }

    function loadManualGroupHistory() {
      if (!currentStaffDetail) return;

      const tbody = document.getElementById('mgRecordsTableBody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-4 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Memuat data...</td></tr>';

      if (true) {
        runServer('getManualGroupLogList', [], function(res) {
            if (res.success && res.records) {
              const statusFilter = document.getElementById('mgStatusFilter')?.value || 'active';
              mgAllRecords = res.records.filter(r => r.Instructor_Name === currentStaffDetail.name && (statusFilter === 'archived' ? r.IsArchived : !r.IsArchived));

              const dateFilter = document.getElementById('mgDateFilter')?.value || 'all';
              const dateFrom = document.getElementById('mgDateFrom')?.value;
              const dateTo = document.getElementById('mgDateTo')?.value;
              mgAllRecords = filterRecordsByDateRange(mgAllRecords, 'ScheduleDate', dateFilter, dateFrom, dateTo);

              const sortOrder = document.getElementById('mgSortOrder')?.value || 'oldest';
              if (sortOrder === 'oldest') {
                mgAllRecords.sort((a, b) => new Date(b.ScheduleDate) - new Date(a.ScheduleDate));
              } else {
                mgAllRecords.sort((a, b) => new Date(a.ScheduleDate) - new Date(b.ScheduleDate));
              }

              mgCurrentPage = 1;
              renderMGTable();
              renderMGPagination();
            }
          }, null)
      } else {
        mgAllRecords = [];
        renderMGTable();
        renderMGPagination();
      }
    }

    function renderMGTable() {
      const tbody = document.getElementById('mgRecordsTableBody');
      tbody.innerHTML = '';

      const start = (mgCurrentPage - 1) * mgRecordsPerPage;
      const end = start + mgRecordsPerPage;
      const paginatedRecords = mgAllRecords.slice(start, end);

      if (paginatedRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-4 text-center text-slate-400">Tidak ada data manual group</td></tr>';
        document.getElementById('mgRecordCount').textContent = `Showing 0 records`;
        return;
      }

      paginatedRecords.forEach((record, index) => {
        const statusColor = record.Status === 'Success' ? 'bg-green-100 text-green-700' :
                           record.Status === 'Rejected' ? 'bg-red-100 text-red-700' :
                           'bg-yellow-100 text-yellow-700';

        const scheduleFormatted = `${formatDateToDDMMYYYY(record.ScheduleDate)} ${record.ScheduleTime}`;
        const displayNo = start + index + 1;

        const row = document.createElement('tr');
        row.className = 'border-b border-slate-100 hover:bg-slate-50 transition';
        row.innerHTML = `
          <td class="px-4 py-3 text-sm text-slate-700">${displayNo}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${record.LogID}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${scheduleFormatted}</td>
          <td class="px-4 py-3 text-center">
            <button onclick="showMGMembersPopup('${record.LogID}')" class="text-teal-600 hover:text-teal-700 font-bold text-xs bg-teal-50 hover:bg-teal-100 px-3 py-1 rounded-lg transition">
              <i class="fa-solid fa-users mr-1"></i> Show
            </button>
          </td>
          <td class="px-4 py-3 text-sm font-semibold text-slate-800">${record.Club}</td>
          <td class="px-4 py-3 text-center">
            <span class="px-2 py-1 text-xs font-bold rounded-full ${statusColor}">
              ${record.Status}
            </span>
          </td>
          <td class="px-4 py-3 text-center">
            <div class="flex justify-center gap-2">
              <button onclick="openMGDetailModal('${record.LogID}')" class="text-blue-500 hover:text-blue-700 text-lg" title="Detail">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(row);
      });

      document.getElementById('mgRecordCount').textContent = `Showing ${start + 1}-${Math.min(end, mgAllRecords.length)} of ${mgAllRecords.length} records`;
    }

    function renderMGPagination() {
      const totalPages = Math.ceil(mgAllRecords.length / mgRecordsPerPage);
      const container = document.getElementById('mgPageButtons');
      container.innerHTML = '';

      if (totalPages <= 1) {
        document.getElementById('mgPaginationContainer').classList.add('hidden');
        return;
      }

      document.getElementById('mgPaginationContainer').classList.remove('hidden');

      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = i;
        btn.className = `px-3 py-2 rounded-lg font-bold transition ${
          i === mgCurrentPage
            ? 'bg-teal-500 text-white'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
        }`;
        btn.onclick = () => {
          mgCurrentPage = i;
          renderMGTable();
          renderMGPagination();
        };
        container.appendChild(btn);
      }
    }

    function previousMGPage() {
      if (mgCurrentPage > 1) {
        mgCurrentPage--;
        renderMGTable();
        renderMGPagination();
      }
    }

    function nextMGPage() {
      const totalPages = Math.ceil(mgAllRecords.length / mgRecordsPerPage);
      if (mgCurrentPage < totalPages) {
        mgCurrentPage++;
        renderMGTable();
        renderMGPagination();
      }
    }

    function openMGDetailModal(logId) {
      const record = mgAllRecords.find(r => r.LogID === logId);
      if (!record) return;

      currentMGDetailLogId = logId;

      const statusColor = record.Status === 'Success' ? 'bg-green-100 text-green-700' :
                         record.Status === 'Rejected' ? 'bg-red-100 text-red-700' :
                         'bg-yellow-100 text-yellow-700';

      document.getElementById('mgDetailID').textContent = record.LogID;
      document.getElementById('mgDetailCreatedDate').textContent = record.CreatedDate || '-';
      document.getElementById('mgDetailClub').innerHTML = `<span class="inline-block bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-sm font-bold">${record.Club}</span>`;
      document.getElementById('mgDetailInstruktur').textContent = record.Instructor_Name || '-';
      document.getElementById('mgDetailMember').textContent = record.Member_Name;
      document.getElementById('mgDetailSchedule').textContent = `${formatDateToDDMMYYYY(record.ScheduleDate)} ${record.ScheduleTime}`;
      document.getElementById('mgDetailStatus').innerHTML = `<span class="inline-block px-3 py-1 text-sm font-bold rounded-full ${statusColor}">${record.Status}</span>`;
      document.getElementById('mgDetailAdminNotes').textContent = record.AdminNotes || '-';

      setDetailArchiveButton('mgDetailArchiveBtn', !!record.IsArchived, record.Status);
      applyDetailButtonPermissions('mgDetailEditBtn', 'mgDetailArchiveBtn', 'Manual Cutting');
      document.getElementById('mgDetailModal').classList.remove('hidden');
    }

    function closeMGDetailModal() {
      document.getElementById('mgDetailModal').classList.add('hidden');
    }

    function showMGMembersPopup(logId) {
      const record = mgAllRecords.find(r => r.LogID === logId);
      if (!record) return;

      const members = (record.Member_Name || '').split(',').map(m => m.trim()).filter(m => m);
      const listContainer = document.getElementById('mgMembersPopupList');
      const metaContainer = document.getElementById('mgMembersPopupMeta');

      const scheduleFormatted = `${formatDateToDDMMYYYY(record.ScheduleDate)} ${record.ScheduleTime}`;
      const statusColor = record.Status === 'Success' ? 'bg-green-100 text-green-700' :
                         record.Status === 'Rejected' ? 'bg-red-100 text-red-700' :
                         'bg-yellow-100 text-yellow-700';
      metaContainer.innerHTML = `
        <div class="flex justify-between items-center">
          <span class="text-slate-500">ID</span>
          <span class="font-semibold text-slate-800">${record.LogID}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-slate-500">Schedule</span>
          <span class="font-semibold text-slate-800">${scheduleFormatted}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-slate-500">Status</span>
          <span class="px-2 py-0.5 text-xs font-bold rounded-full ${statusColor}">${record.Status}</span>
        </div>
      `;

      if (members.length === 0) {
        listContainer.innerHTML = '<p class="text-slate-400 text-sm text-center py-4">Tidak ada data member</p>';
      } else {
        listContainer.innerHTML = members.map((m, i) => `
          <div class="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
            <span class="text-xs font-bold text-slate-400 w-5">${i + 1}.</span>
            <span class="text-sm text-slate-800">${m}</span>
          </div>
        `).join('');
      }

      document.getElementById('mgMembersPopup').classList.remove('hidden');
    }

    function closeMGMembersPopup() {
      document.getElementById('mgMembersPopup').classList.add('hidden');
    }

    function editMGFromDetail() {
      if (!currentMGDetailLogId) return;
      openMGEditModal(currentMGDetailLogId);
    }

    function deleteMGFromDetail() {
      if (!currentMGDetailLogId) return;
      const record = mgAllRecords.find(r => r.LogID === currentMGDetailLogId);
      if (!record) return;
      closeMGDetailModal();
      if (record.IsArchived) {
        restoreMGRecord(record.LogID, record.Member_Name);
      } else {
        deleteMGRecord(record.LogID, record.Member_Name);
      }
    }

    function createMGEditMemberField(value) {
      const div = document.createElement('div');
      div.className = 'mg-edit-member-field flex gap-2';
      div.innerHTML = `
        <input type="text" placeholder="Nama Member" value="${value || ''}" required class="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none mg-edit-member-input">
        <button type="button" onclick="removeMGEditMemberField(this)" class="text-red-500 hover:text-red-700 px-2" title="Remove">
          <i class="fa-solid fa-trash"></i>
        </button>
      `;
      return div;
    }

    function addMGEditMemberField() {
      const container = document.getElementById('mgEditMemberFieldsContainer');
      container.appendChild(createMGEditMemberField(''));
    }

    function removeMGEditMemberField(button) {
      const container = document.getElementById('mgEditMemberFieldsContainer');
      const fields = container.querySelectorAll('.mg-edit-member-field');
      if (fields.length > 1) {
        button.closest('.mg-edit-member-field').remove();
      } else {
        showToast('Minimal harus ada 1 member', 'error');
      }
    }

    function openMGEditModal(logId) {
      const record = mgAllRecords.find(r => r.LogID === logId);
      if (!record) return;

      document.getElementById('mgEditLogId').value = logId;
      document.getElementById('mgEditScheduleDate').value = record.ScheduleDate;
      document.getElementById('mgEditScheduleTime').value = normalizeTimeForInput(record.ScheduleTime);

      // Populate member fields from existing data (not blank)
      const memberContainer = document.getElementById('mgEditMemberFieldsContainer');
      memberContainer.innerHTML = '';
      const existingMembers = (record.Member_Name || '').split(',').map(m => m.trim()).filter(m => m);
      if (existingMembers.length > 0) {
        existingMembers.forEach(m => memberContainer.appendChild(createMGEditMemberField(m)));
      } else {
        memberContainer.appendChild(createMGEditMemberField(''));
      }

      loadMGEditDropdowns(record.Club);
      configureEditModalButtons('mg', 'MG', record.Status);

      closeMGDetailModal();
      document.getElementById('mgEditModal').classList.remove('hidden');
    }

    function closeMGEditModal() {
      document.getElementById('mgEditModal').classList.add('hidden');
    }

    function loadMGEditDropdowns(selectedClub) {
      const clubSelect = document.getElementById('mgEditClub');

      getClubsListCached(function(res) {
        if (res.success && res.clubs) {
          clubSelect.innerHTML = '';
          res.clubs.forEach(club => {
            const option = document.createElement('option');
            option.value = club.ClubName;
            option.textContent = club.ClubName;
            clubSelect.appendChild(option);
          });
          if (selectedClub) clubSelect.value = selectedClub;
        }
      });
    }

    function submitMGEditForm(event) {
      event.preventDefault();

      const memberValidation = validateMGMembers('mgEditMemberFieldsContainer');
      if (!memberValidation.valid) {
        showToast(memberValidation.message, 'error');
        return;
      }

      const logId = document.getElementById('mgEditLogId').value;
      const members = Array.from(document.querySelectorAll('#mgEditMemberFieldsContainer .mg-edit-member-input')).map(el => el.value.trim());

      const formData = {
        logId: logId,
        club: document.getElementById('mgEditClub').value,
        members: members,
        scheduleDate: document.getElementById('mgEditScheduleDate').value,
        scheduleTime: document.getElementById('mgEditScheduleTime').value,
        currentUser: currentUser.name
      };

      const sendUpdate = function(data) {
        showToast('Menyimpan perubahan...', 'info');

        if (true) {
          runServer('updateManualGroupLog', [data], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                closeMGEditModal();
                loadManualGroupHistory();
              } else {
                showToast(res.message, 'error');
              }
            }, null)
        } else {
          showToast('Simulasi: Perubahan disimpan!', 'success');
          closeMGEditModal();
          loadManualGroupHistory();
        }
      };
      submitEditWithStatusRule('MG', formData, sendUpdate);
    }

    function deleteMGRecord(logId, memberName) {
      showConfirmModal(`Yakin ingin memindahkan record ${logId} untuk member ${memberName} ke arsip?`, function() {
        showToast('Memindahkan record ke arsip...', 'info');

        if (true) {
          runServer('deleteManualGroupLog', [logId, currentUser.name], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                loadManualGroupHistory();
              } else {
                showToast(res.message, 'error');
              }
            }, null)
        } else {
          showToast('Simulasi: Record diarsipkan!', 'success');
          loadManualGroupHistory();
        }
      });
    }

    function restoreMGRecord(logId, memberName) {
      showConfirmModal(`Yakin ingin mengembalikan record ${logId} untuk member ${memberName} dari arsip?`, function() {
        showToast('Mengembalikan record...', 'info');

        if (true) {
          runServer('restoreManualGroupLog', [logId, currentUser.name], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                loadManualGroupHistory();
              } else {
                showToast(res.message, 'error');
              }
            }, null)
        } else {
          showToast('Simulasi: Record dikembalikan!', 'success');
          loadManualGroupHistory();
        }
      });
    }

    // ==================== TIME IN/OUT (DETAIL STAFF) HANDLERS ====================
    let tioCurrentPage = 1;
    const tioRecordsPerPage = 10;
    let tioAllRecords = [];
    let currentTioDetailLogId = null;

    function loadTioHistory() {
      if (!currentStaffDetail) return;

      const tbody = document.getElementById('tioRecordsTableBody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Memuat data...</td></tr>';

      if (true) {
        runServer('getTimeInOutLogList', [], function(res) {
            if (res.success && res.records) {
              const statusFilter = document.getElementById('tioStatusFilter')?.value || 'active';
              tioAllRecords = res.records.filter(r => r.PT_Name === currentStaffDetail.name && (statusFilter === 'archived' ? r.IsArchived : !r.IsArchived));

              const sortOrder = document.getElementById('tioSortOrder')?.value || 'oldest';
              if (sortOrder === 'oldest') {
                tioAllRecords.sort((a, b) => parseCreatedDateForSort(b.CreatedDate) - parseCreatedDateForSort(a.CreatedDate));
              } else {
                tioAllRecords.sort((a, b) => parseCreatedDateForSort(a.CreatedDate) - parseCreatedDateForSort(b.CreatedDate));
              }

              tioCurrentPage = 1;
              renderTioTable();
              renderTioPagination();
            }
          }, null)
      } else {
        tioAllRecords = [];
        renderTioTable();
        renderTioPagination();
      }
    }

    function renderTioTable() {
      const tbody = document.getElementById('tioRecordsTableBody');
      tbody.innerHTML = '';

      const start = (tioCurrentPage - 1) * tioRecordsPerPage;
      const end = start + tioRecordsPerPage;
      const paginatedRecords = tioAllRecords.slice(start, end);

      if (paginatedRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-slate-400">Tidak ada data time in/out</td></tr>';
        document.getElementById('tioRecordCount').textContent = `Showing 0 records`;
        return;
      }

      paginatedRecords.forEach((record, index) => {
        const statusColor = record.Status === 'Success' ? 'bg-green-100 text-green-700' :
                           record.Status === 'Rejected' ? 'bg-red-100 text-red-700' :
                           'bg-yellow-100 text-yellow-700';
        const typeColor = record.Type === 'Time In' ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-700';
        const displayNo = start + index + 1;

        const row = document.createElement('tr');
        row.className = 'border-b border-slate-100 hover:bg-slate-50 transition';
        row.innerHTML = `
          <td class="px-4 py-3 text-sm text-slate-700">${displayNo}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${record.LogID}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${record.Member_Name}</td>
          <td class="px-4 py-3 text-sm">
            <span class="px-2 py-1 text-xs font-bold rounded-full ${typeColor}">${record.Type}</span>
          </td>
          <td class="px-4 py-3 text-center">
            <span class="px-2 py-1 text-xs font-bold rounded-full ${statusColor}">
              ${record.Status}
            </span>
          </td>
          <td class="px-4 py-3 text-center">
            <div class="flex justify-center gap-2">
              <button onclick="openTioDetailModal('${record.LogID}')" class="text-blue-500 hover:text-blue-700 text-lg" title="Detail">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(row);
      });

      document.getElementById('tioRecordCount').textContent = `Showing ${start + 1}-${Math.min(end, tioAllRecords.length)} of ${tioAllRecords.length} records`;
    }

    function renderTioPagination() {
      const totalPages = Math.ceil(tioAllRecords.length / tioRecordsPerPage);
      const container = document.getElementById('tioPageButtons');
      container.innerHTML = '';

      if (totalPages <= 1) {
        document.getElementById('tioPaginationContainer').classList.add('hidden');
        return;
      }

      document.getElementById('tioPaginationContainer').classList.remove('hidden');

      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = i;
        btn.className = `px-3 py-2 rounded-lg font-bold transition ${
          i === tioCurrentPage
            ? 'bg-teal-500 text-white'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
        }`;
        btn.onclick = () => {
          tioCurrentPage = i;
          renderTioTable();
          renderTioPagination();
        };
        container.appendChild(btn);
      }
    }

    function previousTioPage() {
      if (tioCurrentPage > 1) {
        tioCurrentPage--;
        renderTioTable();
        renderTioPagination();
      }
    }

    function nextTioPage() {
      const totalPages = Math.ceil(tioAllRecords.length / tioRecordsPerPage);
      if (tioCurrentPage < totalPages) {
        tioCurrentPage++;
        renderTioTable();
        renderTioPagination();
      }
    }

    function openTioDetailModal(logId) {
      const record = tioAllRecords.find(r => r.LogID === logId);
      if (!record) return;

      currentTioDetailLogId = logId;

      const statusColor = record.Status === 'Success' ? 'bg-green-100 text-green-700' :
                         record.Status === 'Rejected' ? 'bg-red-100 text-red-700' :
                         'bg-yellow-100 text-yellow-700';
      const typeColor = record.Type === 'Time In' ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-700';

      document.getElementById('tioDetailID').textContent = record.LogID;
      document.getElementById('tioDetailCreatedDate').textContent = record.CreatedDate || '-';
      document.getElementById('tioDetailPTName').textContent = record.PT_Name || '-';
      document.getElementById('tioDetailMember').textContent = record.Member_Name;
      document.getElementById('tioDetailType').innerHTML = `<span class="inline-block px-3 py-1 text-sm font-bold rounded-full ${typeColor}">${record.Type}</span>`;
      document.getElementById('tioDetailStatus').innerHTML = `<span class="inline-block px-3 py-1 text-sm font-bold rounded-full ${statusColor}">${record.Status}</span>`;
      document.getElementById('tioDetailAdminNotes').textContent = record.AdminNotes || '-';

      setDetailArchiveButton('tioDetailArchiveBtn', !!record.IsArchived, record.Status);
      applyDetailButtonPermissions('tioDetailEditBtn', 'tioDetailArchiveBtn', 'Time Tracking');
      document.getElementById('tioDetailModal').classList.remove('hidden');
    }

    function closeTioDetailModal() {
      document.getElementById('tioDetailModal').classList.add('hidden');
    }

    function editTioFromDetail() {
      if (!currentTioDetailLogId) return;
      openTioEditModal(currentTioDetailLogId);
    }

    function deleteTioFromDetail() {
      if (!currentTioDetailLogId) return;
      const record = tioAllRecords.find(r => r.LogID === currentTioDetailLogId);
      if (!record) return;
      closeTioDetailModal();
      if (record.IsArchived) {
        restoreTioRecord(record.LogID, record.Member_Name);
      } else {
        deleteTioRecord(record.LogID, record.Member_Name);
      }
    }

    function openTioEditModal(logId) {
      const record = tioAllRecords.find(r => r.LogID === logId);
      if (!record) return;

      document.getElementById('tioEditLogId').value = logId;
      document.getElementById('tioEditMember').value = record.Member_Name;
      document.getElementById('tioEditType').value = record.Type;
      configureEditModalButtons('tio', 'TIO', record.Status);

      closeTioDetailModal();
      document.getElementById('tioEditModal').classList.remove('hidden');
    }

    function closeTioEditModal() {
      document.getElementById('tioEditModal').classList.add('hidden');
    }

    function submitTioEditForm(event) {
      event.preventDefault();
      const logId = document.getElementById('tioEditLogId').value;

      const formData = {
        logId: logId,
        member: document.getElementById('tioEditMember').value,
        type: document.getElementById('tioEditType').value,
        currentUser: currentUser.name
      };

      const sendUpdate = function(data) {
        showToast('Menyimpan perubahan...', 'info');

        if (true) {
          runServer('updateTimeInOutLog', [data], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                closeTioEditModal();
                loadTioHistory();
              } else {
                showToast(res.message, 'error');
              }
            }, null)
        } else {
          showToast('Simulasi: Perubahan disimpan!', 'success');
          closeTioEditModal();
          loadTioHistory();
        }
      };
      submitEditWithStatusRule('TIO', formData, sendUpdate);
    }

    function deleteTioRecord(logId, memberName) {
      showConfirmModal(`Yakin ingin memindahkan record ${logId} untuk member ${memberName} ke arsip?`, function() {
        showToast('Memindahkan record ke arsip...', 'info');

        if (true) {
          runServer('deleteTimeInOutLog', [logId, currentUser.name], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                loadTioHistory();
              } else {
                showToast(res.message, 'error');
              }
            }, null)
        } else {
          showToast('Simulasi: Record diarsipkan!', 'success');
          loadTioHistory();
        }
      });
    }

    function restoreTioRecord(logId, memberName) {
      showConfirmModal(`Yakin ingin mengembalikan record ${logId} untuk member ${memberName} dari arsip?`, function() {
        showToast('Mengembalikan record...', 'info');

        if (true) {
          runServer('restoreTimeInOutLog', [logId, currentUser.name], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                loadTioHistory();
              } else {
                showToast(res.message, 'error');
              }
            }, null)
        } else {
          showToast('Simulasi: Record dikembalikan!', 'success');
          loadTioHistory();
        }
      });
    }

    function formatExerciseLog(raw) {
      if (!raw || raw.trim() === '') return '<p class="text-slate-400">-</p>';

      const exercises = raw.split(' | ');
      return exercises.map(ex => {
        const separatorIdx = ex.indexOf(': ');
        if (separatorIdx === -1) return `<p>${ex}</p>`;

        const name = ex.substring(0, separatorIdx);
        const setsStr = ex.substring(separatorIdx + 2);

        const setRegex = /Set(\d+)\((.*?)kg,(.*?)\)/g;
        let setsHtml = '';
        let match;
        while ((match = setRegex.exec(setsStr)) !== null) {
          const setNum = match[1];
          const weight = match[2] && match[2].trim() !== '' ? match[2] : '-';
          const reps = match[3] && match[3].trim() !== '' ? match[3] : '-';
          setsHtml += `<p class="pl-3 text-slate-600">Set${setNum}: ${weight}kg &times; ${reps} reps</p>`;
        }

        return `<div class="mb-3 last:mb-0"><p class="font-bold text-slate-800 mb-1">${name}</p>${setsHtml}</div>`;
      }).join('');
    }

    function openPTDetailModal(logId) {
      const record = ptAllRecords.find(r => r.LogID === logId);
      if (!record) return;

      currentPTDetailLogId = logId;

      const statusColor = record.Status === 'Success' ? 'bg-green-100 text-green-700' :
                         record.Status === 'Rejected' ? 'bg-red-100 text-red-700' :
                         'bg-yellow-100 text-yellow-700';

      // Populate all detail fields
      document.getElementById('ptDetailID').textContent = record.LogID;
      document.getElementById('ptDetailCreatedDate').textContent = record.CreatedDate || '-';
      document.getElementById('ptDetailClub').innerHTML = `<span class="inline-block bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-sm font-bold">${record.Club}</span>`;
      document.getElementById('ptDetailSessionType').textContent = record.SessionType;
      document.getElementById('ptDetailMember').textContent = record.Member_Name;
      document.getElementById('ptDetailTanggal').textContent = formatDateToDDMMYYYY(record.SessionDate);
      document.getElementById('ptDetailPTName').textContent = record.PT_Name || '-';
      document.getElementById('ptDetailBookingTime').innerHTML = `<span class="inline-block border border-slate-300 rounded-lg px-3 py-1 text-sm font-semibold text-slate-700">${record.BookingTimeStart} - ${record.BookingTimeEnd}</span>`;
      document.getElementById('ptDetailExerciseLog').innerHTML = formatExerciseLog(record.ExerciseLog);
      document.getElementById('ptDetailStatus').innerHTML = `<span class="inline-block px-3 py-1 text-sm font-bold rounded-full ${statusColor}">${record.Status}</span>`;
      document.getElementById('ptDetailAdminNotes').textContent = record.AdminNotes || '-';

      setDetailArchiveButton('ptDetailArchiveBtn', !!record.IsArchived, record.Status);
      applyDetailButtonPermissions('ptDetailEditBtn', 'ptDetailArchiveBtn', 'Manual Cutting');
      document.getElementById('ptDetailModal').classList.remove('hidden');
    }

    function editPTFromDetail() {
      if (!currentPTDetailLogId) return;
      openPTEditModal(currentPTDetailLogId);
    }

    function deletePTFromDetail() {
      if (!currentPTDetailLogId) return;
      const record = ptAllRecords.find(r => r.LogID === currentPTDetailLogId);
      if (!record) return;
      closePTDetailModal();
      if (record.IsArchived) {
        restorePTRecord(record.LogID, record.Member_Name);
      } else {
        deletePTRecord(record.LogID, record.Member_Name);
      }
    }

    function closePTDetailModal() {
      document.getElementById('ptDetailModal').classList.add('hidden');
    }

    function openPTEditModal(logId) {
      const record = ptAllRecords.find(r => r.LogID === logId);
      if (!record) return;

      document.getElementById('ptEditLogId').value = logId;
      document.getElementById('ptEditMember').value = record.Member_Name;
      document.getElementById('ptEditTanggal').value = record.SessionDate;
      document.getElementById('ptEditTimeStart').value = normalizeTimeForInput(record.BookingTimeStart);
      document.getElementById('ptEditTimeEnd').value = normalizeTimeForInput(record.BookingTimeEnd);

      // Populate Exercise Log forms from existing data (not blank, not auto-padded)
      const exerciseContainer = document.getElementById('ptEditExerciseContainer');
      exerciseContainer.innerHTML = '';
      const parsedExercises = parseExerciseLogToData(record.ExerciseLog);
      if (parsedExercises.length > 0) {
        parsedExercises.forEach(ex => {
          exerciseContainer.appendChild(createPTEditExerciseForm(ex));
        });
      } else {
        exerciseContainer.appendChild(createPTEditExerciseForm(null));
      }

      // Load dropdowns (and re-apply the record's saved Club/SessionType once options are loaded)
      loadPTEditDropdowns(record.Club, record.SessionType);
      configureEditModalButtons('pt', 'PT', record.Status);

      closePTDetailModal();
      document.getElementById('ptEditModal').classList.remove('hidden');
    }

    function parseExerciseLogToData(raw) {
      if (!raw || raw.trim() === '') return [];

      const exercises = raw.split(' | ');
      return exercises.map(ex => {
        const separatorIdx = ex.indexOf(': ');
        if (separatorIdx === -1) return { name: ex, weights: [], reps: [] };

        const name = ex.substring(0, separatorIdx);
        const setsStr = ex.substring(separatorIdx + 2);

        const setRegex = /Set(\d+)\((.*?)kg,(.*?)\)/g;
        const weights = [];
        const reps = [];
        let match;
        while ((match = setRegex.exec(setsStr)) !== null) {
          weights.push(match[2] || '');
          reps.push(match[3] || '');
        }

        return { name: name, weights: weights, reps: reps };
      });
    }

    function createPTEditExerciseForm(exerciseData) {
      const name = exerciseData ? exerciseData.name : '';
      const weights = exerciseData && exerciseData.weights ? exerciseData.weights : [];
      const reps = exerciseData && exerciseData.reps ? exerciseData.reps : [];

      const form = document.createElement('div');
      form.className = 'pt-edit-exercise-form bg-slate-50 p-4 rounded-xl border border-slate-200';
      form.innerHTML = `
        <div class="flex items-center justify-between mb-3">
          <label class="block text-xs font-bold text-slate-600">Exercise Name</label>
          <button type="button" onclick="removePTEditExerciseForm(this)" class="text-xs text-red-500 hover:text-red-700 font-bold">
            <i class="fa-solid fa-trash mr-1"></i> Remove
          </button>
        </div>
        <input type="text" placeholder="Contoh: Bench Press" value="${name}" required class="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none pt-edit-exercise-name">

        <div class="grid grid-cols-5 gap-2 mb-3">
          <div class="text-center text-xs font-bold text-slate-600">Set 1</div>
          <div class="text-center text-xs font-bold text-slate-600">Set 2</div>
          <div class="text-center text-xs font-bold text-slate-600">Set 3</div>
          <div class="text-center text-xs font-bold text-slate-600">Set 4</div>
          <div class="text-center text-xs font-bold text-slate-600">Set 5</div>
        </div>

        <div class="space-y-2">
          <div>
            <label class="text-xs font-bold text-slate-600">Weight(Kg)</label>
            <div class="grid grid-cols-5 gap-2">
              <input type="number" placeholder="0" value="${weights[0] || ''}" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none pt-edit-exercise-weight">
              <input type="number" placeholder="0" value="${weights[1] || ''}" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none pt-edit-exercise-weight">
              <input type="number" placeholder="0" value="${weights[2] || ''}" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none pt-edit-exercise-weight">
              <input type="number" placeholder="0" value="${weights[3] || ''}" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none pt-edit-exercise-weight">
              <input type="number" placeholder="0" value="${weights[4] || ''}" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none pt-edit-exercise-weight">
            </div>
          </div>

          <div>
            <label class="text-xs font-bold text-slate-600">Repetition</label>
            <div class="grid grid-cols-5 gap-2">
              <input type="number" placeholder="0" value="${reps[0] || ''}" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none pt-edit-exercise-rep">
              <input type="number" placeholder="0" value="${reps[1] || ''}" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none pt-edit-exercise-rep">
              <input type="number" placeholder="0" value="${reps[2] || ''}" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none pt-edit-exercise-rep">
              <input type="number" placeholder="0" value="${reps[3] || ''}" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none pt-edit-exercise-rep">
              <input type="number" placeholder="0" value="${reps[4] || ''}" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none pt-edit-exercise-rep">
            </div>
          </div>
        </div>
      `;
      return form;
    }

    function closePTEditModal() {
      document.getElementById('ptEditModal').classList.add('hidden');
    }

    function loadPTEditDropdowns(selectedClub, selectedSessionType) {
      const clubSelect = document.getElementById('ptEditClub');
      const sessionSelect = document.getElementById('ptEditSessionType');

      getClubsListCached(function(res) {
        if (res.success && res.clubs) {
          clubSelect.innerHTML = '';
          res.clubs.forEach(club => {
            const option = document.createElement('option');
            option.value = club.ClubName;
            option.textContent = club.ClubName;
            clubSelect.appendChild(option);
          });
          if (selectedClub) clubSelect.value = selectedClub;
        }
      });

      getSessionTypesListCached(function(res) {
        if (res.success && res.sessions) {
          sessionSelect.innerHTML = '';
          res.sessions.forEach(session => {
            const option = document.createElement('option');
            option.value = session.SessionName;
            option.textContent = session.SessionName;
            sessionSelect.appendChild(option);
          });
          if (selectedSessionType) sessionSelect.value = selectedSessionType;
        }
      });
    }

    function submitPTEditForm(event) {
      event.preventDefault();

      const exerciseValidation = validateExerciseLogs('ptEditExerciseContainer');
      if (!exerciseValidation.valid) {
        showToast(exerciseValidation.message, 'error');
        return;
      }

      const logId = document.getElementById('ptEditLogId').value;

      const exercises = [];
      document.querySelectorAll('#ptEditExerciseContainer .pt-edit-exercise-form').forEach(form => {
        const exerciseName = form.querySelector('.pt-edit-exercise-name').value;
        const weights = Array.from(form.querySelectorAll('.pt-edit-exercise-weight')).map(el => el.value);
        const reps = Array.from(form.querySelectorAll('.pt-edit-exercise-rep')).map(el => el.value);

        exercises.push({
          name: exerciseName,
          sets: {
            weights: weights,
            reps: reps
          }
        });
      });

      const formData = {
        logId: logId,
        club: document.getElementById('ptEditClub').value,
        sessionType: document.getElementById('ptEditSessionType').value,
        member: document.getElementById('ptEditMember').value,
        sessionDate: document.getElementById('ptEditTanggal').value,
        timeStart: document.getElementById('ptEditTimeStart').value,
        timeEnd: document.getElementById('ptEditTimeEnd').value,
        exercises: exercises,
        currentUser: currentUser.name
      };

      const sendUpdate = function(data) {
        showToast('Menyimpan perubahan...', 'info');

        if (true) {
          runServer('updatePersonalTrainingLog', [data], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                closePTEditModal();
                loadPersonalTrainingHistory();
              } else {
                showToast(res.message, 'error');
              }
            }, null)
        } else {
          showToast('Simulasi: Perubahan disimpan!', 'success');
          closePTEditModal();
          loadPersonalTrainingHistory();
        }
      };
      submitEditWithStatusRule('PT', formData, sendUpdate);
    }

    function deletePTRecord(logId, memberName) {
      showConfirmModal(`Yakin ingin memindahkan record ${logId} untuk member ${memberName} ke arsip?`, function() {
        showToast('Memindahkan record ke arsip...', 'info');

        if (true) {
          runServer('deletePersonalTrainingLog', [logId, currentUser.name], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                loadPersonalTrainingHistory();
              } else {
                showToast(res.message, 'error');
              }
            }, null)
        } else {
          showToast('Simulasi: Record diarsipkan!', 'success');
          loadPersonalTrainingHistory();
        }
      });
    }

    function restorePTRecord(logId, memberName) {
      showConfirmModal(`Yakin ingin mengembalikan record ${logId} untuk member ${memberName} dari arsip?`, function() {
        showToast('Mengembalikan record...', 'info');

        if (true) {
          runServer('restorePersonalTrainingLog', [logId, currentUser.name], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                loadPersonalTrainingHistory();
              } else {
                showToast(res.message, 'error');
              }
            }, null)
        } else {
          showToast('Simulasi: Record dikembalikan!', 'success');
          loadPersonalTrainingHistory();
        }
      });
    }

    function addEditExerciseForm() {
      const container = document.getElementById('ptEditExerciseContainer');
      container.appendChild(createPTEditExerciseForm(null));
    }

    function removePTEditExerciseForm(button) {
      const container = document.getElementById('ptEditExerciseContainer');
      const forms = container.querySelectorAll('.pt-edit-exercise-form');

      if (forms.length > 1) {
        button.closest('.pt-edit-exercise-form').remove();
      } else {
        showToast('Minimal harus ada 1 exercise', 'error');
      }
    }

    function loadStaffActivities() {
      const container = document.getElementById('activitiesListContainer');
      if (!container || !currentStaffDetail) return;

      container.innerHTML = '<p class="text-center text-slate-400 py-8"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Memuat data...</p>';

      if (true) {
        runServer('getStaffActivities', [currentStaffDetail.name], function(res) {
            cachedActivitiesData = res.success ? res.data : [];
            renderStaffActivities(cachedActivitiesData);
          }, function(err) {
            console.error('Error loading activities:', err);
            cachedActivitiesData = [];
            renderStaffActivities([]);
          })
      } else {
        renderStaffActivities([]);
      }
    }

    function renderStaffActivities(logs) {
      const container = document.getElementById('activitiesListContainer');
      if (!container) return;

      if (!logs || logs.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-400 py-8">Belum ada aktivitas tercatat</p>';
        return;
      }

      container.innerHTML = logs.map(log => `
        <div class="flex gap-3 border-b border-slate-100 pb-3">
          <div class="text-teal-500 mt-1"><i class="fa-solid fa-circle-dot"></i></div>
          <div class="flex-1">
            <p class="font-bold text-slate-800 text-sm">${log.action}</p>
            <p class="text-slate-600 text-sm">${log.details}</p>
            <p class="text-slate-400 text-xs mt-1">${log.timestamp}</p>
          </div>
        </div>
      `).join('');
    }

    function showDetailTabsByRole() {
      // Show all tabs for every role
      document.querySelectorAll('.detail-tab').forEach(tab => {
        tab.classList.remove('hidden');
      });

      document.querySelectorAll('.detail-tab-content').forEach(content => {
        content.classList.add('hidden');
      });

      // Set default tab to Activities
      switchDetailTab('activities');
    }

