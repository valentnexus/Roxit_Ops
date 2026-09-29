    // ==================== PERMISSION PAGE ====================
    const permissionActions = ['View', 'Add', 'Edit', 'Delete', 'Export'];

    // Peta module -> aksi yang applicable, ditentukan langsung di frontend (bukan nebak dari data server),
    // biar N/A pasti kerender jadi "-" gak peduli isi datanya dari server gimana. Harus sinkron sama
    // pemetaan yang ada di setup.gs (buildPermissionDummyData).
    const PERMISSION_MODULE_ACTIONS = {
      'Dashboard': ['View'],
      'Manual Cutting': ['View', 'Add', 'Edit', 'Delete'],
      'Time Tracking': ['View', 'Add', 'Edit', 'Delete'],
      'Operations': ['View', 'Edit'],
      'Report': ['View', 'Export'],
      'Manage Staff': ['View', 'Add', 'Edit', 'Delete'],
      'Master Data': ['View', 'Add', 'Edit', 'Delete']
    };
    let permissionCurrentRole = '';
    let permissionCurrentRows = [];

    function escapePermissionHtml(str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function loadPermissionRoleOptions() {
      const select = document.getElementById('permissionRoleSelect');
      select.innerHTML = '<option value="">Memuat role...</option>';

      if (true) {
        runServer('getRolesList', [], function(res) {
            if (!res.success) {
              select.innerHTML = '<option value="">Gagal memuat role</option>';
              return;
            }
            select.innerHTML = res.roles.map(function(r) {
              return `<option value="${escapePermissionHtml(r.RoleName)}">${escapePermissionHtml(r.RoleName)}</option>`;
            }).join('');
            if (res.roles.length > 0) {
              select.value = permissionCurrentRole && res.roles.some(r => r.RoleName === permissionCurrentRole)
                ? permissionCurrentRole
                : res.roles[0].RoleName;
              loadPermissionMatrix();
            }
          }, function(err) {
            console.error('Error loading roles for permission:', err);
            select.innerHTML = '<option value="">Gagal memuat role</option>';
          })
      }
    }

    function loadPermissionMatrix() {
      const role = document.getElementById('permissionRoleSelect').value;
      permissionCurrentRole = role;
      const tbody = document.getElementById('permissionTableBody');
      if (!role) return;

      tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Memuat data...</td></tr>';

      if (true) {
        runServer('getPermissionMatrix', [role], function(res) {
            if (res.success) {
              permissionCurrentRows = res.rows || [];
              renderPermissionTable();
            } else {
              tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-red-500">Gagal memuat data</td></tr>';
            }
          }, function(err) {
            console.error('Error loading permission matrix:', err);
            tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-red-500">Gagal memuat data</td></tr>';
          })
      }
    }

    function renderPermissionTable() {
      const tbody = document.getElementById('permissionTableBody');
      const isSuperAdmin = permissionCurrentRole === 'Super Admin';

      document.getElementById('permissionSuperAdminNote').classList.toggle('hidden', !isSuperAdmin);
      document.getElementById('permissionSaveBtn').classList.toggle('hidden', isSuperAdmin);

      tbody.innerHTML = permissionCurrentRows.map(function(row, rowIdx) {
        const applicableActions = PERMISSION_MODULE_ACTIONS[row.Module] || permissionActions;
        const cells = permissionActions.map(function(action) {
          if (applicableActions.indexOf(action) === -1) {
            return '<td class="px-4 py-2 text-center text-slate-300">-</td>';
          }
          const val = row[action];
          const checked = isSuperAdmin ? true : !!val;
          const disabled = isSuperAdmin ? 'disabled' : '';
          return `<td class="px-4 py-2 text-center">
            <input type="checkbox" class="permission-checkbox w-4 h-4 accent-teal-500" data-row="${rowIdx}" data-action="${action}" ${checked ? 'checked' : ''} ${disabled}>
          </td>`;
        }).join('');
        return `<tr class="border-b hover:bg-slate-50">
          <td class="px-4 py-2 font-bold text-slate-800">${escapePermissionHtml(row.Module)}</td>
          ${cells}
        </tr>`;
      }).join('');
    }

    function savePermissionMatrix() {
      if (!permissionCurrentRole || permissionCurrentRole === 'Super Admin') return;

      const btn = document.getElementById('permissionSaveBtn');
      const checkboxes = document.querySelectorAll('.permission-checkbox');
      const rowsMap = {};

      checkboxes.forEach(function(cb) {
        const rowIdx = cb.getAttribute('data-row');
        const action = cb.getAttribute('data-action');
        const moduleName = permissionCurrentRows[rowIdx].Module;
        if (!rowsMap[moduleName]) rowsMap[moduleName] = { Module: moduleName };
        rowsMap[moduleName][action] = cb.checked;
      });

      const rows = Object.values(rowsMap);

      btn.disabled = true;
      showToast('Menyimpan permission...', 'info');

      if (true) {
        runServer('savePermissionMatrix', [{
            roleName: permissionCurrentRole,
            rows: rows,
            currentUser: currentUser ? currentUser.name : 'Admin'
          }], function(res) {
            btn.disabled = false;
            if (res.success) {
              showToast(res.message, 'success');
              loadPermissionMatrix();
            } else {
              showToast(res.message, 'error');
            }
          }, function(err) {
            btn.disabled = false;
            showToast('Gagal menyimpan permission: ' + err, 'error');
          })
      } else {
        btn.disabled = false;
        showToast('Simulasi: Permission disimpan!', 'success');
      }
    }

    // ==================== MASTER DATA TAB FUNCTIONS ====================
    function switchMasterDataTab(tab) {
      // Hide all tabs
      document.getElementById('roleTab').classList.add('hidden');
      document.getElementById('permissionTab').classList.add('hidden');
      document.getElementById('clubTab').classList.add('hidden');
      document.getElementById('sessiontypeTab').classList.add('hidden');
      document.getElementById('masterAuditLogTab').classList.add('hidden');

      // Remove active class from all tabs
      document.querySelectorAll('.master-data-tab').forEach(t => {
        t.classList.remove('border-teal-500', 'text-teal-700');
        t.classList.add('border-transparent', 'text-slate-700');
      });

      // Show selected tab
      document.getElementById(tab + 'Tab').classList.remove('hidden');
      document.querySelector(`[data-tab="${tab}"]`).classList.add('border-teal-500', 'text-teal-700');
      document.querySelector(`[data-tab="${tab}"]`).classList.remove('border-transparent', 'text-slate-700');

      // Load data based on tab
      if (tab === 'role') loadRolesList();
      if (tab === 'club') loadClubsList();
      if (tab === 'sessiontype') loadSessionTypesList();
      if (tab === 'masterAuditLog') loadMasterAuditLog();
      if (tab === 'permission') loadPermissionRoleOptions();
    }

    function loadMasterAuditLog() {
      const tbody = document.getElementById('masterAuditLogTableBody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Memuat audit log...</td></tr>';

      if (true) {
        runServer('getAuditTrailData', [], function(res) {
            if (res.success && res.data) {
              renderMasterAuditLogTable(res.data);
            }
          }, null)
      }
    }

    function renderMasterAuditLogTable(logs) {
      const tbody = document.getElementById('masterAuditLogTableBody');
      tbody.innerHTML = '';

      if (!logs || logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center text-slate-400">Tidak ada data audit log</td></tr>';
        return;
      }

      logs.forEach(log => {
        const row = document.createElement('tr');
        row.className = 'border-b border-slate-100 hover:bg-slate-50 transition';
        row.innerHTML = `
          <td class="px-4 py-2 text-xs text-slate-600">${log.timestamp}</td>
          <td class="px-4 py-2 font-semibold text-slate-800">${log.user}</td>
          <td class="px-4 py-2 text-slate-700">${log.action}</td>
          <td class="px-4 py-2 text-slate-600">${log.details}</td>
        `;
        tbody.appendChild(row);
      });
    }

    // ==================== ROLE MANAGEMENT ====================
    function loadRolesList() {
      const tbody = document.getElementById('roleTableBody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Memuat roles...</td></tr>';

      if (true) {
        runServer('getRolesList', [], function(res) {
            if (res.success && res.roles) {
              renderRoleTable(res.roles);
            }
          }, null)
      } else {
        // Demo data
        renderRoleTable([
          { RoleID: 'ROLE-0001', RoleName: 'Super Admin', Description: 'Full system access' },
          { RoleID: 'ROLE-0002', RoleName: 'Admin', Description: 'Administrative access' },
          { RoleID: 'ROLE-0003', RoleName: 'Personal Trainer', Description: 'Personal trainer access' }
        ]);
      }
    }

    function renderRoleTable(roles) {
      const tbody = document.getElementById('roleTableBody');
      tbody.innerHTML = '';

      if (!roles || roles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center text-slate-400">Tidak ada data role</td></tr>';
        return;
      }

      roles.forEach(role => {
        const row = document.createElement('tr');
        row.className = 'border-b border-slate-100 hover:bg-slate-50 transition';
        row.innerHTML = `
          <td class="px-4 py-3 text-sm text-slate-700">${role.RoleID}</td>
          <td class="px-4 py-3 text-sm font-bold text-slate-800">${role.RoleName}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${role.Description || '-'}</td>
          <td class="px-4 py-3 text-center">
            <div class="flex justify-center gap-3">
              ${permActionButton('Master Data', 'Edit', `editRole('${role.RoleID}', '${role.RoleName}', '${role.Description || ''}')`, 'text-blue-500 hover:text-blue-700', 'fa-pen-to-square', 'Edit')}
              ${permActionButton('Master Data', 'Delete', `deleteRoleFunc('${role.RoleID}', '${role.RoleName}')`, 'text-red-500 hover:text-red-700', 'fa-trash', 'Delete')}
            </div>
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    function openRoleModal() {
      document.getElementById('roleIdInput').value = '';
      document.getElementById('roleNameInput').value = '';
      document.getElementById('roleDescriptionInput').value = '';
      document.getElementById('roleModalTitle').textContent = 'Add Role';
      document.getElementById('roleModal').classList.remove('hidden');
    }

    function closeRoleModal() {
      document.getElementById('roleModal').classList.add('hidden');
    }

    function editRole(id, name, description) {
      document.getElementById('roleIdInput').value = id;
      document.getElementById('roleNameInput').value = name;
      document.getElementById('roleDescriptionInput').value = description;
      document.getElementById('roleModalTitle').textContent = 'Edit Role: ' + id;
      document.getElementById('roleModal').classList.remove('hidden');
    }

    function deleteRoleFunc(roleId, roleName) {
      showConfirmModal(`Yakin ingin menghapus role ${roleName}?`, function() {
        showToast('Menghapus role...', 'info');

        if (true) {
          runServer('deleteRole', [roleId, currentUser.name], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                loadRolesList();
              } else {
                showToast(res.message, 'error');
              }
            }, null)
        }
      });
    }

    function submitRoleForm(event) {
      event.preventDefault();
      const data = {
        roleId: document.getElementById('roleIdInput').value,
        roleName: document.getElementById('roleNameInput').value,
        description: document.getElementById('roleDescriptionInput').value,
        currentUser: currentUser.name
      };

      showToast('Menyimpan role...', 'info');

      if (true) {
        runServer('saveRole', [data], function(res) {
            if (res.success) {
              showToast(res.message, 'success');
              closeRoleModal();
              loadRolesList();
            } else {
              showToast(res.message, 'error');
            }
          }, null)
      } else {
        showToast('Simulasi: Role disimpan!', 'success');
        closeRoleModal();
        loadRolesList();
      }
    }

    // ==================== CLUB MANAGEMENT ====================
    function loadClubsList() {
      const tbody = document.getElementById('clubTableBody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Memuat clubs...</td></tr>';

      if (true) {
        runServer('getClubsList', [], function(res) {
            if (res.success && res.clubs) {
              renderClubTable(res.clubs);
            }
          }, null)
      } else {
        // Demo data
        renderClubTable([
          { ClubID: 'CLUB-0001', ClubName: 'Main Gym', Location: 'Jl. Utama No. 1' },
          { ClubID: 'CLUB-0002', ClubName: 'Branch Gym', Location: 'Jl. Cabang No. 2' }
        ]);
      }
    }

    function renderClubTable(clubs) {
      const tbody = document.getElementById('clubTableBody');
      tbody.innerHTML = '';

      if (!clubs || clubs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center text-slate-400">Tidak ada data club</td></tr>';
        return;
      }

      clubs.forEach(club => {
        const row = document.createElement('tr');
        row.className = 'border-b border-slate-100 hover:bg-slate-50 transition';
        row.innerHTML = `
          <td class="px-4 py-3 text-sm text-slate-700">${club.ClubID}</td>
          <td class="px-4 py-3 text-sm font-bold text-slate-800">${club.ClubName}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${club.Location}</td>
          <td class="px-4 py-3 text-center">
            <div class="flex justify-center gap-3">
              ${permActionButton('Master Data', 'Edit', `editClub('${club.ClubID}', '${club.ClubName}', '${club.Location}')`, 'text-blue-500 hover:text-blue-700', 'fa-pen-to-square', 'Edit')}
              ${permActionButton('Master Data', 'Delete', `deleteClubFunc('${club.ClubID}', '${club.ClubName}')`, 'text-red-500 hover:text-red-700', 'fa-trash', 'Delete')}
            </div>
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    function openClubModal() {
      document.getElementById('clubIdInput').value = '';
      document.getElementById('clubNameInput').value = '';
      document.getElementById('clubLocationInput').value = '';
      document.getElementById('clubModalTitle').textContent = 'Add Club';
      document.getElementById('clubModal').classList.remove('hidden');
    }

    function closeClubModal() {
      document.getElementById('clubModal').classList.add('hidden');
    }

    function editClub(id, name, location) {
      document.getElementById('clubIdInput').value = id;
      document.getElementById('clubNameInput').value = name;
      document.getElementById('clubLocationInput').value = location;
      document.getElementById('clubModalTitle').textContent = 'Edit Club: ' + id;
      document.getElementById('clubModal').classList.remove('hidden');
    }

    function deleteClubFunc(clubId, clubName) {
      showConfirmModal(`Yakin ingin menghapus club ${clubName}?`, function() {
        showToast('Menghapus club...', 'info');

        if (true) {
          runServer('deleteClub', [clubId, currentUser.name], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                loadClubsList();
              } else {
                showToast(res.message, 'error');
              }
            }, null)
        }
      });
    }

    function submitClubForm(event) {
      event.preventDefault();
      const data = {
        clubId: document.getElementById('clubIdInput').value,
        clubName: document.getElementById('clubNameInput').value,
        location: document.getElementById('clubLocationInput').value,
        currentUser: currentUser.name
      };

      showToast('Menyimpan club...', 'info');

      if (true) {
        runServer('saveClub', [data], function(res) {
            if (res.success) {
              showToast(res.message, 'success');
              closeClubModal();
              loadClubsList();
            } else {
              showToast(res.message, 'error');
            }
          }, null)
      } else {
        showToast('Simulasi: Club disimpan!', 'success');
        closeClubModal();
        loadClubsList();
      }
    }

    // ==================== SESSION TYPE FUNCTIONS ====================
    function loadSessionTypesList() {
      const tbody = document.getElementById('sessiontypeTableBody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Memuat session types...</td></tr>';

      if (true) {
        runServer('getSessionTypesList', [], function(res) {
            if (res.success && res.sessions) {
              renderSessionTypeTable(res.sessions);
            }
          }, null)
      } else {
        // Demo data
        renderSessionTypeTable([
          { SessionTypeID: 'SES-0001', SessionName: 'Strength Training', Description: 'Latihan kekuatan dengan beban' },
          { SessionTypeID: 'SES-0002', SessionName: 'Cardio', Description: 'Latihan kardiovaskular' },
          { SessionTypeID: 'SES-0003', SessionName: 'Flexibility', Description: 'Latihan fleksibilitas dan stretching' }
        ]);
      }
    }

    function renderSessionTypeTable(sessions) {
      const tbody = document.getElementById('sessiontypeTableBody');
      tbody.innerHTML = '';

      if (!sessions || sessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center text-slate-400">Tidak ada data session type</td></tr>';
        return;
      }

      sessions.forEach(session => {
        const row = document.createElement('tr');
        row.className = 'border-b border-slate-100 hover:bg-slate-50 transition';
        row.innerHTML = `
          <td class="px-4 py-3 text-sm text-slate-700">${session.SessionTypeID}</td>
          <td class="px-4 py-3 text-sm font-bold text-slate-800">${session.SessionName}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${session.Description}</td>
          <td class="px-4 py-3 text-center">
            <div class="flex justify-center gap-3">
              ${permActionButton('Master Data', 'Edit', `editSessionType('${session.SessionTypeID}', '${session.SessionName}', '${session.Description}')`, 'text-blue-500 hover:text-blue-700', 'fa-pen-to-square', 'Edit')}
              ${permActionButton('Master Data', 'Delete', `deleteSessionTypeFunc('${session.SessionTypeID}', '${session.SessionName}')`, 'text-red-500 hover:text-red-700', 'fa-trash', 'Delete')}
            </div>
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    function openSessionTypeModal() {
      document.getElementById('sessiontypeIdInput').value = '';
      document.getElementById('sessiontypeNameInput').value = '';
      document.getElementById('sessiontypeDescInput').value = '';
      document.getElementById('sessiontypeModalTitle').textContent = 'Add Session Type';
      document.getElementById('sessiontypeModal').classList.remove('hidden');
    }

    function closeSessionTypeModal() {
      document.getElementById('sessiontypeModal').classList.add('hidden');
    }

    function editSessionType(id, name, description) {
      document.getElementById('sessiontypeIdInput').value = id;
      document.getElementById('sessiontypeNameInput').value = name;
      document.getElementById('sessiontypeDescInput').value = description;
      document.getElementById('sessiontypeModalTitle').textContent = 'Edit Session Type: ' + id;
      document.getElementById('sessiontypeModal').classList.remove('hidden');
    }

    function deleteSessionTypeFunc(sessionTypeId, sessionName) {
      showConfirmModal(`Yakin ingin menghapus session type ${sessionName}?`, function() {
        showToast('Menghapus session type...', 'info');

        if (true) {
          runServer('deleteSessionType', [sessionTypeId, currentUser.name], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                loadSessionTypesList();
              } else {
                showToast(res.message, 'error');
              }
            }, null)
        } else {
          showToast('Simulasi: Session type dihapus!', 'success');
          loadSessionTypesList();
        }
      });
    }

    function submitSessionTypeForm(event) {
      event.preventDefault();
      const data = {
        sessionTypeId: document.getElementById('sessiontypeIdInput').value,
        sessionName: document.getElementById('sessiontypeNameInput').value,
        description: document.getElementById('sessiontypeDescInput').value,
        currentUser: currentUser.name
      };

      showToast('Menyimpan session type...', 'info');

      if (true) {
        runServer('saveSessionType', [data], function(res) {
            if (res.success) {
              showToast(res.message, 'success');
              closeSessionTypeModal();
              loadSessionTypesList();
            } else {
              showToast(res.message, 'error');
            }
          }, null)
      } else {
        showToast('Simulasi: Session type disimpan!', 'success');
        closeSessionTypeModal();
        loadSessionTypesList();
      }
    }


