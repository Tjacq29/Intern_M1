fetch('../php/profile.php')
  .then(response => response.json())
  .then(data => {
    console.log(data);  // 👈 Debugging
    if (data.success) {
      document.getElementById('userName').textContent = data.name;
      document.getElementById('userEmail').textContent = data.email;
    } else {
      window.location.href = 'login.html';
    }
  })
  .catch(error => {
    console.error('Error fetching profile:', error);
  });
