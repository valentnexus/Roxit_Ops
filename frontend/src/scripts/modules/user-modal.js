    // ==================== USER MODAL HANDLERS ====================
    let userPhotoDataUrl = null;

    function resetUserPhotoState() {
      userPhotoDataUrl = null;
      document.getElementById('userPhotoUrlInput').value = '';
      setUserPhotoPreview('');
    }

    function setUserPhotoPreview(photoUrl) {
      const preview = document.getElementById('userPhotoPreview');
      if (photoUrl) {
        preview.innerHTML = `<img src="${photoUrl}" referrerpolicy="no-referrer" class="w-full h-full object-cover">`;
      } else {
        preview.innerHTML = '<i class="fa-solid fa-user"></i>';
      }
    }

    function resizeImageToBase64(file, maxSize, callback) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = Math.round(height * (maxSize / width));
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round(width * (maxSize / height));
              height = maxSize;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          callback(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function handleUserPhotoSelect(event) {
      const file = event.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        showToast('File harus berupa gambar', 'error');
        return;
      }

      resizeImageToBase64(file, 160, function(dataUrl) {
        userPhotoDataUrl = dataUrl;
        setUserPhotoPreview(dataUrl);
      });
    }

    function openUserModal() {
      document.getElementById('userIdInput').value = '';
      document.getElementById('userNameInput').value = '';
      document.getElementById('userEmailInput').value = '';
      document.getElementById('userPhoneInput').value = '';
      document.getElementById('userModalTitle').textContent = 'Add Staff';

      resetUserPhotoState();

      document.getElementById('userModal').classList.remove('hidden');
      loadUserFormDropdowns('', '');
    }

    function editUser(id, name, email, role, club, phone, photoUrl) {
      document.getElementById('userIdInput').value = id;
      document.getElementById('userNameInput').value = name;
      document.getElementById('userEmailInput').value = email;
      document.getElementById('userPhoneInput').value = phone || '';
      document.getElementById('userModalTitle').textContent = 'Edit Staff: ' + id;

      resetUserPhotoState();
      setUserPhotoPreview(photoUrl || '');
      document.getElementById('userPhotoUrlInput').value = photoUrl || '';

      document.getElementById('userModal').classList.remove('hidden');
      loadUserFormDropdowns(role, club);
    }

    function closeUserModal() {
      document.getElementById('userModal').classList.add('hidden');
    }

    // ==================== MASTER DATA HANDLERS ====================
    function submitUserForm(event) {
      event.preventDefault();
      const phone = document.getElementById('userPhoneInput').value;
      
      // Validate phone (numbers only if provided)
      if (phone && !/^\d+$/.test(phone)) {
        showToast('Nomor telepon hanya boleh berisi angka', 'error');
        return;
      }

      showToast('Menyimpan data staff...', 'info');

      const existingPhotoUrl = document.getElementById('userPhotoUrlInput').value;
      const photoUrl = userPhotoDataUrl || existingPhotoUrl;

      const data = {
        userId: document.getElementById('userIdInput').value,
        name: document.getElementById('userNameInput').value,
        email: document.getElementById('userEmailInput').value,
        phone: phone,
        role: document.getElementById('userRoleInput').value,
        club: document.getElementById('userClubInput').value,
        photoUrl: photoUrl,
        currentUser: currentUser.name
      };

      if (true) {
        runServer('saveUser', [data], function(res) {
            if (res.success) {
              showToast(res.message, 'success');

              // If editing own profile, refresh in-session currentUser so header/dropdown/detail update immediately
              if (data.userId && currentUser && data.userId === currentUser.userId) {
                currentUser.name = data.name;
                currentUser.email = data.email;
                currentUser.phone = data.phone;
                currentUser.role = data.role;
                currentUser.club = data.club;
                currentUser.photoUrl = data.photoUrl;
                updateProfileDisplay();
              }

              closeUserModal();
              loadStaffList();
            } else {
              showToast(res.message, 'error');
            }
          }, null)
      } else {
        showToast('Simulasi: Data staff disimpan!', 'success');
        closeUserModal();
        loadStaffList();
      }
    }

