    // ==================== REPORT PAGE ====================
    const reportConfigs = {
      PT: {
        label: 'Personal Training', loadFn: 'getPersonalTrainingLogList', dateField: 'SessionDate', staffField: 'PT_Name',
        headers: ['Tanggal', 'Club', 'PT Name', 'Member', 'Session Type', 'Jam Mulai', 'Jam Selesai', 'Exercise Log', 'Status', 'Admin Notes', 'Archived'],
        rowFields: function(r) { return [r.SessionDate, r.Club, r.PT_Name, r.Member_Name, r.SessionType, r.BookingTimeStart, r.BookingTimeEnd, r.ExerciseLog, r.Status, r.AdminNotes, r.IsArchived ? 'Ya' : 'Tidak']; }
      },
      GT: {
        label: 'Group Training', loadFn: 'getGroupTrainingLogList', dateField: 'SessionDate', staffField: 'Instructor_Name',
        headers: ['Tanggal', 'Club', 'Instructor', 'Member', 'Session Type', 'Jam Mulai', 'Jam Selesai', 'Status', 'Admin Notes', 'Archived'],
        rowFields: function(r) { return [r.SessionDate, r.Club, r.Instructor_Name, r.Member_Name, r.SessionType, r.BookingTimeStart, r.BookingTimeEnd, r.Status, r.AdminNotes, r.IsArchived ? 'Ya' : 'Tidak']; }
      },
      MG: {
        label: 'Manual Group', loadFn: 'getManualGroupLogList', dateField: 'ScheduleDate', staffField: 'Instructor_Name',
        headers: ['Tanggal', 'Club', 'Instructor', 'Member', 'Jam', 'Status', 'Admin Notes', 'Archived'],
        rowFields: function(r) { return [r.ScheduleDate, r.Club, r.Instructor_Name, r.Member_Name, r.ScheduleTime, r.Status, r.AdminNotes, r.IsArchived ? 'Ya' : 'Tidak']; }
      },
      TIO: {
        label: 'Time In/Out', loadFn: 'getTimeInOutLogList', dateField: null, staffField: 'PT_Name', // pakai CreatedDate (lihat filterReportRecords)
        headers: ['Tanggal & Waktu', 'Staff', 'Member', 'Type', 'Status', 'Admin Notes', 'Archived'],
        rowFields: function(r) { return [r.CreatedDate, r.PT_Name, r.Member_Name, r.Type, r.Status, r.AdminNotes, r.IsArchived ? 'Ya' : 'Tidak']; }
      }
    };

    const REPORT_ALL_STATUSES = ['Pending', 'Success', 'Rejected'];
    let currentReportTab = 'PT';
    const reportDataCache = { PT: null, GT: null, MG: null, TIO: null };
    // Filter disimpan per tab supaya tiap tab punya filter tanggal, status, dan search-nya sendiri-sendiri
    const reportFilterState = {
      PT: { preset: 'all', from: '', to: '', search: '', statuses: REPORT_ALL_STATUSES.slice() },
      GT: { preset: 'all', from: '', to: '', search: '', statuses: REPORT_ALL_STATUSES.slice() },
      MG: { preset: 'all', from: '', to: '', search: '', statuses: REPORT_ALL_STATUSES.slice() },
      TIO: { preset: 'all', from: '', to: '', search: '', statuses: REPORT_ALL_STATUSES.slice() }
    };

    function escapeReportHtml(str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function resetReportPage() {
      currentReportTab = 'PT';
      ['PT', 'GT', 'MG', 'TIO'].forEach(function(t) {
        reportFilterState[t] = { preset: 'all', from: '', to: '', search: '', statuses: REPORT_ALL_STATUSES.slice() };
      });
      document.getElementById('reportStatusDropdown').classList.add('hidden');
      updateReportTabStyles();
      syncReportFilterControls();
    }

    function updateReportTabStyles() {
      document.querySelectorAll('.report-tab').forEach(function(t) {
        const isActive = t.getAttribute('data-report-tab') === currentReportTab;
        t.classList.toggle('border-teal-500', isActive);
        t.classList.toggle('text-teal-700', isActive);
        t.classList.toggle('border-transparent', !isActive);
        t.classList.toggle('text-slate-700', !isActive);
      });
    }

    function updateReportStatusFilterLabel() {
      const state = reportFilterState[currentReportTab];
      const label = document.getElementById('reportStatusFilterLabel');
      if (state.statuses.length === REPORT_ALL_STATUSES.length) {
        label.textContent = 'All Status';
      } else if (state.statuses.length === 0) {
        label.textContent = 'Tidak ada status dipilih';
      } else {
        label.textContent = state.statuses.join(', ');
      }
    }

    function syncReportFilterControls() {
      const state = reportFilterState[currentReportTab];
      document.getElementById('reportDateFilter').value = state.preset;
      document.getElementById('reportDateFrom').value = state.from;
      document.getElementById('reportDateTo').value = state.to;
      document.getElementById('reportCustomDateRange').classList.toggle('hidden', state.preset !== 'custom');
      document.getElementById('reportSearchStaff').value = state.search;
      document.querySelectorAll('.report-status-checkbox').forEach(function(cb) {
        cb.checked = state.statuses.indexOf(cb.value) !== -1;
      });
      updateReportStatusFilterLabel();
    }

    function switchReportTab(type) {
      currentReportTab = type;
      document.getElementById('reportStatusDropdown').classList.add('hidden');
      updateReportTabStyles();
      syncReportFilterControls();
      loadReportData(type);
    }

    function handleReportDateFilterChange() {
      const preset = document.getElementById('reportDateFilter').value;
      reportFilterState[currentReportTab].preset = preset;
      document.getElementById('reportCustomDateRange').classList.toggle('hidden', preset !== 'custom');
      renderReportTable();
    }

    function toggleReportStatusDropdown() {
      document.getElementById('reportStatusDropdown').classList.toggle('hidden');
    }

    function handleReportStatusFilterChange() {
      const checked = Array.from(document.querySelectorAll('.report-status-checkbox'))
        .filter(function(cb) { return cb.checked; })
        .map(function(cb) { return cb.value; });
      reportFilterState[currentReportTab].statuses = checked;
      updateReportStatusFilterLabel();
      renderReportTable();
    }

    // Tutup dropdown Filter Status kalau klik di luar area dropdown-nya
    document.addEventListener('click', function(e) {
      const wrap = document.getElementById('reportStatusFilterBtn');
      const dropdown = document.getElementById('reportStatusDropdown');
      if (!wrap || !dropdown || dropdown.classList.contains('hidden')) return;
      if (!wrap.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });

    function loadReportData(type) {
      const tbody = document.getElementById('reportTableBody');
      const colCount = reportConfigs[type].headers.length;

      if (reportDataCache[type]) {
        renderReportTable();
        return;
      }

      if (tbody) tbody.innerHTML = `<tr><td colspan="${colCount}" class="px-4 py-4 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Memuat data...</td></tr>`;

      if (true) {
        runServer(reportConfigs[type].loadFn, [], function(res) {
          if (res.success) {
            reportDataCache[type] = res.records || [];
            if (type === currentReportTab) renderReportTable();
          } else if (tbody) {
            tbody.innerHTML = `<tr><td colspan="${colCount}" class="px-4 py-4 text-center text-red-500">Gagal memuat data</td></tr>`;
          }
        }, function(err) {
          console.error('Error loading report data:', err);
          if (tbody) tbody.innerHTML = `<tr><td colspan="${colCount}" class="px-4 py-4 text-center text-red-500">Gagal memuat data</td></tr>`;
        });
      } else {
        reportDataCache[type] = [];
        renderReportTable();
      }
    }

    // TIO tidak punya SessionDate, jadi tanggalnya diambil dari CreatedDate ('dd/MM/yyyy HH:mm:ss')
    function filterReportRecords(type, records) {
      const state = reportFilterState[type];
      const cfg = reportConfigs[type];

      let filtered = cfg.dateField
        ? filterRecordsByDateRange(records, cfg.dateField, state.preset, state.from, state.to)
        : (function() {
            const range = getDateRangeForPreset(state.preset, state.from, state.to);
            if (!range) return records;
            return records.filter(function(r) {
              const ms = parseCreatedDateForSort(r.CreatedDate);
              if (!ms) return true;
              return ms >= range.start.getTime() && ms <= range.end.getTime();
            });
          })();

      filtered = filtered.filter(function(r) { return state.statuses.indexOf(r.Status) !== -1; });

      const searchTerm = (state.search || '').trim().toLowerCase();
      if (searchTerm) {
        filtered = filtered.filter(function(r) {
          return String(r[cfg.staffField] || '').toLowerCase().indexOf(searchTerm) !== -1;
        });
      }

      return filtered;
    }

    function renderReportTable() {
      const type = currentReportTab;
      const cfg = reportConfigs[type];
      const thead = document.getElementById('reportTableHead');
      const tbody = document.getElementById('reportTableBody');
      const countEl = document.getElementById('reportRecordCount');
      if (!thead || !tbody) return;

      // Sinkronkan filter dari kontrol ke state (dipanggil juga saat custom date input / search berubah)
      reportFilterState[type].from = document.getElementById('reportDateFrom').value;
      reportFilterState[type].to = document.getElementById('reportDateTo').value;
      reportFilterState[type].search = document.getElementById('reportSearchStaff').value;

      thead.innerHTML = '<tr>' + cfg.headers.map(function(h) {
        return `<th class="px-4 py-2 text-left font-bold text-slate-700">${h}</th>`;
      }).join('') + '</tr>';

      const allRecords = reportDataCache[type] || [];
      const filtered = filterReportRecords(type, allRecords);

      if (countEl) countEl.textContent = `Showing ${filtered.length} records`;

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${cfg.headers.length}" class="px-4 py-4 text-center text-slate-400">Tidak ada data untuk filter ini</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(function(r) {
        const cells = cfg.rowFields(r);
        const tds = cells.map(function(v, i) {
          const isArchivedCol = i === cells.length - 1;
          if (isArchivedCol && v === 'Ya') {
            return '<td class="px-4 py-2"><span class="inline-block px-2 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-600">Archived</span></td>';
          }
          if (isArchivedCol) {
            return '<td class="px-4 py-2"></td>';
          }
          return `<td class="px-4 py-2">${escapeReportHtml(v)}</td>`;
        }).join('');
        const rowClass = r.IsArchived ? 'border-b hover:bg-slate-50 opacity-60' : 'border-b hover:bg-slate-50';
        return `<tr class="${rowClass}">${tds}</tr>`;
      }).join('');
    }

    function csvEscapeField(val) {
      const str = String(val == null ? '' : val);
      if (/[",\n\r]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }

    function exportReportCsv() {
      const type = currentReportTab;
      const cfg = reportConfigs[type];
      const btn = document.getElementById('reportExportBtn');
      const originalLabel = btn.innerHTML;

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Menyiapkan file export...';

      // Diberi jeda sedikit supaya spinner sempat ke-render sebelum proses build CSV (data sudah ada di browser)
      setTimeout(function() {
        try {
          const allRecords = reportDataCache[type] || [];
          const filtered = filterReportRecords(type, allRecords);

          const lines = [cfg.headers.map(csvEscapeField).join(',')];
          filtered.forEach(function(r) {
            lines.push(cfg.rowFields(r).map(csvEscapeField).join(','));
          });
          const csvContent = '\uFEFF' + lines.join('\r\n');

          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const today = new Date();
          const dateStr = today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
          const a = document.createElement('a');
          a.href = url;
          a.download = `Report_${cfg.label.replace(/\s+/g, '')}_${dateStr}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          showToast('File export berhasil didownload!', 'success');
        } catch (err) {
          console.error('Error exporting CSV:', err);
          showToast('Gagal membuat file export.', 'error');
        } finally {
          btn.disabled = false;
          btn.innerHTML = originalLabel;
        }
      }, 300);
    }

