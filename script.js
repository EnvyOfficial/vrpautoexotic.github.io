$(document).ready(function () {
  // Store clock-in time (original)
  let clockInTime = null;

  // NEW: Account system
  const ADMIN_PASSWORD = "admin123";
  const REMEMBER_ME_KEY = "autoExoticRememberMe";
  let users = JSON.parse(localStorage.getItem('autoExoticUsers')) || {};
  let employeeStats = JSON.parse(localStorage.getItem('autoExoticStats')) || {};
  let currentUser = null;

  // NEW: Initialize with remembered user
  const remembered = JSON.parse(localStorage.getItem(REMEMBER_ME_KEY));
  if (remembered && users[remembered.username]) {
    if (users[remembered.username].password === remembered.password) {
      currentUser = remembered.username;
      $('#employeeName').val(currentUser);
      $('#loginForm').hide();
    }
  }

  // NEW: Login function
  window.login = function() {
    const username = $('#loginUsername').val().trim();
    const password = $('#loginPassword').val();
    const rememberMe = $('#rememberMe').is(':checked');

    if (!users[username] || users[username].password !== password) {
      alert('Invalid credentials');
      return;
    }

    currentUser = username;
    $('#employeeName').val(username);
    $('#loginForm').hide();

    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({
        username: username,
        password: password
      }));
    }

    // Initialize stats if new user
    if (!employeeStats[username]) {
      employeeStats[username] = {
        orders: 0,
        revenue: 0,
        commission: 0,
        hoursWorked: 0
      };
      localStorage.setItem('autoExoticStats', JSON.stringify(employeeStats));
    }
  };

  // NEW: Register function
  window.register = function() {
    const username = $('#registerUsername').val().trim();
    const password = $('#registerPassword').val();
    const confirm = $('#registerConfirm').val();

    if (password !== confirm) {
      alert('Passwords do not match');
      return;
    }

    if (users[username]) {
      alert('Username already exists');
      return;
    }

    users[username] = { password };
    localStorage.setItem('autoExoticUsers', JSON.stringify(users));
    
    employeeStats[username] = {
      orders: 0,
      revenue: 0,
      commission: 0,
      hoursWorked: 0
    };
    localStorage.setItem('autoExoticStats', JSON.stringify(employeeStats));

    alert('Account created! Please login.');
    $('#registerForm').hide();
    $('#loginForm').show();
  };

  // NEW: Show/hide auth forms
  window.showRegister = function() {
    $('#loginForm').hide();
    $('#registerForm').show();
  };

  window.showLogin = function() {
    $('#registerForm').hide();
    $('#loginForm').show();
  };

  // NEW: Display stats
  window.showStats = function() {
    const statsContent = $('#statsContent');
    statsContent.empty();

    const sorted = Object.entries(employeeStats).sort((a, b) => b[1].revenue - a[1].revenue);
    
    let html = `<table class="stats-table"><tr>
      <th>Employee</th><th>Orders</th><th>Revenue</th><th>Commission</th><th>Hours</th>
    </tr>`;

    sorted.forEach(([user, stats]) => {
      html += `<tr>
        <td>${user}</td>
        <td>${stats.orders}</td>
        <td>$${stats.revenue.toFixed(2)}</td>
        <td>$${stats.commission.toFixed(2)}</td>
        <td>${stats.hoursWorked.toFixed(1)}</td>
      </tr>`;
    });

    html += `</table>`;
    statsContent.html(html);
    $('#statsModal').show();
  };

  // NEW: Admin functions
  window.verifyAdmin = function() {
    if ($('#adminPassword').val() === ADMIN_PASSWORD) {
      $('#adminContent').show();
      displayAccounts();
    } else {
      alert('Invalid admin password');
    }
  };

  function displayAccounts() {
    let html = '';
    Object.keys(users).forEach(user => {
      html += `<div>
        <input type="checkbox" id="del-${user}">
        <label for="del-${user}">${user}</label>
      </div>`;
    });
    $('#accountsList').html(html);
  }

  window.deleteAccounts = function() {
    const toDelete = [];
    $('input[type="checkbox"]:checked').each(function() {
      toDelete.push($(this).attr('id').replace('del-', ''));
    });

    toDelete.forEach(user => {
      if (user !== currentUser) {
        delete users[user];
        delete employeeStats[user];
      }
    });

    localStorage.setItem('autoExoticUsers', JSON.stringify(users));
    localStorage.setItem('autoExoticStats', JSON.stringify(employeeStats));
    displayAccounts();
  };

  // ORIGINAL CODE (unchanged except for additions marked with "// NEW")
  window.calculateTotals = function () {
    console.log('calculateTotals() triggered');
    let total = 0;
    const menuItems = $('.menu-item:checked');
    console.log('Checked items:', menuItems.length);
    if (menuItems.length === 0) {
      alert('Please select at least one item to calculate!');
      $('#total, #commission').text('');
      return;
    }
    menuItems.each(function () {
      const price = parseFloat($(this).attr('data-price'));
      const quantity = parseInt($(this).next('.quantity').val()) || 1;
      const discount = parseFloat($('#discount').val()) || 0;
      console.log(`Processing item - Price: ${price}, Quantity: ${quantity}, Discount: ${discount}%`);
      if (!isNaN(price) && !isNaN(quantity) && quantity > 0) {
        const itemTotal = price * quantity * (1 - (discount / 100));
        total += itemTotal;
        console.log(`Item: ${$(this).parent().text().trim()}, Item Total: ${itemTotal.toFixed(2)}`);
      } else {
        console.warn(`Skipping item: Invalid price (${price}) or quantity (${quantity})`);
      }
    });
    const commission = total * 0.30;
    $('#total').text(total.toFixed(2));
    $('#commission').text(commission.toFixed(2));
    console.log(`Final Total: ${total.toFixed(2)}, Commission: ${commission.toFixed(2)}`);
    
    // NEW: Update stats
    if (currentUser) {
      employeeStats[currentUser].revenue += total;
      employeeStats[currentUser].commission += commission;
      localStorage.setItem('autoExoticStats', JSON.stringify(employeeStats));
    }
  };

  // Original SubForm with NEW stats tracking
  window.SubForm = function () {
    const total = $('#total').text().trim();
    if (!total) {
      alert('Please calculate the total first!');
      return;
    }
    const employeeName = $('#employeeName').val().trim();
    if (!employeeName) {
      alert('Employee Name is required!');
      return;
    }
    
    // NEW: Track current user if logged in
    if (currentUser && currentUser !== employeeName) {
      alert('Logged in as different user!');
      return;
    }

    const orderedItems = [];
    $('.menu-item:checked').each(function () {
      const itemName = $(this).parent().text().trim();
      const price = parseFloat($(this).attr('data-price'));
      const quantity = parseInt($(this).next('.quantity').val()) || 1;
      if (!isNaN(price) && !isNaN(quantity) && quantity > 0) {
        orderedItems.push({ name: itemName, price, quantity });
      }
    });
    
    if (orderedItems.length === 0) {
      alert('Please select at least one item!');
      return;
    }
    
    const totalValue = parseFloat(total);
    const commission = parseFloat($('#commission').text());
    const discount = parseFloat($('#discount').val());
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    const formData = {
      'Employee Name': employeeName,
      Total: totalValue.toFixed(2),
      Commission: commission.toFixed(2),
      'Items Ordered': JSON.stringify(orderedItems),
      'Discount Applied': discount,
      Timestamp: timestamp
    };
    
    // NEW: Update stats
    if (currentUser) {
      employeeStats[currentUser].orders++;
      localStorage.setItem('autoExoticStats', JSON.stringify(employeeStats));
    }

    // Original webhook code remains unchanged
    const discordData = {
      username: 'Receipts',
      content: `New order submitted by ${employeeName}`,
      embeds: [{
        title: 'Order Details',
        fields: [
          { name: 'Employee Name', value: employeeName, inline: true },
          { name: 'Total', value: `$${totalValue.toFixed(2)}`, inline: true },
          { name: 'Commission', value: `$${commission.toFixed(2)}`, inline: true },
          { name: 'Discount Applied', value: `${discount}%`, inline: true },
          { name: 'Items Ordered', value: orderedItems.map(item => `${item.quantity}x ${item.name}`).join('\n') }
        ],
        color: 0x00ff00
      }]
    };
    
    $.when(
      $.ajax({
        url: 'https://discord.com/api/webhooks/1398362658603925685/ZsarleGPoIh6UJcYg2MsIjzpEMQdY2ph2SkF8CQGe65VbGDkTi1PbqE7hBGp9DrV8X8Q',
        type: 'post',
        data: formData,
        headers: {
          accessKey: '219db3aaa892bb5e19e27b5ec9ed348a',
          secretKey: '8b9019c7605f42fcfc9f7a62dde61f63',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }),
      $.ajax({
        url: 'https://discord.com/api/webhooks/1398362658603925685/ZsarleGPoIh6UJcYg2MsIjzpEMQdY2ph2SkF8CQGe65VbGDkTi1PbqE7hBGp9DrV8X8Q',
        type: 'post',
        contentType: 'application/json',
        data: JSON.stringify(discordData),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    ).then(function () {
      alert('Order submitted successfully!');
      saveOrder(formData);
      resetForm();
    }).fail(function (xhr, status, error) {
      alert('Error submitting order. Please try again.');
      console.error(`Submission error: Status: ${xhr.status}, Error: ${error}, Response: ${xhr.responseText}`);
    });
  };

  // Original resetForm with NEW user tracking
  window.resetForm = function () {
    $('.menu-item').prop('checked', false);
    $('.quantity').val('1');
    $('#total, #commission').text('');
    $('#discount').val('0');
    // Still keeps employee name if logged in
    if (currentUser) {
      $('#employeeName').val(currentUser);
    }
  };

  // Original clockIn with NEW stats tracking
  window.clockIn = function () {
    console.log('clockIn() triggered');
    const employeeName = $('#employeeName').val().trim();
    if (!employeeName) {
      alert('Employee Name is required!');
      console.warn('Clock-in aborted: Employee name is empty');
      return;
    }
    
    // NEW: Verify logged in user
    if (currentUser && currentUser !== employeeName) {
      alert('Logged in as different user!');
      return;
    }
    
    clockInTime = new Date();
    
    // NEW: Track in stats
    if (currentUser) {
      employeeStats[currentUser].lastClockIn = clockInTime.toISOString();
      localStorage.setItem('autoExoticStats', JSON.stringify(employeeStats));
    }

    const localTime = clockInTime.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }) || 'Unknown Time';
    
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
    
    $.ajax({
      url: 'https://discord.com/api/webhooks/1398362885012459590/5H5-5Z4n8h3wqsN1N7hLOTB-XVjVNKzeFJ-07FHXWSVmnru9gLQsrfpiCBw27VMgnztv',
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(discordData),
      success: function () {
        alert(`${employeeName} successfully clocked in at ${localTime}!`);
      },
      error: function (xhr, status, error) {
        alert('Error clocking in. Webhook may be invalid or unreachable.');
      }
    });
  };

  // Original clockOut with NEW stats tracking
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
    
    // NEW: Verify logged in user
    if (currentUser && currentUser !== employeeName) {
      alert('Logged in as different user!');
      return;
    }
    
    const clockOutTime = new Date();
    const durationMs = clockOutTime - clockInTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m${minutes !== 1 ? 's' : ''}`;
    
    // NEW: Track in stats
    if (currentUser) {
      employeeStats[currentUser].hoursWorked += durationMs / (1000 * 60 * 60);
      employeeStats[currentUser].lastClockOut = clockOutTime.toISOString();
      localStorage.setItem('autoExoticStats', JSON.stringify(employeeStats));
    }

    const discordData = {
      username: 'data',
      embeds: [{
        title: 'Clock Out',
        fields: [
          { name: 'Employee Name', value: employeeName, inline: true },
          { name: 'Time', value: clockOutTime.toLocaleString(), inline: true },
          { name: 'Duration', value: durationText, inline: true }
        ],
        color: 0xff0000
      }]
    };
    
    $.ajax({
      url: 'https://discord.com/api/webhooks/1398362885012459590/5H5-5Z4n8h3wqsN1N7hLOTB-XVjVNKzeFJ-07FHXWSVmnru9gLQsrfpiCBw27VMgnztv',
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(discordData),
      success: function () {
        alert(`${employeeName} successfully clocked out! Duration: ${durationText}`);
        clockInTime = null;
      },
      error: function (xhr, status, error) {
        alert('Error clocking out. Webhook may be invalid or unreachable.');
      }
    });
  };

  // Original history functions remain unchanged
  function saveOrder(orderData) {
    let orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
    orderHistory.push(orderData);
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
  }

  function displayOrderHistory() {
    const historyContent = $('#historyContent');
    historyContent.empty();
    const orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
    if (orderHistory.length === 0) {
      historyContent.append('<p>No orders found.</p>');
    } else {
      orderHistory.forEach((order, index) => {
        const orderItems = JSON.parse(order['Items Ordered']);
        const itemsList = orderItems.map(item => `${item.quantity}x ${item.name}`).join('<br>');
        historyContent.append(
          `<p><strong>Order #${index + 1}</strong><br>
          Employee: ${order['Employee Name']}<br/>
          Time: ${order['Timestamp']}<br>
          Total: $${order['Total']}<br>
          Commission: $${order['Commission']}<br>
          Discount: ${order['Discount Applied']}%<br>
          Items:<br>${itemsList}</p>`
        );
      });
    }
  }

  // Modal controls (original)
  $('#historyBtn').on('click', function() {
    displayOrderHistory();
    $('#historyModal').show();
  });

  $('.close').on('click', function() {
    $('#historyModal, #statsModal, #adminModal').hide();
  });

  $(window).on('click', function(event) {
    if ($(event.target).hasClass('modal')) {
      $('.modal').hide();
    }
  });
});