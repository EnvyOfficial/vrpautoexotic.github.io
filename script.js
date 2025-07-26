$(document).ready(function() {
  // ADMIN CONFIGURATION
  const ADMIN_PASSWORD = "admin123"; // Change this to your desired admin password
  
  // Data storage
  let users = JSON.parse(localStorage.getItem('autoExoticUsers')) || {};
  let orders = JSON.parse(localStorage.getItem('autoExoticOrders')) || [];
  let employeeStats = JSON.parse(localStorage.getItem('autoExoticStats')) || {};
  let currentUser = null;
  let clockInTime = null;
  
  // Initialize UI
  function initUI() {
    // Show login form by default
    $('#loginForm').show();
    $('#registerForm').hide();
    $('#appContent').hide();
    
    // Load any saved employee name
    const savedUser = localStorage.getItem('currentEmployee');
    if (savedUser && users[savedUser]) {
      $('#loginUsername').val(savedUser);
    }
  }
  
  // Auth functions
  function login(username, password) {
    if (!users[username]) {
      alert('Username not found');
      return false;
    }
    
    if (users[username].password !== password) {
      alert('Incorrect password');
      return false;
    }
    
    currentUser = username;
    localStorage.setItem('currentEmployee', username);
    
    // Initialize stats if new user
    if (!employeeStats[username]) {
      employeeStats[username] = {
        orders: 0,
        revenue: 0,
        commission: 0,
        hoursWorked: 0,
        lastClockIn: null,
        lastClockOut: null
      };
      saveStats();
    }
    
    $('#loginForm').hide();
    $('#appContent').show();
    return true;
  }
  
  function register(username, password) {
    if (users[username]) {
      alert('Username already exists');
      return false;
    }
    
    users[username] = { password };
    localStorage.setItem('autoExoticUsers', JSON.stringify(users));
    
    employeeStats[username] = {
      orders: 0,
      revenue: 0,
      commission: 0,
      hoursWorked: 0,
      lastClockIn: null,
      lastClockOut: null
    };
    saveStats();
    
    alert('Account created successfully! Please login.');
    $('#registerForm').hide();
    $('#loginForm').show();
    return true;
  }
  
  function saveStats() {
    localStorage.setItem('autoExoticStats', JSON.stringify(employeeStats));
  }
  
  function saveOrders() {
    localStorage.setItem('autoExoticOrders', JSON.stringify(orders));
  }
  
  // Event handlers
  $('#loginBtn').click(function() {
    const username = $('#loginUsername').val().trim();
    const password = $('#loginPassword').val();
    
    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }
    
    login(username, password);
  });
  
  $('#registerBtn').click(function() {
    const username = $('#registerUsername').val().trim();
    const password = $('#registerPassword').val();
    const confirm = $('#registerConfirm').val();
    
    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }
    
    if (password !== confirm) {
      alert('Passwords do not match');
      return;
    }
    
    register(username, password);
  });
  
  $('#showRegisterBtn').click(function() {
    $('#loginForm').hide();
    $('#registerForm').show();
  });
  
  $('#showLoginBtn').click(function() {
    $('#registerForm').hide();
    $('#loginForm').show();
  });
  
  // Order functions
  window.calculateTotals = function() {
    let total = 0;
    const menuItems = $('.menu-item:checked');
    
    if (menuItems.length === 0) {
      alert('Please select at least one item to calculate!');
      $('#total, #commission').text('');
      return;
    }
    
    menuItems.each(function() {
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
  
  window.SubForm = function() {
    const totalText = $('#total').text().replace('$', '').trim();
    if (!totalText || totalText === '$0.00') {
      alert('Please calculate the total first!');
      return;
    }
    
    const total = parseFloat(totalText);
    const commission = parseFloat($('#commission').text().replace('$', ''));
    const discount = parseFloat($('#discount').val()) || 0;
    
    // Get ordered items
    const orderedItems = [];
    $('.menu-item:checked').each(function() {
      const itemName = $(this).parent().text().split(' - ')[0].trim();
      const price = parseFloat($(this).attr('data-price'));
      const quantity = parseInt($(this).next('.quantity').val()) || 1;
      
      if (!isNaN(price) && !isNaN(quantity) && quantity > 0) {
        orderedItems.push({
          name: itemName,
          price: price,
          quantity: quantity
        });
      }
    });
    
    if (orderedItems.length === 0) {
      alert('Please select at least one item!');
      return;
    }
    
    // Create order record
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    const order = {
      employee: currentUser,
      total: total,
      commission: commission,
      discount: discount,
      items: orderedItems,
      timestamp: timestamp
    };
    
    // Save order
    orders.push(order);
    saveOrders();
    
    // Update stats
    employeeStats[currentUser].orders++;
    employeeStats[currentUser].revenue += total;
    employeeStats[currentUser].commission += commission;
    saveStats();
    
    alert('Order submitted successfully!');
    resetForm();
  };
  
  window.resetForm = function() {
    $('.menu-item').prop('checked', false);
    $('.quantity').val('1');
    $('#total, #commission').text('');
    $('#discount').val('0');
  };
  
  // Clock functions
  window.clockIn = function() {
    if (!currentUser) {
      alert('Please login first');
      return;
    }
    
    if (clockInTime) {
      alert('You are already clocked in!');
      return;
    }
    
    clockInTime = new Date();
    employeeStats[currentUser].lastClockIn = clockInTime.toISOString();
    saveStats();
    
    alert(`${currentUser} clocked in at ${clockInTime.toLocaleTimeString()}`);
  };
  
  window.clockOut = function() {
    if (!currentUser) {
      alert('Please login first');
      return;
    }
    
    if (!clockInTime) {
      alert('You are not clocked in!');
      return;
    }
    
    const clockOutTime = new Date();
    const durationMs = clockOutTime - clockInTime;
    const hoursWorked = durationMs / (1000 * 60 * 60);
    
    // Update stats
    employeeStats[currentUser].hoursWorked += hoursWorked;
    employeeStats[currentUser].lastClockOut = clockOutTime.toISOString();
    saveStats();
    
    const hours = Math.floor(hoursWorked);
    const minutes = Math.floor((hoursWorked % 1) * 60);
    
    alert(`${currentUser} clocked out at ${clockOutTime.toLocaleTimeString()}\nDuration: ${hours}h ${minutes}m`);
    clockInTime = null;
  };
  
  // Stats functions
  function displayOrderHistory() {
    const historyContent = $('#historyContent');
    historyContent.empty();
    
    const userOrders = orders.filter(order => order.employee === currentUser);
    
    if (userOrders.length === 0) {
      historyContent.append('<p>No orders found.</p>');
      return;
    }
    
    userOrders.forEach((order, index) => {
      const itemsList = order.items.map(item => 
        `${item.quantity}x ${item.name} ($${item.price.toFixed(2)}`
      ).join('<br>');
      
      historyContent.append(`
        <p>
          <strong>Order #${index + 1}</strong><br>
          <strong>Date:</strong> ${order.timestamp}<br>
          <strong>Total:</strong> $${order.total.toFixed(2)}<br>
          <strong>Commission:</strong> $${order.commission.toFixed(2)}<br>
          <strong>Discount:</strong> ${order.discount}%<br>
          <strong>Items:</strong><br>${itemsList}
        </p>
      `);
    });
  }
  
  function displayEmployeeStats(period = 'all') {
    const statsContent = $('#statsContent');
    statsContent.empty();
    
    // Filter by period
    const now = new Date();
    let filteredStats = {};
    
    Object.keys(employeeStats).forEach(username => {
      const stats = employeeStats[username];
      filteredStats[username] = { ...stats };
      
      // In a real app, you would filter orders by date here
      // This is simplified for the example
    });
    
    // Sort by revenue
    const sortedEmployees = Object.entries(filteredStats)
      .sort((a, b) => b[1].revenue - a[1].revenue);
    
    if (sortedEmployees.length === 0) {
      statsContent.append('<p>No statistics available.</p>');
      return;
    }
    
    // Create table
    let html = `
      <table class="stats-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Orders</th>
            <th>Revenue</th>
            <th>Commission</th>
            <th>Hours</th>
            <th>Performance</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    sortedEmployees.forEach(([username, stats], index) => {
      // Calculate performance metrics
      const avgCommission = stats.orders > 0 
        ? (stats.commission / stats.orders).toFixed(2)
        : 0;
      
      const efficiency = stats.hoursWorked > 0
        ? (stats.revenue / stats.hoursWorked).toFixed(2)
        : 0;
      
      // Award badges
      let badge = '';
      if (index === 0) badge = '🏆 Top Seller';
      else if (efficiency > 5000) badge = '⭐ Star Performer';
      else if (stats.orders > 20) badge = '🔧 Consistent Worker';
      
      html += `
        <tr>
          <td>${username}</td>
          <td>${stats.orders}</td>
          <td>$${stats.revenue.toFixed(2)}</td>
          <td>$${stats.commission.toFixed(2)}</td>
          <td>${stats.hoursWorked.toFixed(1)}</td>
          <td>${badge}</td>
        </tr>
      `;
    });
    
    html += `</tbody></table>`;
    statsContent.append(html);
  }
  
  // Admin functions
  function showAdminPanel() {
    $('#adminModal').show();
    $('#adminContent').hide();
    $('#adminPassword').val('');
  }
  
  function verifyAdmin(password) {
    return password === ADMIN_PASSWORD;
  }
  
  function displayAccounts() {
    const accountsList = $('#accountsList');
    accountsList.empty();
    
    Object.keys(users).forEach(username => {
      accountsList.append(`
        <div class="account-item">
          <input type="checkbox" class="account-checkbox" id="acc-${username}" value="${username}">
          <label for="acc-${username}">${username}</label>
          <span>Orders: ${employeeStats[username]?.orders || 0}</span>
        </div>
      `);
    });
  }
  
  function deleteSelectedAccounts() {
    const selected = $('.account-checkbox:checked').map(function() {
      return $(this).val();
    }).get();
    
    if (selected.length === 0) {
      alert('Please select at least one account to delete');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selected.length} account(s)?`)) {
      return;
    }
    
    selected.forEach(username => {
      // Don't allow deleting currently logged in user
      if (username === currentUser) {
        alert(`Cannot delete currently logged in user (${username})`);
        return;
      }
      
      delete users[username];
      delete employeeStats[username];
      
      // Remove user's orders
      orders = orders.filter(order => order.employee !== username);
    });
    
    localStorage.setItem('autoExoticUsers', JSON.stringify(users));
    localStorage.setItem('autoExoticStats', JSON.stringify(employeeStats));
    localStorage.setItem('autoExoticOrders', JSON.stringify(orders));
    
    alert(`${selected.length} account(s) deleted successfully`);
    displayAccounts();
  }
  
  // Modal controls
  $('#historyBtn').click(function() {
    displayOrderHistory();
    $('#historyModal').show();
  });
  
  $('#statsBtn').click(function() {
    displayEmployeeStats();
    $('#statsModal').show();
  });
  
  $('#adminBtn').click(function() {
    showAdminPanel();
  });
  
  $('.close').click(function() {
    $(this).closest('.modal').hide();
  });
  
  $(window).click(function(event) {
    if ($(event.target).hasClass('modal')) {
      $('.modal').hide();
    }
  });
  
  // Filter controls
  $(document).on('click', '.filter-btn', function() {
    $('.filter-btn').removeClass('active');
    $(this).addClass('active');
    displayEmployeeStats($(this).data('period'));
  });
  
  // Admin controls
  $('#adminPassword').keypress(function(e) {
    if (e.which === 13) { // Enter key
      $('#adminPassword').trigger('blur');
    }
  });
  
  $('#adminPassword').blur(function() {
    if (verifyAdmin($(this).val())) {
      $('#adminContent').show();
      displayAccounts();
    } else if ($(this).val()) {
      alert('Incorrect admin password');
    }
  });
  
  $('#deleteSelectedBtn').click(deleteSelectedAccounts);
  
  // Initialize
  initUI();
});