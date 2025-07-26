$(document).ready(function () {
  // Store clock-in time
  let clockInTime = null;
  let currentUser = null;

  // Simple user database in localStorage
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify({}));
  }

  // Remember Me Feature
  function saveCredentials(username, password) {
    localStorage.setItem('rememberedUsername', username);
    localStorage.setItem('rememberedPassword', password);
  }

  function clearCredentials() {
    localStorage.removeItem('rememberedUsername');
    localStorage.removeItem('rememberedPassword');
  }

  function loadCredentials() {
    const username = localStorage.getItem('rememberedUsername');
    const password = localStorage.getItem('rememberedPassword');
    
    if (username) $('#loginUsername').val(username);
    if (password) {
      $('#loginPassword').val(password);
      $('#rememberMe').prop('checked', true);
    }
  }

  // Load credentials when page loads
  loadCredentials();

  // Login functionality
  $('#loginBtn').on('click', function() {
    const username = $('#loginUsername').val().trim();
    const password = $('#loginPassword').val().trim();
    const rememberMe = $('#rememberMe').is(':checked');
    
    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }
    
    // Check against stored users
    const users = JSON.parse(localStorage.getItem('users'));
    if (users[username] && users[username] === password) {
      if (rememberMe) {
        saveCredentials(username, password);
      } else {
        clearCredentials();
      }
      
      currentUser = username;
      $('#employeeName').val(username);
      $('#loginForm').hide();
      $('#appContent').show();
    } else {
      alert('Invalid username or password');
    }
  });

  // Register functionality
  $('#registerBtn').on('click', function() {
    const username = $('#registerUsername').val().trim();
    const password = $('#registerPassword').val().trim();
    const confirm = $('#registerConfirm').val().trim();
    
    if (!username || !password || !confirm) {
      alert('All fields are required');
      return;
    }
    
    if (password !== confirm) {
      alert('Passwords do not match');
      return;
    }
    
    if (password.length < 4) {
      alert('Password must be at least 4 characters');
      return;
    }
    
    const users = JSON.parse(localStorage.getItem('users'));
    if (users[username]) {
      alert('Username already exists');
      return;
    }
    
    users[username] = password;
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('Account created successfully! Please login.');
    $('#registerForm').hide();
    $('#loginForm').show();
  });

  // Toggle between login/register
  $('#showRegisterBtn').on('click', function() {
    $('#loginForm').hide();
    $('#registerForm').show();
  });

  $('#showLoginBtn').on('click', function() {
    $('#registerForm').hide();
    $('#loginForm').show();
  });

  // Rest of your existing code (calculateTotals, saveOrder, SubForm, etc.)
  // ... keep all your existing functions exactly as they were
  // ... from window.calculateTotals to the end of the file

  // Clock In
  window.clockIn = function () {
    console.log('clockIn() triggered');
    const employeeName = $('#employeeName').val().trim();
    if (!employeeName) {
      alert('Employee Name is required!');
      console.warn('Clock-in aborted: Employee name is empty');
      return;
    }
    clockInTime = new Date();
    const localTime = clockInTime.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }) || 'Unknown Time';
    console.log(`Clock In: Employee: ${employeeName}, Time: ${localTime}`);
    const discordData = {
      username: 'Auto Exotic Clock',
      embeds: [{
        title: 'Clock In',
        fields: [
          { name: 'Employee Name', value: employeeName, inline: true },
          { name: 'Time', value: localTime, inline: true }
        ],
        color: 0x0000ff
      }]
    };
    console.log('Sending clock-in webhook:', JSON.stringify(discordData));
    $.ajax({
      url: 'https://discord.com/api/webhooks/YOUR_CLOCK_WEBHOOK_URL',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(discordData),
      success: function () {
        alert(`${employeeName} successfully clocked in at ${localTime}!`);
        console.log('Clock-in webhook sent successfully');
      },
      error: function (xhr, status, error) {
        alert('Error clocking in. Webhook may be invalid or unreachable. Check console for details.');
        console.error(`Clock-in webhook failed: Status: ${xhr.status}, Error: ${error}, Response: ${xhr.responseText}`);
      }
    });
  };

  // Clock Out
  window.clockOut = function () {
    console.log('clockOut() triggered');
    const employeeName = $('#employeeName').val().trim();
    if (!employeeName) {
      alert('Employee Name is required!');
      console.warn('Clock-out aborted: Employee name is empty');
      return;
    }
    if (!clockInTime) {
      alert('No clock-in time recorded. Please clock in first!');
      console.warn('Clock-out aborted: No clock-in time recorded');
      return;
    }
    const clockOutTime = new Date();
    const localTime = clockOutTime.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }) || 'Unknown Time';
    // Calculate duration
    const durationMs = clockOutTime - clockInTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m${minutes !== 1 ? 's' : ''}`;
    console.log(`Clock Out: Employee: ${employeeName}, Time: ${localTime}, Duration: ${durationText}`);
    const discordData = {
      username: 'Auto Exotic Clock',
      embeds: [{
        title: 'Clock Out',
        fields: [
          { name: 'Employee Name', value: employeeName, inline: true },
          { name: 'Time', value: localTime, inline: true },
          { name: 'Duration', value: durationText, inline: true }
        ],
        color: 0xff0000
      }]
    };
    console.log('Sending clock-out webhook:', JSON.stringify(discordData));
    $.ajax({
      url: 'https://discord.com/api/webhooks/YOUR_CLOCK_WEBHOOK_URL',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(discordData),
      success: function () {
        alert(`${employeeName} successfully clocked out at ${localTime}! Duration: ${durationText}`);
        console.log('Clock-out webhook sent successfully');
        clockInTime = null;
      },
      error: function (xhr, status, error) {
        alert('Error clocking out. Webhook may be invalid or unreachable. Please check console for details.');
        console.error(`Clock-out webhook failed: Status: ${xhr.status}, Error: ${error}, Response: ${xhr.responseText}`);
      }
    });
  };

  // History Button Modal
  $('#historyBtn').on('click', function() {
    displayOrderHistory();
    $('#historyModal').show();
  });

  // Close modal
  $('.close').on('click', function() {
    $('#historyModal').hide();
    $('#statsModal').hide();
    $('#adminModal').hide();
  });

  // Close modal when clicking outside
  $(window).on('click', function(event) {
    if (event.target.id === 'historyModal' || event.target.id === 'statsModal' || event.target.id === 'adminModal') {
      $('#historyModal').hide();
      $('#statsModal').hide();
      $('#adminModal').hide();
    }
  });
});