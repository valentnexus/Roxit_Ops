    // ==================== PT PORTAL HANDLERS ====================
    function loadTimeTrackingFormData() {
      const ptNameField = document.getElementById('tioPTName');
      if (ptNameField && currentUser) {
        ptNameField.value = currentUser.name;
      }
    }

    function handleTimeClock(type) {
      if (!currentUser) return;

      const member = document.getElementById('tioMember').value.trim();
      if (!member) {
        showToast('Nama Member wajib diisi dulu', 'error');
        return;
      }

      showConfirmModal(`Yakin ingin mencatat ${type} untuk member ${member}?`, function() {
        showToast('Memproses ' + type + '...', 'info');

        const data = {
          ptName: currentUser.name,
          member: member,
          type: type
        };

        if (true) {
          runServer('submitTimeInOut', [data], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                document.getElementById('tioMember').value = '';
                loadTimeInOutHistory();
              } else {
                showToast(res.message, 'error');
              }
            }, null)
        } else {
          showToast('Simulasi: ' + type + ' tercatat', 'success');
          document.getElementById('tioMember').value = '';
          loadTimeInOutHistory();
        }
      });
    }

    function submitCuttingForm(event) {
      event.preventDefault();
      if (!currentUser) return;

      const data = {
        date: document.getElementById('cutDate').value,
        ptName: currentUser.name,
        memberName: document.getElementById('cutMember').value,
        reason: document.getElementById('cutReason').value,
        notes: document.getElementById('cutNotes').value
      };

      showToast('Mengirim form cutting...', 'info');

      if (true) {
        runServer('submitManualCutting', [data], function(res) {
            if (res.success) {
              showToast(res.message, 'success');
              document.getElementById('formManualCutting').reset();
              loadPTHistory();
            } else {
              showToast(res.message, 'error');
            }
          }, null)
      } else {
        showToast('Simulasi: Form cutting dikirim!', 'success');
        document.getElementById('formManualCutting').reset();
        loadPTHistory();
      }
    }

    function loadPTHistory() {
      if (!currentUser) return;
      const container = document.getElementById('ptHistoryContainer');
      if (!container) return;
      container.innerHTML = '<p class="text-center text-slate-400 py-4">Tidak ada riwayat form</p>';
    }

    function loadTimeInOutHistory() {
      if (!currentUser) return;
      const container = document.getElementById('timeHistoryContainer');
      container.innerHTML = '<p class="text-center text-slate-400 py-4"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Memuat riwayat...</p>';

      if (true) {
        runServer('getTimeInOutLogList', [], function(res) {
            if (res.success && res.records) {
              const myRecords = res.records.filter(r => r.PT_Name === currentUser.name);
              myRecords.sort((a, b) => parseCreatedDateForSort(b.CreatedDate) - parseCreatedDateForSort(a.CreatedDate));
              renderTimeInOutHistoryList(myRecords);
            } else {
              renderTimeInOutHistoryList([]);
            }
          }, function() {
            renderTimeInOutHistoryList([]);
          })
      } else {
        renderTimeInOutHistoryList([]);
      }
    }

    function renderTimeInOutHistoryList(records) {
      const container = document.getElementById('timeHistoryContainer');

      if (!records || records.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-400 py-4">Tidak ada riwayat waktu</p>';
        return;
      }

      container.innerHTML = records.map(record => {
        const typeColor = record.Type === 'Time In' ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-700';
        const statusColor = record.Status === 'Success' ? 'bg-green-100 text-green-700' :
                           record.Status === 'Rejected' ? 'bg-red-100 text-red-700' :
                           'bg-yellow-100 text-yellow-700';
        return `
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <p class="font-bold text-slate-800 text-sm">${record.Member_Name}</p>
              <p class="text-xs text-slate-400">${record.CreatedDate}</p>
            </div>
            <div class="flex gap-2">
              <span class="px-2 py-1 text-xs font-bold rounded-full ${typeColor}">${record.Type}</span>
              <span class="px-2 py-1 text-xs font-bold rounded-full ${statusColor}">${record.Status}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // ==================== MANUAL CUTTING HANDLERS ====================
    // Tab aktif di halaman Manual Cutting (dipakai untuk reset form tab yang ditinggalkan)
    let currentManualCuttingTab = 'personal';

    function resetManualCuttingTabForm(tab) {
      if (tab === 'personal') {
        document.getElementById('formPersonalTraining').reset();
        document.getElementById('ptName').value = currentUser ? currentUser.name : '';
        resetExerciseFormsContainer();
      } else if (tab === 'group') {
        document.getElementById('formGroupTraining').reset();
      } else if (tab === 'manualgroup') {
        document.getElementById('formManualGroup').reset();
        resetMGMemberFields();
      }
    }

    function switchManualCuttingTab(tab) {
      // Reset form di tab yang ditinggalkan saat pindah ke tab lain
      if (currentManualCuttingTab && currentManualCuttingTab !== tab) {
        resetManualCuttingTabForm(currentManualCuttingTab);
      }
      currentManualCuttingTab = tab;

      // Hide all manual cutting tab contents
      document.querySelectorAll('.manual-cutting-tab-content').forEach(content => {
        content.classList.add('hidden');
      });

      // Remove active state from all tabs
      document.querySelectorAll('.manual-cutting-tab').forEach(t => {
        t.classList.remove('border-teal-500', 'text-teal-700');
        t.classList.add('border-transparent', 'text-slate-700');
      });

      // Show selected tab
      const tabIdMap = { personal: 'personalTrainingTab', group: 'groupTrainingTab', manualgroup: 'manualgroupTab' };
      const tabElement = document.getElementById(tabIdMap[tab]);
      if (tabElement) {
        tabElement.classList.remove('hidden');
      }

      if (tab === 'group' || tab === 'manualgroup') {
        loadGroupTrainingFormData();
      }

      // Set active state on button
      const tabButton = document.querySelector(`[data-tab="${tab}"]`);
      if (tabButton) {
        tabButton.classList.add('border-teal-500', 'text-teal-700');
        tabButton.classList.remove('border-transparent', 'text-slate-700');
      }
    }

    function loadGroupTrainingFormData() {
      const gtInstrukturField = document.getElementById('gtInstruktur');
      const mgInstrukturField = document.getElementById('mgInstruktur');
      if (gtInstrukturField && currentUser) gtInstrukturField.value = currentUser.name;
      if (mgInstrukturField && currentUser) mgInstrukturField.value = currentUser.name;

      ensureMinimumExercises('mgMemberFieldsContainer', 'mg-member-field', createMGMemberField, 1);

      const gtClub = document.getElementById('gtClub');
      const gtSessionType = document.getElementById('gtSessionType');
      const mgClub = document.getElementById('mgClub');

      if (gtClub) gtClub.innerHTML = '<option value="">-- Pilih Club --</option>';
      if (gtSessionType) gtSessionType.innerHTML = '<option value="">-- Pilih Session Type --</option>';
      if (mgClub) mgClub.innerHTML = '<option value="">-- Pilih Club --</option>';

      if (true) {
        runServer('getClubsList', [], function(res) {
            if (res.success && res.clubs && res.clubs.length > 0) {
              [gtClub, mgClub].forEach(select => {
                if (!select) return;
                select.innerHTML = '<option value="">-- Pilih Club --</option>';
                res.clubs.forEach(club => {
                  const option = document.createElement('option');
                  option.value = club.ClubName;
                  option.textContent = club.ClubName;
                  select.appendChild(option);
                });
              });
            }
          }, function(err) {
            console.error('Error loading clubs:', err);
          })

        runServer('getSessionTypesList', [], function(res) {
            if (res.success && res.sessions && res.sessions.length > 0 && gtSessionType) {
              gtSessionType.innerHTML = '<option value="">-- Pilih Session Type --</option>';
              res.sessions.forEach(session => {
                const option = document.createElement('option');
                option.value = session.SessionName;
                option.textContent = session.SessionName;
                gtSessionType.appendChild(option);
              });
            }
          }, function(err) {
            console.error('Error loading session types:', err);
          })
      }
    }

    function submitGroupTrainingForm(event) {
      event.preventDefault();

      showConfirmModal('Yakin ingin mengirim form Group Training ini?', function() {
        showToast('Menyimpan Group Training form...', 'info');

        const formData = {
          club: document.getElementById('gtClub').value,
          instruktur: document.getElementById('gtInstruktur').value,
          member: document.getElementById('gtMember').value,
          sessionType: document.getElementById('gtSessionType').value,
          sessionDate: document.getElementById('gtSessionDate').value,
          timeStart: document.getElementById('gtTimeStart').value,
          timeEnd: document.getElementById('gtTimeEnd').value
        };

        if (true) {
          runServer('submitGroupTraining', [formData], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                document.getElementById('formGroupTraining').reset();
                document.getElementById('gtInstruktur').value = currentUser.name;
              } else {
                showToast(res.message, 'error');
              }
            }, function(err) {
              showToast('Gagal menyimpan: ' + err.message, 'error');
            })
        } else {
          showToast('Simulasi: Group Training form disimpan!', 'success');
          document.getElementById('formGroupTraining').reset();
          document.getElementById('gtInstruktur').value = currentUser.name;
        }
      });
    }

    function createMGMemberField(value) {
      const div = document.createElement('div');
      div.className = 'mg-member-field flex gap-2';
      div.innerHTML = `
        <input type="text" placeholder="Nama Member" value="${value || ''}" required class="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none mg-member-input">
        <button type="button" onclick="removeMGMemberField(this)" class="text-red-500 hover:text-red-700 px-2" title="Remove">
          <i class="fa-solid fa-trash"></i>
        </button>
      `;
      return div;
    }

    function addMGMemberField() {
      const container = document.getElementById('mgMemberFieldsContainer');
      container.appendChild(createMGMemberField(''));
    }

    function removeMGMemberField(button) {
      const container = document.getElementById('mgMemberFieldsContainer');
      const fields = container.querySelectorAll('.mg-member-field');
      if (fields.length > 1) {
        button.closest('.mg-member-field').remove();
      } else {
        showToast('Minimal harus ada 1 member', 'error');
      }
    }

    function validateMGMembers(containerId) {
      const container = document.getElementById(containerId);
      const inputs = container.querySelectorAll('.mg-member-input, .mg-edit-member-input');

      if (inputs.length < 1) {
        return { valid: false, message: 'Minimal harus ada 1 member' };
      }

      for (let i = 0; i < inputs.length; i++) {
        if (!inputs[i].value.trim()) {
          return { valid: false, message: `Member ke-${i + 1} wajib diisi` };
        }
      }

      return { valid: true };
    }

    function resetMGMemberFields() {
      const container = document.getElementById('mgMemberFieldsContainer');
      container.innerHTML = '';
      container.appendChild(createMGMemberField(''));
    }

    function submitManualGroupForm(event) {
      event.preventDefault();

      const memberValidation = validateMGMembers('mgMemberFieldsContainer');
      if (!memberValidation.valid) {
        showToast(memberValidation.message, 'error');
        return;
      }

      showConfirmModal('Yakin ingin mengirim Add Manual Group ini?', function() {
        showToast('Menyimpan Add Manual Group...', 'info');

        const members = Array.from(document.querySelectorAll('#mgMemberFieldsContainer .mg-member-input')).map(el => el.value.trim());

        const formData = {
          club: document.getElementById('mgClub').value,
          instruktur: document.getElementById('mgInstruktur').value,
          members: members,
          scheduleDate: document.getElementById('mgScheduleDate').value,
          scheduleTime: document.getElementById('mgScheduleTime').value
        };

        if (true) {
          runServer('submitManualGroup', [formData], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                document.getElementById('formManualGroup').reset();
                document.getElementById('mgInstruktur').value = currentUser.name;
                resetMGMemberFields();
              } else {
                showToast(res.message, 'error');
              }
            }, function(err) {
              showToast('Gagal menyimpan: ' + err.message, 'error');
            })
        } else {
          showToast('Simulasi: Add Manual Group disimpan!', 'success');
          document.getElementById('formManualGroup').reset();
          document.getElementById('mgInstruktur').value = currentUser.name;
          resetMGMemberFields();
        }
      });
    }

    function createExerciseFormElement() {
      const form = document.createElement('div');
      form.className = 'exercise-form bg-slate-50 p-4 rounded-xl border border-slate-200';
      form.innerHTML = `
        <div class="flex items-center justify-between mb-3">
          <label class="block text-xs font-bold text-slate-600">Exercise Name</label>
          <button type="button" onclick="removeExerciseForm(this)" class="text-xs text-red-500 hover:text-red-700 font-bold">
            <i class="fa-solid fa-trash mr-1"></i> Remove
          </button>
        </div>
        <input type="text" placeholder="Contoh: Bench Press" required class="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none exercise-name">

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
              <input type="number" placeholder="0" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none exercise-weight">
              <input type="number" placeholder="0" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none exercise-weight">
              <input type="number" placeholder="0" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none exercise-weight">
              <input type="number" placeholder="0" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none exercise-weight">
              <input type="number" placeholder="0" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none exercise-weight">
            </div>
          </div>

          <div>
            <label class="text-xs font-bold text-slate-600">Repetition</label>
            <div class="grid grid-cols-5 gap-2">
              <input type="number" placeholder="0" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none exercise-rep">
              <input type="number" placeholder="0" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none exercise-rep">
              <input type="number" placeholder="0" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none exercise-rep">
              <input type="number" placeholder="0" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none exercise-rep">
              <input type="number" placeholder="0" class="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 outline-none exercise-rep">
            </div>
          </div>
        </div>
      `;
      return form;
    }

    function addExerciseForm() {
      const container = document.getElementById('exerciseFormsContainer');
      container.appendChild(createExerciseFormElement());
    }

    function resetExerciseFormsContainer() {
      const container = document.getElementById('exerciseFormsContainer');
      container.innerHTML = '';
      container.appendChild(createExerciseFormElement());
    }

    function ensureMinimumExercises(containerId, formClass, createFn, minimum) {
      const container = document.getElementById(containerId);
      if (!container) return;
      const currentCount = container.querySelectorAll('.' + formClass).length;
      for (let i = currentCount; i < minimum; i++) {
        container.appendChild(createFn(null));
      }
    }

    function validateExerciseLogs(containerId) {
      const container = document.getElementById(containerId);
      const forms = container.querySelectorAll('.exercise-form, .pt-edit-exercise-form');

      if (forms.length < 4) {
        return { valid: false, message: 'Minimal harus ada 4 Exercise Log' };
      }

      for (let i = 0; i < forms.length; i++) {
        const form = forms[i];
        const nameInput = form.querySelector('.exercise-name, .pt-edit-exercise-name');
        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) {
          return { valid: false, message: `Nama Exercise di blok ke-${i + 1} wajib diisi` };
        }

        const weights = Array.from(form.querySelectorAll('.exercise-weight, .pt-edit-exercise-weight')).map(el => el.value.trim());
        const reps = Array.from(form.querySelectorAll('.exercise-rep, .pt-edit-exercise-rep')).map(el => el.value.trim());

        let hasValidSet = false;
        for (let j = 0; j < weights.length; j++) {
          if (weights[j] !== '' && reps[j] !== '') {
            hasValidSet = true;
            break;
          }
        }

        if (!hasValidSet) {
          return { valid: false, message: `Minimal 1 set (weight & reps) di exercise "${name}" wajib diisi` };
        }
      }

      return { valid: true };
    }

    function removeExerciseForm(button) {
      const container = document.getElementById('exerciseFormsContainer');
      const forms = container.querySelectorAll('.exercise-form');
      
      if (forms.length > 1) {
        button.closest('.exercise-form').remove();
      } else {
        showToast('Minimal harus ada 1 exercise', 'error');
      }
    }

    function submitPersonalTrainingForm(event) {
      event.preventDefault();

      const exerciseValidation = validateExerciseLogs('exerciseFormsContainer');
      if (!exerciseValidation.valid) {
        showToast(exerciseValidation.message, 'error');
        return;
      }

      showConfirmModal('Yakin ingin mengirim form Personal Training ini?', function() {
        showToast('Menyimpan Personal Training form...', 'info');

        const ptNameField = document.getElementById('ptName').value.trim();

        const formData = {
          club: document.getElementById('ptClub').value,
          ptName: ptNameField || currentUser.name,
          member: document.getElementById('ptMember').value,
          sessionType: document.getElementById('ptSessionType').value,
          sessionDate: document.getElementById('ptSessionDate').value,
          timeStart: document.getElementById('ptTimeStart').value,
          timeEnd: document.getElementById('ptTimeEnd').value,
          exercises: []
        };

        // Collect exercises
        document.querySelectorAll('.exercise-form').forEach(form => {
          const exerciseName = form.querySelector('.exercise-name').value;
          const weights = Array.from(form.querySelectorAll('.exercise-weight')).map(el => el.value);
          const reps = Array.from(form.querySelectorAll('.exercise-rep')).map(el => el.value);

          formData.exercises.push({
            name: exerciseName,
            sets: {
              weights: weights,
              reps: reps
            }
          });
        });

        if (true) {
          runServer('submitPersonalTraining', [formData], function(res) {
              if (res.success) {
                showToast(res.message, 'success');
                document.getElementById('formPersonalTraining').reset();
                document.getElementById('ptName').value = currentUser.name;
                resetExerciseFormsContainer();
              } else {
                showToast(res.message, 'error');
              }
            }, null)
        } else {
          showToast('Simulasi: Personal Training form disimpan!', 'success');
          document.getElementById('formPersonalTraining').reset();
          document.getElementById('ptName').value = currentUser.name;
          resetExerciseFormsContainer();
        }
      });
    }

    function loadSessionTypes() {
      const selectSession = document.getElementById('ptSessionType');
      const selectClub = document.getElementById('ptClub');
      const ptNameField = document.getElementById('ptName');

      // Pre-fill PT name with current user
      if (ptNameField && currentUser) {
        ptNameField.value = currentUser.name;
      }

      // Ensure Exercise Log starts with minimum 4 blocks
      ensureMinimumExercises('exerciseFormsContainer', 'exercise-form', createExerciseFormElement, 1);

      // Set placeholder only; real options are loaded from Master Data below
      if (selectSession) {
        selectSession.innerHTML = '<option value="">-- Pilih Session Type --</option>';
      }

      if (selectClub) {
        selectClub.innerHTML = '<option value="">-- Pilih Club --</option>';
      }

      // Load options from Master Data (Club & SessionType sheets)
      if (true) {
        runServer('getSessionTypesList', [], function(res) {
            if (res.success && res.sessions && res.sessions.length > 0) {
              if (selectSession) {
                selectSession.innerHTML = '<option value="">-- Pilih Session Type --</option>';
                res.sessions.forEach(session => {
                  const option = document.createElement('option');
                  option.value = session.SessionName;
                  option.textContent = session.SessionName;
                  selectSession.appendChild(option);
                });
              }
            }
          }, function(err) {
            console.error('Error loading session types:', err);
          })

        runServer('getClubsList', [], function(res) {
            if (res.success && res.clubs && res.clubs.length > 0) {
              if (selectClub) {
                selectClub.innerHTML = '<option value="">-- Pilih Club --</option>';
                res.clubs.forEach(club => {
                  const option = document.createElement('option');
                  option.value = club.ClubName;
                  option.textContent = club.ClubName;
                  selectClub.appendChild(option);
                });
              }
            }
          }, function(err) {
            console.error('Error loading clubs:', err);
          })
      }
    }

