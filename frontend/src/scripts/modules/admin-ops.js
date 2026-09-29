    // ==================== ADMIN OPS HANDLERS ====================
    function loadDashboardStats() {
      if (true) {
        runServer('getDashboardStats', [], function(res) {
            if (res.success) {
              document.getElementById('statPending').textContent = res.stats.totalPending || '0';
              document.getElementById('statApprovedToday').textContent = res.stats.approvedToday || '0';
              document.getElementById('statRejectedToday').textContent = res.stats.rejectedToday || '0';
              document.getElementById('statActiveStaff').textContent = res.stats.totalActiveStaff || '0';
            }
          }, null)
      }
    }

    // ==================== PENDING APPROVALS + RECENT ACTIVITY HANDLERS ====================
    let approvalAllRecords = [];
    let recentAllRecords = [];
    let currentApprovalTab = 'PT';
    const approvalTabTypes = { PT: ['PT'], GROUP: ['GT', 'MG'], TIO: ['TIO'] };
    const approvalTabLabels = { PT: 'Personal Training', GROUP: 'Group', TIO: 'Time In/Out' };

    function escapeApprovalHtml(str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function resetAdminOpsPage() {
      const statusFilter = document.getElementById('approvalStatusFilter');
      const searchInput = document.getElementById('approvalSearchInput');
      if (statusFilter) statusFilter.value = 'Pending';
      if (searchInput) searchInput.value = '';
      currentApprovalTab = 'PT';
      updateApprovalTabStyles();
    }

    function updateApprovalTabStyles() {
      document.querySelectorAll('.approval-tab').forEach(t => {
        const isActive = t.getAttribute('data-approval-tab') === currentApprovalTab;
        t.classList.toggle('border-teal-500', isActive);
        t.classList.toggle('text-teal-700', isActive);
        t.classList.toggle('border-transparent', !isActive);
        t.classList.toggle('text-slate-700', !isActive);
      });
      const label = approvalTabLabels[currentApprovalTab];
      document.getElementById('approvalTableTitle').textContent = 'Pending Approvals - ' + label;
      document.getElementById('recentTableTitle').textContent = 'Recent Activity - ' + label;
    }

    function switchApprovalTab(tab) {
      currentApprovalTab = tab;
      updateApprovalTabStyles();
      renderApprovalTable();
      renderRecentTable();
    }

    function updateApprovalBadges() {
      Object.keys(approvalTabTypes).forEach(tab => {
        const count = approvalAllRecords.filter(r => approvalTabTypes[tab].includes(r.Type) && r.Status === 'Pending').length;
        const badge = document.getElementById('approvalBadge-' + tab);
        if (badge) badge.textContent = count;
      });
    }

    function matchesApprovalSearch(record, term) {
      if (!term) return true;
      const staff = (record.Staff || '').toLowerCase();
      const member = (record.Member || '').toLowerCase();
      return staff.indexOf(term) !== -1 || member.indexOf(term) !== -1;
    }

    function refreshAdminOpsData() {
      const btn = document.getElementById('approvalRefreshBtn');
      if (btn) btn.disabled = true;
      loadDashboardStats();
      loadPendingApprovals();
      loadRecentProcessed();
      if (btn) setTimeout(() => { btn.disabled = false; }, 500);
    }

    function loadPendingApprovals() {
      const tbody = document.getElementById('approvalTableBody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-4 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Memuat data...</td></tr>';

      if (true) {
        runServer('getApprovalList', [], function(res) {
            if (res.success) {
              approvalAllRecords = res.records || [];
              renderApprovalTable();
            } else if (tbody) {
              tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-4 text-center text-red-500">Gagal memuat data</td></tr>';
            }
          }, function(err) {
            console.error('Error loading approvals:', err);
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-4 text-center text-red-500">Gagal memuat data</td></tr>';
          })
      } else {
        approvalAllRecords = [];
        renderApprovalTable();
      }
    }

    function getApprovalStatusBadge(status) {
      const statusColor = status === 'Success' ? 'bg-green-100 text-green-800' :
                          status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800';
      return `<span class="inline-block px-2 py-1 rounded-full text-xs font-bold ${statusColor}">${escapeApprovalHtml(status)}</span>`;
    }

    // Baris Pending yang punya AdminNotes tersimpan berarti pengajuan ulang (bekas Rejected/Cancel)
    function getRevisionBadge(d) {
      if (d.Status !== 'Pending' || !d.AdminNotes) return '';
      return '<span class="inline-block ml-1 px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700"><i class="fa-solid fa-rotate-left mr-1"></i>Revisi</span>';
    }

    function getApprovalViewButton(d) {
      return `<button onclick="openApprovalModal('${escapeApprovalHtml(d.LogID)}', '${d.Type}')" class="text-sky-600 font-bold hover:underline">View</button>`;
    }

    function renderApprovalTable() {
      const tbody = document.getElementById('approvalTableBody');
      const thead = document.getElementById('approvalTableHead');
      if (!tbody || !thead) return;

      updateApprovalBadges();

      const statusFilter = document.getElementById('approvalStatusFilter').value;
      const searchTerm = (document.getElementById('approvalSearchInput').value || '').trim().toLowerCase();
      const types = approvalTabTypes[currentApprovalTab];
      const th = (label) => `<th class="px-4 py-2 text-left font-bold text-slate-700">${label}</th>`;

      let headers;
      if (currentApprovalTab === 'PT') {
        headers = ['Tanggal', 'Staff', 'Member', 'Session Type', 'Jadwal', 'Status', 'Action'];
      } else if (currentApprovalTab === 'GROUP') {
        headers = ['Tanggal', 'Type', 'Instructor', 'Member', 'Jadwal', 'Status', 'Action'];
      } else {
        headers = ['Tanggal', 'Staff', 'Member', 'Type', 'Status', 'Action'];
      }
      thead.innerHTML = '<tr>' + headers.map(th).join('') + '</tr>';

      const data = approvalAllRecords.filter(r =>
        types.includes(r.Type) &&
        (statusFilter === 'all' || r.Status === statusFilter) &&
        matchesApprovalSearch(r, searchTerm)
      );

      if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${headers.length}" class="px-4 py-4 text-center text-slate-400">Tidak ada data approval</td></tr>`;
        return;
      }

      tbody.innerHTML = data.map(d => {
        const jadwal = `${escapeApprovalHtml(d.SessionDate)}<br><span class="text-xs text-slate-500">${escapeApprovalHtml(d.SessionTime)}</span>`;
        const statusCell = getApprovalStatusBadge(d.Status) + getRevisionBadge(d);

        if (currentApprovalTab === 'PT') {
          return `
          <tr class="border-b hover:bg-slate-50">
            <td class="px-4 py-2">${escapeApprovalHtml(d.CreatedDate)}</td>
            <td class="px-4 py-2 font-bold">${escapeApprovalHtml(d.Staff)}</td>
            <td class="px-4 py-2">${escapeApprovalHtml(d.Member)}</td>
            <td class="px-4 py-2">${escapeApprovalHtml(d.SessionType)}</td>
            <td class="px-4 py-2">${jadwal}</td>
            <td class="px-4 py-2">${statusCell}</td>
            <td class="px-4 py-2 whitespace-nowrap">${getApprovalViewButton(d)}</td>
          </tr>`;
        }

        if (currentApprovalTab === 'GROUP') {
          const typeBadge = d.Type === 'GT'
            ? '<span class="inline-block px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">Group Training</span>'
            : '<span class="inline-block px-2 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">Manual Group</span>';
          const sessionTypeLine = d.SessionType ? `<br><span class="text-xs text-slate-500">${escapeApprovalHtml(d.SessionType)}</span>` : '';
          return `
          <tr class="border-b hover:bg-slate-50">
            <td class="px-4 py-2">${escapeApprovalHtml(d.CreatedDate)}</td>
            <td class="px-4 py-2">${typeBadge}</td>
            <td class="px-4 py-2 font-bold">${escapeApprovalHtml(d.Staff)}</td>
            <td class="px-4 py-2">${escapeApprovalHtml(d.Member)}</td>
            <td class="px-4 py-2">${jadwal}${sessionTypeLine}</td>
            <td class="px-4 py-2">${statusCell}</td>
            <td class="px-4 py-2 whitespace-nowrap">${getApprovalViewButton(d)}</td>
          </tr>`;
        }

        const tioColor = d.ActionType === 'Time In' ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-700';
        return `
        <tr class="border-b hover:bg-slate-50">
          <td class="px-4 py-2">${escapeApprovalHtml(d.CreatedDate)}</td>
          <td class="px-4 py-2 font-bold">${escapeApprovalHtml(d.Staff)}</td>
          <td class="px-4 py-2">${escapeApprovalHtml(d.Member)}</td>
          <td class="px-4 py-2"><span class="inline-block px-2 py-1 rounded-full text-xs font-bold ${tioColor}">${escapeApprovalHtml(d.ActionType)}</span></td>
          <td class="px-4 py-2">${statusCell}</td>
          <td class="px-4 py-2 whitespace-nowrap">${getApprovalViewButton(d)}</td>
        </tr>`;
      }).join('');
    }

    let currentApprovalRecord = null;

    // Popup View: detail record + Approve / Reject (khusus record Pending)
    function openApprovalModal(logId, type) {
      const record = approvalAllRecords.find(r => r.LogID === logId && r.Type === type) ||
                     recentAllRecords.find(r => r.LogID === logId && r.Type === type);
      if (!record) return;
      currentApprovalRecord = record;

      const statusColor = record.Status === 'Success' ? 'bg-green-100 text-green-700' :
                          record.Status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700';

      document.getElementById('approvalDetailID').textContent = record.LogID;
      document.getElementById('approvalDetailType').textContent = record.TypeLabel;
      document.getElementById('approvalDetailStaff').textContent = record.Staff || '-';
      document.getElementById('approvalDetailMember').textContent = record.Member || '-';
      document.getElementById('approvalDetailInfo').textContent = record.Detail || '-';
      document.getElementById('approvalDetailCreated').textContent = record.CreatedDate || '-';
      document.getElementById('approvalDetailStatus').innerHTML = `<span class="inline-block px-3 py-1 text-sm font-bold rounded-full ${statusColor}">${escapeApprovalHtml(record.Status)}</span>`;

      const isPending = record.Status === 'Pending';
      const hasPreviousNotes = !!record.AdminNotes;

      // Catatan sebelumnya (dari Reject/Cancel sebelumnya) tetap terlihat walau record sudah Pending lagi
      document.getElementById('approvalNotesInput').value = '';
      document.getElementById('approvalNotesInputWrap').classList.toggle('hidden', !isPending);
      document.getElementById('approvalExistingNotesWrap').classList.toggle('hidden', !hasPreviousNotes);
      document.getElementById('approvalExistingNotesLabel').textContent = isPending ? 'Catatan Sebelumnya' : 'Admin Notes';
      document.getElementById('approvalDetailAdminNotes').textContent = record.AdminNotes || '-';
      document.getElementById('approvalActionButtons').classList.toggle('hidden', !isPending || !hasPermission('Operations', 'Edit'));

      document.getElementById('approvalApproveBtn').disabled = false;
      document.getElementById('approvalRejectBtn').disabled = false;
      document.getElementById('approvalModalTitle').textContent = 'Approval Detail';

      document.getElementById('approvalModal').classList.remove('hidden');
    }

    function closeApprovalModal() {
      document.getElementById('approvalModal').classList.add('hidden');
      currentApprovalRecord = null;
    }

    function submitApproval(newStatus) {
      if (!currentApprovalRecord) return;
      const record = currentApprovalRecord;
      const notes = document.getElementById('approvalNotesInput').value.trim();
      const approveBtn = document.getElementById('approvalApproveBtn');
      const rejectBtn = document.getElementById('approvalRejectBtn');

      approveBtn.disabled = true;
      rejectBtn.disabled = true;
      showToast(newStatus === 'Success' ? 'Memproses approve...' : 'Memproses reject...', 'info');

      if (true) {
        runServer('processApproval', [{
            logId: record.LogID,
            type: record.Type,
            status: newStatus,
            notes: notes,
            currentUser: currentUser ? currentUser.name : 'Admin'
          }], function(res) {
            if (res.success) {
              showToast(res.message, 'success');
              closeApprovalModal();
            } else {
              showToast(res.message, 'error');
              approveBtn.disabled = false;
              rejectBtn.disabled = false;
            }
            loadPendingApprovals();
            loadRecentProcessed();
            loadDashboardStats();
          }, function(err) {
            showToast('Gagal memproses: ' + err, 'error');
            approveBtn.disabled = false;
            rejectBtn.disabled = false;
          })
      } else {
        showToast('Simulasi: Record diproses!', 'success');
        closeApprovalModal();
      }
    }

    // ==================== RECENT ACTIVITY (20 record terakhir per tab, sudah diproses) ====================
    function loadRecentProcessed() {
      const tbody = document.getElementById('recentTableBody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Memuat data...</td></tr>';

      if (true) {
        runServer('getRecentProcessed', [100], function(res) {
            if (res.success) {
              recentAllRecords = res.records || [];
              renderRecentTable();
            } else if (tbody) {
              tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-red-500">Gagal memuat data</td></tr>';
            }
          }, function(err) {
            console.error('Error loading recent activity:', err);
            if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-red-500">Gagal memuat data</td></tr>';
          })
      } else {
        recentAllRecords = [];
        renderRecentTable();
      }
    }

    function renderRecentTable() {
      const tbody = document.getElementById('recentTableBody');
      if (!tbody) return;

      const searchTerm = (document.getElementById('approvalSearchInput').value || '').trim().toLowerCase();
      const types = approvalTabTypes[currentApprovalTab];

      const records = recentAllRecords
        .filter(r => types.includes(r.Type) && matchesApprovalSearch(r, searchTerm))
        .slice(0, 20);

      if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-slate-400">Belum ada record yang diproses</td></tr>';
        return;
      }

      tbody.innerHTML = records.map(d => `
        <tr class="border-b hover:bg-slate-50">
          <td class="px-4 py-2">${escapeApprovalHtml(d.ProcessedAt)}</td>
          <td class="px-4 py-2 font-bold">${escapeApprovalHtml(d.Staff)}</td>
          <td class="px-4 py-2">${escapeApprovalHtml(d.Member)}</td>
          <td class="px-4 py-2">${getApprovalStatusBadge(d.Status)}</td>
          <td class="px-4 py-2">${escapeApprovalHtml(d.AdminNotes) || '-'}</td>
        </tr>
      `).join('');
    }

