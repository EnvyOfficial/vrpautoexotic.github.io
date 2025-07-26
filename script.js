// ... [previous code remains exactly the same until the SubForm function]

  // Original SubForm with working webhooks
  window.SubForm = function () {
    const totalText = $('#total').text().trim();
    if (!totalText) {
      alert('Please calculate the total first!');
      return;
    }
    const employeeName = $('#employeeName').val().trim();
    if (!employeeName) {
      alert('Employee Name is required!');
      return;
    }
    
    if (currentUser && currentUser !== employeeName) {
      alert('Logged in as different user!');
      return;
    }

    const orderedItems = [];
    $('.menu-item:checked').each(function () {
      const itemName = $(this).parent().text().split(' - ')[0].trim();
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
    
    const totalValue = parseFloat(totalText);
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
    
    if (currentUser) {
      employeeStats[currentUser].orders++;
      localStorage.setItem('autoExoticStats', JSON.stringify(employeeStats));
    }

    // Fixed webhook implementation
    const discordWebhookURL = 'https://discord.com/api/webhooks/1398362658603925685/ZsarleGPoIh6UJcYg2MsIjzpEMQdY2ph2SkF8CQGe65VbGDkTi1PbqE7hBGp9DrV8X8Q';
    const discordData = {
      username: 'Auto Exotic Orders',
      embeds: [{
        title: 'New Service Order',
        description: `Order submitted by ${employeeName}`,
        color: 0x00ff00,
        fields: [
          { name: 'Total', value: `$${totalValue.toFixed(2)}`, inline: true },
          { name: 'Commission', value: `$${commission.toFixed(2)}`, inline: true },
          { name: 'Discount', value: `${discount}%`, inline: true },
          { 
            name: 'Items Ordered', 
            value: orderedItems.map(item => 
              `• ${item.quantity}x ${item.name} ($${item.price.toFixed(2)} each)`
            ).join('\n') 
          }
        ],
        timestamp: new Date().toISOString()
      }]
    };

    // Send to Discord
    $.ajax({
      url: discordWebhookURL,
      type: 'POST',
      data: JSON.stringify(discordData),
      contentType: 'application/json',
      success: function() {
        alert('Order submitted successfully!');
        saveOrder(formData);
        resetForm();
      },
      error: function(xhr, status, error) {
        console.error('Discord webhook error:', status, error);
        alert('Order saved locally but failed to send to Discord. Check console for details.');
        saveOrder(formData);
        resetForm();
      }
    });
  };

// ... [rest of the code remains exactly the same]