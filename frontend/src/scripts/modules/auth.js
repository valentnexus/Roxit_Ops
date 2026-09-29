    // ==================== LOGIN HANDLERS ====================
    function handleLogin(event) {
      event.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const rememberMe = document.getElementById('rememberMe').checked;
      const errorDiv = document.getElementById('loginError');
      errorDiv.classList.add('hidden');

      if (true) {
        runServer('loginUser', [email, password], function(res) {
            if (res.success) {
              currentUser = res.user;
              sessionToken = res.token;
              
              // Save to localStorage if remember me is checked
              if (rememberMe) {
                localStorage.setItem('roxitops_email', email);
                localStorage.setItem('roxitops_password', password);
                localStorage.setItem('roxitops_remember', 'true');
              } else {
                localStorage.removeItem('roxitops_email');
                localStorage.removeItem('roxitops_password');
                localStorage.removeItem('roxitops_remember');
              }
              
              document.getElementById('loginPage').classList.add('hidden');
              document.getElementById('appContainer').classList.add('active');
              updateProfileDisplay();
              loadUserPermissionsThenProceed(function() {
                switchPage('dashboard');
                loadDashboardStats();
                loadPendingApprovals();
                loadRecentProcessed();
                loadStaffList();
              });
            } else {
              errorDiv.textContent = res.message;
              errorDiv.classList.remove('hidden');
            }
          }, null)
      } else {
        // Demo mode
        if (email === 'alex.pt@gmail.com' && password === 'password123') {
          currentUser = {
            userId: 'USR-0001',
            name: 'Alex PT',
            email: 'alex.pt@gmail.com',
            role: 'Personal Trainer',
            status: 'Active'
          };
          
          // Save to localStorage if remember me is checked
          if (rememberMe) {
            localStorage.setItem('roxitops_email', email);
            localStorage.setItem('roxitops_password', password);
            localStorage.setItem('roxitops_remember', 'true');
          } else {
            localStorage.removeItem('roxitops_email');
            localStorage.removeItem('roxitops_password');
            localStorage.removeItem('roxitops_remember');
          }
          
          document.getElementById('loginPage').classList.add('hidden');
          document.getElementById('appContainer').classList.add('active');
          updateProfileDisplay();
          loadUserPermissionsThenProceed(function() {
            switchPage('dashboard');
          });
        } else {
          errorDiv.textContent = 'Email atau password salah.';
          errorDiv.classList.remove('hidden');
        }
      }
    }

    function handleLogout() {
      showConfirmModal('Yakin ingin sign out?', function() {
        if (currentUser) {
          runServer('logUserLogout', [currentUser.name, sessionToken], null, null)
        }

        currentUser = null;
        sessionToken = null;
        // Note: localStorage Remember Me data is intentionally NOT cleared here,
        // it's only managed during login based on the checkbox state.
        document.getElementById('loginPage').classList.remove('hidden');
        document.getElementById('appContainer').classList.remove('active');
        document.getElementById('loginForm').reset();
        document.getElementById('profileMenu').classList.add('hidden');
      });
    }

    function submitChangePassword(event) {
      event.preventDefault();

      const currentPassword = document.getElementById('currentPasswordInput').value;
      const newPassword = document.getElementById('newPasswordInput').value;
      const confirmPassword = document.getElementById('confirmPasswordInput').value;

      if (newPassword !== confirmPassword) {
        showToast('Password baru dan konfirmasi tidak cocok', 'error');
        return;
      }

      if (newPassword.length < 6) {
        showToast('Password baru minimal 6 karakter', 'error');
        return;
      }

      showToast('Menyimpan password baru...', 'info');

      if (true) {
        runServer('changePassword', [currentUser.userId, currentPassword, newPassword], function(res) {
            if (res.success) {
              showToast(res.message, 'success');
              document.getElementById('changePasswordForm').reset();
            } else {
              showToast(res.message, 'error');
            }
          }, function(err) {
            showToast('Gagal mengubah password: ' + err.message, 'error');
          })
      } else {
        showToast('Simulasi: Password berhasil diubah!', 'success');
        document.getElementById('changePasswordForm').reset();
      }
    }

    function setAvatarPhoto(elementId, photoUrl, fallbackIconHtml) {
      const el = document.getElementById(elementId);
      if (!el) return;
      if (photoUrl) {
        el.innerHTML = `<img src="${photoUrl}" referrerpolicy="no-referrer" class="w-full h-full object-cover">`;
      } else {
        el.innerHTML = fallbackIconHtml;
      }
    }

    function updateProfileDisplay() {
      if (currentUser) {
        document.getElementById('profileCardName').textContent = currentUser.name;
        document.getElementById('profileCardEmail').textContent = currentUser.email;
        document.getElementById('breadcrumbUserName').textContent = currentUser.name;
        document.getElementById('headerUserName').textContent = currentUser.name;

        setAvatarPhoto('headerAvatar', currentUser.photoUrl, '<i class="fa-solid fa-user text-lg"></i>');
        setAvatarPhoto('profileDropdownAvatar', currentUser.photoUrl, '<i class="fa-solid fa-user"></i>');
      }
    }

    // Load remembered credentials on page load
    window.addEventListener('load', function() {
      const rememberedEmail = localStorage.getItem('roxitops_email');
      const rememberedPassword = localStorage.getItem('roxitops_password');
      const rememberFlag = localStorage.getItem('roxitops_remember');

      if (rememberedEmail && rememberedPassword && rememberFlag === 'true') {
        document.getElementById('loginEmail').value = rememberedEmail;
        document.getElementById('loginPassword').value = rememberedPassword;
        document.getElementById('rememberMe').checked = true;
      }
    });

    // Load logo config immediately (don't wait for window.load / all page resources)
    loadAppConfig();

    function applyLogoConfig(logoUrl) {
      if (!logoUrl) return;

      const logoSpots = [
        { id: 'loginLogoIcon', sizeClass: 'h-[50px] w-auto mb-3 mx-auto block' },
        { id: 'sidebarLogoIcon', sizeClass: 'h-10 w-auto' },
        { id: 'mobileLogoIcon', sizeClass: 'h-8 w-auto' }
      ];

      logoSpots.forEach(spot => {
        const el = document.getElementById(spot.id);
        if (!el) return;
        const img = document.createElement('img');
        img.src = logoUrl;
        img.referrerPolicy = 'no-referrer';
        img.alt = 'Logo';
        img.className = spot.sizeClass + ' object-contain rounded-lg';
        el.replaceWith(img);
      });
    }

    function revealFallbackLogos() {
      ['loginLogoIcon', 'sidebarLogoIcon', 'mobileLogoIcon'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.remove('fa-spinner', 'fa-spin');
          el.classList.add('fa-dumbbell');
        }
      });
    }

    function loadAppConfig() {
      if (true) {
        runServer('getAppConfig', [], function(res) {
            if (res.success && res.config && res.config.logo) {
              applyLogoConfig(res.config.logo);
            } else {
              revealFallbackLogos();
            }
          }, function() {
            revealFallbackLogos();
          })
      } else {
        revealFallbackLogos();
      }
    }

