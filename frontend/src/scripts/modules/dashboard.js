    // ==================== DASHBOARD WIDGETS ====================
    let dashTrendChartInstance = null;

    function escapeDashHtml(str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function loadDashboardWidgets() {
      const btn = document.getElementById('dashboardRefreshBtn');
      if (btn) btn.disabled = true;

      if (true) {
        runServer('getDashboardWidgets', [], function(res) {
            if (btn) btn.disabled = false;
            if (!res.success) {
              showToast('Gagal memuat dashboard: ' + res.message, 'error');
              return;
            }
            renderDashboardQuickStats(res.quickStats);
            renderDashboardTrendChart(res.trend);
            renderDashboardLeaderboard(res.leaderboard);
            renderDashboardAttention(res.attentionList);
          }, function(err) {
            if (btn) btn.disabled = false;
            console.error('Error loading dashboard widgets:', err);
            showToast('Gagal memuat dashboard.', 'error');
          })
      } else if (btn) {
        btn.disabled = false;
      }
    }

    function renderDashboardQuickStats(stats) {
      document.getElementById('dashSesiHariIni').textContent = stats.sesiHariIni;
      document.getElementById('dashSesiBulanIni').textContent = stats.sesiBulanIni;
      document.getElementById('dashSesiMingguIni').textContent = stats.sesiMingguIni;

      const rateEl = document.getElementById('dashApprovalRate');
      const rateSub = document.getElementById('dashApprovalRateSub');
      if (stats.approvalRate30d === null) {
        rateEl.textContent = '-';
        rateSub.textContent = 'Belum ada data 30 hari terakhir';
      } else {
        rateEl.textContent = stats.approvalRate30d + '%';
        rateSub.textContent = stats.totalProcessed30d + ' record diproses (30 hari)';
      }
    }

    function renderDashboardTrendChart(trend) {
      const canvas = document.getElementById('dashTrendChart');
      if (!canvas || typeof Chart === 'undefined') return;

      if (dashTrendChartInstance) {
        dashTrendChartInstance.destroy();
      }

      dashTrendChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: trend.labels,
          datasets: [
            { label: 'Personal Training', data: trend.pt, backgroundColor: '#0ea5e9' },
            { label: 'Group Training', data: trend.gt, backgroundColor: '#a855f7' },
            { label: 'Manual Group', data: trend.mg, backgroundColor: '#6366f1' }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } }
          }
        }
      });
    }

    function renderDashboardLeaderboard(leaderboard) {
      const staffWrap = document.getElementById('dashTopStaffList');
      const rejectWrap = document.getElementById('dashTopRejectList');

      if (!leaderboard.topStaff || leaderboard.topStaff.length === 0) {
        staffWrap.innerHTML = '<p class="text-sm text-slate-400">Belum ada form yang diajukan hari ini</p>';
      } else {
        const medalColors = ['bg-yellow-100 text-yellow-700', 'bg-slate-200 text-slate-700', 'bg-orange-100 text-orange-700'];
        staffWrap.innerHTML = leaderboard.topStaff.map((s, i) => `
          <div class="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
            <div class="flex items-center gap-3">
              <span class="w-7 h-7 flex items-center justify-center rounded-full text-xs font-extrabold ${medalColors[i] || 'bg-slate-100 text-slate-600'}">${i + 1}</span>
              <span class="font-bold text-slate-800">${escapeDashHtml(s.name)}</span>
            </div>
            <span class="text-sm font-bold text-teal-600">${s.count} form</span>
          </div>
        `).join('');
      }

      if (!leaderboard.topReject || leaderboard.topReject.length === 0) {
        rejectWrap.innerHTML = '<p class="text-sm text-slate-400">Tidak ada staff dengan reject rate signifikan bulan ini</p>';
      } else {
        rejectWrap.innerHTML = leaderboard.topReject.map(s => `
          <div class="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
            <div>
              <span class="font-bold text-slate-800">${escapeDashHtml(s.name)}</span>
              <span class="text-xs text-slate-500 block">${s.rejected} dari ${s.total} record</span>
            </div>
            <span class="text-sm font-bold text-red-600">${s.rate}%</span>
          </div>
        `).join('');
      }
    }

    function renderDashboardAttention(list) {
      const wrap = document.getElementById('dashAttentionList');
      if (!list || list.length === 0) {
        wrap.innerHTML = '<p class="text-sm text-slate-400">Tidak ada Pending Approvals yang menunggu lama</p>';
        return;
      }

      const typeColors = { PT: 'bg-sky-100 text-sky-700', GT: 'bg-purple-100 text-purple-700', MG: 'bg-indigo-100 text-indigo-700', TIO: 'bg-orange-100 text-orange-700' };

      wrap.innerHTML = list.map(d => `
        <div class="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
          <div class="min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${typeColors[d.Type] || 'bg-slate-200 text-slate-700'}">${escapeDashHtml(d.TypeLabel)}</span>
              <span class="text-xs text-slate-500">${d.waitDays} hari menunggu</span>
            </div>
            <p class="text-sm font-bold text-slate-800 truncate">${escapeDashHtml(d.Staff)} &rarr; ${escapeDashHtml(d.Member)}</p>
          </div>
        </div>
      `).join('');
    }

