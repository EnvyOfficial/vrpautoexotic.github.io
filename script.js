$(document).ready(function () {
  // Store clock-in time
  let clockInTime = null;
  let currentUser = null;

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
    
    // Simple validation (replace with real authentication)
    if (password.length < 4) {
      alert('Password must be at least 4 characters');
      return;
    }
    
    if (rememberMe) {
      saveCredentials(username, password);
    } else {
      clearCredentials();
    }
    
    currentUser = username;
    $('#employeeName').val(username);
    $('#loginForm').hide();
    $('#appContent').show();
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

  // Calculate Totals
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
  };

  // Bind Calculate button
  $('#calculateBtn').on('click', function () {
    console.log('Calculate button clicked');
    window.calculateTotals();
  });

  // Save order to localStorage
  function saveOrder(orderData) {
    let orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
    orderHistory.push(orderData);
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
  }

  // Display order history
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

  // Submit Form with fixed Discord webhook
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

    const discordData = {
      username: 'Auto Exotic Shop',
      embeds: [{
        title: 'New Order',
        color: 0x00ff00,
        fields: [
          { name: 'Employee', value: employeeName, inline: true },
          { name: 'Total', value: `$${totalValue.toFixed(2)}`, inline: true },
          { name: 'Commission', value: `$${commission.toFixed(2)}`, inline: true },
          { name: 'Discount', value: `${discount}%`, inline: true },
          { name: 'Items', value: orderedItems.map(item => `${item.quantity}x ${item.name}`).join('\n') },
          { name: 'Timestamp', value: timestamp }
        ]
      }]
    };

    // Replace with your actual Discord webhook URL
    const webhookUrl = 'https://discord.com/api/webhooks/1398362658603925685/ZsarleGPoIh6UJcYg2MsIjzpEMQdY2ph2SkF8CQGe65VbGDkTi1PbqE7hBGp9DrV8X8Q';
    
    $.ajax({
      url: webhookUrl,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(discordData),
      success: function() {
        alert('Order submitted successfully!');
        saveOrder({
          'Employee Name': employeeName,
          Total: totalValue.toFixed(2),
          Commission: commission.toFixed(2),
          'Items Ordered': JSON.stringify(orderedItems),
          'Discount Applied': discount,
          Timestamp: timestamp
        });
        resetForm();
      },
      error: function(xhr, status, error) {
        alert('Error submitting order. Please try again.');
        console.error('Webhook Error:', status, error);
      }
    });
  };

  // Reset Form
  window.resetForm = function () {
    $('.menu-item').prop('checked', false);
    $('.quantity').val('');
    $('#total, #commission').text('');
    $('#discount').val('0');
  };

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
      url: 'https://discord.com/api/webhooks/1398362885012459590/5H5-5Z4n8h3wqsN1N7hLOTB-XVjVNKzeFJ-07FHXWSVmnru9gLQsrfpiCBw27VMgnztv',
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
      url: 'https://discord.com/api/webhooks/1398362885012459590/5H5-5Z4n8h3wqsN1N7hLOTB-XVjVNKzeFJ-07FHXWSVmnru9gLQsrfpiCBw27VMgnztv',
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