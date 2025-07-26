$(document).ready(function () {
  // Store clock-in time
  let clockInTime = null;
  let employees = [];

  // Initialize employees
  function initializeEmployees() {
    employees = JSON.parse(localStorage.getItem('employees')) || [
      "Josh Freeman",
      "Higgles",
      "Quan Phillaps",
      "Baha Blast",
      "Mark Logan",
      "Rob Banks",
      "Smelvin Smithers"
    ];
    
    // Save to localStorage if it was empty
    if (!localStorage.getItem('employees')) {
      localStorage.setItem('employees', JSON.stringify(employees));
    }
    
    // Populate dropdown
    const select = $('#employeeName');
    select.empty();
    select.append('<option value="">Select Employee</option>');
    employees.forEach(employee => {
      select.append(`<option value="${employee}">${employee}</option>`);
    });
    
    return employees;
  }

  // Initialize employees when page loads
  initializeEmployees();

  // Calculate Totals
  window.calculateTotals = function () {
    let total = 0;
    const menuItems = $('.menu-item:checked');
    if (menuItems.length === 0) {
      alert('Please select at least one item to calculate!');
      $('#total, #commission').text('');
      return;
    }
    menuItems.each(function () {
      const price = parseFloat($(this).attr('data-price'));
      const quantity = parseInt($(this).next('.quantity').val()) || 1;
      const discount = parseFloat($('#discount').val()) || 0;
      if (!isNaN(price) && !isNaN(quantity) && quantity > 0) {
        const itemTotal = price * quantity * (1 - (discount / 100));
        total += itemTotal;
      }
    });
    const commission = total * 0.30;
    $('#total').text('$' + total.toFixed(2));
    $('#commission').text('$' + commission.toFixed(2));
  };

  // Bind Calculate button
  $('#calculateBtn').on('click', function () {
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
    
    // Add employee management section
    historyContent.append(`
      <div class="employee-management">
        <h4>Employee Management</h4>
        <div class="add-employee">
          <input type="text" id="newEmployeeName" placeholder="New employee name" class="form-input">
          <button type="button" id="addEmployeeBtn" class="btn btn-primary">Add Employee</button>
        </div>
        <div class="employee-list">
          <h5>Current Employees:</h5>
          <ul id="employeeList"></ul>
        </div>
      </div>
    `);
    
    // Populate employee list
    const employeeList = $('#employeeList');
    employees.forEach((employee, index) => {
      employeeList.append(`
        <li>
          <span>${employee}</span>
          <button type="button" class="btn btn-danger remove-employee" data-index="${index}">
            <i class="fas fa-trash"></i>
          </button>
        </li>
      `);
    });
    
    // Add event handler for adding employees
    $('#addEmployeeBtn').on('click', function() {
      const newName = $('#newEmployeeName').val().trim();
      if (newName) {
        employees.push(newName);
        localStorage.setItem('employees', JSON.stringify(employees));
        initializeEmployees();
        $('#newEmployeeName').val('');
        displayOrderHistory();
      }
    });
    
    // Add event handler for removing employees
    $('.remove-employee').on('click', function() {
      const index = $(this).data('index');
      employees.splice(index, 1);
      localStorage.setItem('employees', JSON.stringify(employees));
      initializeEmployees();
      displayOrderHistory();
    });
    
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

  // Submit Form
  window.SubForm = function () {
    const total = $('#total').text().trim();
    if (!total) {
      alert('Please calculate the total first!');
      return;
    }
    const employeeName = $('#employeeName').val().trim();
    if (!employeeName) {
      alert('Please select an employee!');
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
    const totalValue = parseFloat(total.replace('$', ''));
    const commission = parseFloat($('#commission').text().replace('$', ''));
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

  // Reset Form
  window.resetForm = function () {
    $('.menu-item').prop('checked', false);
    $('.quantity').val('1');
    $('#total, #commission').text('');
    $('#discount').val('0');
  };

  // Clock In
  window.clockIn = function () {
    const employeeName = $('#employeeName').val().trim();
    if (!employeeName) {
      alert('Please select an employee!');
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
        alert('Error clocking in. Webhook may be invalid or unreachable. Check console for details.');
        console.error(`Clock-in webhook failed: Status: ${xhr.status}, Error: ${error}, Response: ${xhr.responseText}`);
      }
    });
  };

  // Clock Out
  window.clockOut = function () {
    const employeeName = $('#employeeName').val().trim();
    if (!employeeName) {
      alert('Please select an employee!');
      return;
    }
    if (!clockInTime) {
      alert('No clock-in time recorded. Please clock in first!');
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
    const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    const discordData = {
      username: 'data',
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
    $.ajax({
      url: 'https://discord.com/api/webhooks/1398362885012459590/5H5-5Z4n8h3wqsN1N7hLOTB-XVjVNKzeFJ-07FHXWSVmnru9gLQsrfpiCBw27VMgnztv',
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(discordData),
      success: function () {
        alert(`${employeeName} successfully clocked out at ${localTime}! Duration: ${durationText}`);
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
  });

  // Close modal when clicking outside
  $(window).on('click', function(event) {
    if (event.target.id === 'historyModal') {
      $('#historyModal').hide();
    }
  });
});