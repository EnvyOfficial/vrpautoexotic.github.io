$(document).ready(function () {
  // Store clock-in time
  let clockInTime = null;
  const employeeHours = {};

  // Initialize employee hours from localStorage
  const savedHours = localStorage.getItem('employeeHours');
  if (savedHours) {
    Object.assign(employeeHours, JSON.parse(savedHours));
  }

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

  // Submit Form
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
    console.log('clockIn() triggered');
    const employeeName = $('#employeeName').val().trim();
    if (!employeeName) {
      alert('Employee Name is required!');
      console.warn('Clock-in aborted: Employee name is empty');
      return;
    }
    
    // Check if already clocked in
    if (localStorage.getItem(`clockIn_${employeeName}`)) {
      alert(`${employeeName} is already clocked in!`);
      return;
    }
    
    clockInTime = new Date();
    localStorage.setItem(`clockIn_${employeeName}`, clockInTime.getTime());
    
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
      headers: {
        'Content-Type': 'application/json'
      },
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
    
    const clockInTime = localStorage.getItem(`clockIn_${employeeName}`);
    if (!clockInTime) {
      alert('No clock-in record found! Please clock in first.');
      console.warn('Clock-out aborted: No clock-in time recorded');
      return;
    }
    
    const clockOutTime = new Date().getTime();
    const durationMs = clockOutTime - parseInt(clockInTime);
    const hoursWorked = (durationMs / (1000 * 60 * 60)).toFixed(2);
    
    // Update employee hours
    if (!employeeHours[employeeName]) {
      employeeHours[employeeName] = 0;
    }
    employeeHours[employeeName] += parseFloat(hoursWorked);
    
    // Save to localStorage
    localStorage.setItem('employeeHours', JSON.stringify(employeeHours));
    localStorage.removeItem(`clockIn_${employeeName}`);
    
    const localTime = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }) || 'Unknown Time';
    
    // Format duration
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    
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
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(discordData),
      success: function () {
        alert(`${employeeName} successfully clocked out at ${localTime}! Duration: ${durationText}`);
        console.log('Clock-out webhook sent successfully');
      },
      error: function (xhr, status, error) {
        alert('Error clocking out. Webhook may be invalid or unreachable. Please check console for details.');
        console.error(`Clock-out webhook failed: Status: ${xhr.status}, Error: ${error}, Response: ${xhr.responseText}`);
      }
    });
  };

  // Leaderboard functionality
  $('#leaderboardBtn').on('click', function() {
    displayLeaderboard();
    $('#leaderboardModal').show();
  });

  function displayLeaderboard(timeframe = 'week') {
    const history = JSON.parse(localStorage.getItem('employeeHours')) || {};
    const now = new Date();
    let filteredHours = {};
    
    // Filter by timeframe (simplified for demo)
    Object.keys(history).forEach(employee => {
      filteredHours[employee] = history[employee];
    });
    
    // Sort employees by hours
    const sortedEmployees = Object.keys(filteredHours)
      .map(employee => ({
        name: employee,
        hours: filteredHours[employee]
      }))
      .sort((a, b) => b.hours - a.hours);
    
    // Display leaderboard
    const leaderboardContent = $('#leaderboardContent');
    leaderboardContent.empty();
    
    if (sortedEmployees.length === 0) {
      leaderboardContent.append('<p>No employee hours recorded yet.</p>');
    } else {
      leaderboardContent.append('<ol class="leaderboard-list"></ol>');
      const list = $('.leaderboard-list');
      
      sortedEmployees.forEach((employee, index) => {
        const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
        list.append(`
          <li>
            <span class="rank">${medal}</span>
            <span class="employee-name">${employee.name}</span>
            <span class="hours">${employee.hours.toFixed(2)} hrs</span>
          </li>
        `);
      });
    }
    
    // Update active timeframe button
    $('.timeframe-btn').removeClass('active');
    $(`.timeframe-btn[data-timeframe="${timeframe}"]`).addClass('active');
  }

  // Timeframe selection
  $(document).on('click', '.timeframe-btn', function() {
    const timeframe = $(this).data('timeframe');
    displayLeaderboard(timeframe);
  });

  // Shop statistics
  $('#statsBtn').on('click', function() {
    displayShopStats();
    $('#statsModal').show();
  });

  function displayShopStats() {
    const orders = JSON.parse(localStorage.getItem('orderHistory')) || [];
    
    // Calculate stats
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.Total), 0);
    const totalOrders = orders.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Find top service
    const serviceCounts = {};
    orders.forEach(order => {
      const items = JSON.parse(order['Items Ordered']);
      items.forEach(item => {
        const serviceName = item.name.split(' - ')[0];
        serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + item.quantity;
      });
    });
    
    const topService = Object.keys(serviceCounts).length > 0 
      ? Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0][0]
      : 'No data';
    
    // Update UI
    $('#totalRevenue').text('$' + totalRevenue.toFixed(2));
    $('#totalOrders').text(totalOrders);
    $('#avgOrder').text('$' + avgOrder.toFixed(2));
    $('#topService').text(topService);
    
    // Render chart
    renderRevenueChart(orders);
  }

  function renderRevenueChart(orders) {
    // Group by day
    const dailyRevenue = {};
    orders.forEach(order => {
      const date = new Date(order.Timestamp).toLocaleDateString();
      dailyRevenue[date] = (dailyRevenue[date] || 0) + parseFloat(order.Total);
    });
    
    const ctx = document.getElementById('revenueChart').getContext('2d');
    if (window.revenueChart) {
      window.revenueChart.destroy();
    }
    
    window.revenueChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(dailyRevenue),
        datasets: [{
          label: 'Daily Revenue ($)',
          data: Object.values(dailyRevenue),
          backgroundColor: 'rgba(0, 188, 212, 0.7)',
          borderColor: 'rgba(0, 188, 212, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value;
              }
            }
          }
        }
      }
    });
  }

  // History Button Modal
  $('#historyBtn').on('click', function() {
    displayOrderHistory();
    $('#historyModal').show();
  });

  // Close modals
  $('.close').on('click', function() {
    $('.modal').hide();
  });

  $(window).on('click', function(event) {
    if ($(event.target).hasClass('modal')) {
      $('.modal').hide();
    }
  });
});