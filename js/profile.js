// Fetch and display user profile info
fetch('../php/profile.php')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      document.getElementById('userName').textContent = data.name;
      document.getElementById('userEmail').textContent = data.email;
      if (data.profile_pic) {
        document.getElementById('profilePic').src = data.profile_pic;
      }
    } else {
      window.location.href = 'login.html';
    }
  })
  .catch(error => {
    console.error('Error fetching profile:', error);
  });

// Profile picture preview and upload
document.getElementById('profilePicInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      document.getElementById('profilePic').src = evt.target.result;
    };
    reader.readAsDataURL(file);

    // Upload to server
    const formData = new FormData();
    formData.append('profile_pic', file);
    fetch('../php/upload_profile_pic.php', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        alert(data.message || 'Upload failed');
      }
    });
  }
});

// Change password
document.getElementById('changePasswordForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const current = document.getElementById('currentPassword').value;
  const newPass = document.getElementById('newPassword').value;
  const confirm = document.getElementById('confirmPassword').value;
  const msg = document.getElementById('passwordMsg');
  msg.textContent = '';
  msg.className = '';

  if (newPass !== confirm) {
    msg.textContent = "Passwords do not match.";
    msg.className = "text-danger";
    return;
  }
  fetch('../php/change_password.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({current, new: newPass})
  })
  .then(res => res.json())
  .then(data => {
    msg.textContent = data.message;
    msg.className = data.success ? "text-success" : "text-danger";
    if (data.success) {
      document.getElementById('changePasswordForm').reset();
    }
  });
});