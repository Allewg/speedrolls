// ========== FUNCIONES DE CHECKOUT ==========

// Función para obtener datos del checkout
function getCheckoutData() {
  const fullName = document.getElementById('fullName')?.value || '';
  const paymentMethod = document.getElementById('paymentMethod')?.value || 'efectivo';
  const btnRetiro = document.getElementById('btnRetiro');
  const deliveryType = btnRetiro && (btnRetiro.classList.contains('bg-white') || btnRetiro.classList.contains('dark:bg-surface-dark')) ? 'retiro' : 'despacho';
  const deliveryAddress = document.getElementById('deliveryAddress')?.value || '';
  const checkoutTotal = document.getElementById('checkoutTotal')?.textContent.trim().replace('$', '').replace(',', '') || '0.00';
  const sauces = getCartSauces();
  const observations = document.getElementById('customerObservations')?.value || '';
  
  return {
    fullName,
    paymentMethod,
    deliveryType,
    deliveryAddress,
    total: parseFloat(checkoutTotal) || 0.00,
    sauces: sauces,
    observations: observations
  };
}

// Función para generar el mensaje de WhatsApp
function generateWhatsAppMessage() {
  const cartItems = getCartItems();
  const cartTotals = getCartTotals();
  const checkoutData = getCheckoutData();
  
  let message = '*🍣 NUEVO PEDIDO - SPEED ROLL 🍣*\n\n';
  
  // Información del cliente
  message += '*👤 CLIENTE:*\n';
  message += `${checkoutData.fullName || 'No especificado'}\n\n`;
  
  // Detalle del pedido
  message += '*📦 PEDIDO:*\n';
  if (cartItems.length === 0) {
    message += 'Carrito vacío\n';
  } else {
    cartItems.forEach((item, index) => {
      message += `${index + 1}. ${item.name} x${item.quantity}\n`;
      
      // Mostrar personalizaciones detalladas
      if (item.customizations) {
        const customParts = [];
        
        // Salsas
        if (item.customizations.sauces && item.customizations.sauces.length > 0) {
          customParts.push(`   🧂 Salsas: ${item.customizations.sauces.join(', ')}`);
        }
        
        // Extras
        if (item.customizations.extras && item.customizations.extras.length > 0) {
          const extraNames = item.customizations.extras.map(e => {
            const names = { 'aguacate': 'Aguacate Extra', 'tempura': 'Hojuelas Tempura', 'jengibre': 'Jengibre Fresco' };
            return names[e] || e;
          });
          customParts.push(`   ➕ Extras: ${extraNames.join(', ')}`);
        }
        
        // Instrucciones especiales
        if (item.customizations.instructions && item.customizations.instructions.trim()) {
          customParts.push(`   📝 Instrucciones: ${item.customizations.instructions}`);
        }
        
        if (customParts.length > 0) {
          message += customParts.join('\n') + '\n';
        }
      } else if (item.extras) {
        // Si no hay customizations detalladas, mostrar extras generales
        message += `   ➜ ${item.extras}\n`;
      }
      
      message += `   💰 $${Math.round(item.price)} c/u = $${Math.round(item.subtotal)}\n\n`;
    });
  }
  
  // Salsas principales por producto
  if (checkoutData.sauces && checkoutData.sauces.productMainSauces && checkoutData.sauces.productMainSauces.length > 0) {
    message += '\n*🧂 SALSAS PRINCIPALES:*\n';
    const sauceNames = {
      'soya': 'Salsa Soya',
      'agridulce': 'Salsa Agridulce'
    };
    
    checkoutData.sauces.productMainSauces.forEach(item => {
      message += `${item.productName}: ${sauceNames[item.sauce] || item.sauce}\n`;
    });
  }
  
  // Salsas adicionales con cantidades
  if (checkoutData.sauces && checkoutData.sauces.extraSauces && checkoutData.sauces.extraSauces.length > 0) {
    message += '\n*🧂 SALSAS ADICIONALES:*\n';
    
    checkoutData.sauces.extraSauces.forEach(sauce => {
      const sauceName = sauce.name || sauce.type || sauce.id;
      const totalPrice = sauce.quantity * sauce.price;
      message += `${sauceName} x${sauce.quantity} = $${totalPrice.toFixed(0)}\n`;
    });
  }
  
  // Observaciones del cliente
  if (checkoutData.observations && checkoutData.observations.trim()) {
    message += '\n*📝 OBSERVACIONES DEL CLIENTE:*\n';
    message += `${checkoutData.observations.trim()}\n`;
  }
  
  // Resumen de totales
  message += '\n*💰 RESUMEN:*\n';
  message += `Subtotal: $${Math.round(cartTotals.subtotal)}\n`;
  
  // Información de entrega
  message += '\n*🚚 ENTREGA:*\n';
  if (checkoutData.deliveryType === 'despacho') {
    message += `Tipo: Despacho a domicilio\n`;
    if (checkoutData.deliveryAddress) {
      message += `Dirección: ${checkoutData.deliveryAddress}\n`;
    }
    message += `Costo de despacho: $3.000\n`;
  } else {
    message += `Tipo: Retiro en local\n`;
  }
  
  // Medio de pago
  message += '\n*💳 PAGO:*\n';
  const paymentMethods = {
    'efectivo': 'Efectivo',
    'tarjeta': 'Tarjeta',
    'transferencia': 'Transferencia'
  };
  message += `${paymentMethods[checkoutData.paymentMethod] || checkoutData.paymentMethod}\n`;
  
  // Total final
  message += `\n*✅ TOTAL: $${Math.round(checkoutData.total)}*\n\n`;
  
  message += '_Gracias por tu pedido_ 🎉';
  
  return message;
}

// Función para enviar mensaje por WhatsApp
function sendWhatsAppMessage(phoneNumber = null) {
  const message = generateWhatsAppMessage();
  const encodedMessage = encodeURIComponent(message);
  
  // Si no se proporciona número, usar WhatsApp Web (el usuario elegirá el contacto)
  // Para usar con número específico: sendWhatsAppMessage('+56912345678')
  const whatsappUrl = phoneNumber 
    ? `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`
    : `https://web.whatsapp.com/send?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
}

// Función para manejar el pago en checkout
function handlePayment() {
  // Validar que haya información mínima
  const checkoutData = getCheckoutData();
  const cartItems = getCartItems();
  
  if (!checkoutData.fullName || checkoutData.fullName.trim() === '') {
    alert('Por favor, ingresa tu nombre completo');
    return;
  }
  
  if (cartItems.length === 0) {
    alert('Tu carrito está vacío');
    return;
  }
  
  if (checkoutData.deliveryType === 'despacho' && (!checkoutData.deliveryAddress || checkoutData.deliveryAddress.trim() === '')) {
    alert('Por favor, ingresa la dirección de despacho');
    return;
  }
  
  // Generar y enviar mensaje de WhatsApp con el número del negocio
  sendWhatsAppMessage('+56921922139');
  
  // Limpiar el carrito
  clearCart();
  
  // Limpiar formulario de checkout
  document.getElementById('fullName').value = '';
  document.getElementById('paymentMethod').value = 'efectivo';
  document.getElementById('deliveryAddress').value = '';
  document.getElementById('customerObservations').value = '';
  toggleDeliveryOption('retiro'); // Resetear a retiro
  
  // Limpiar salsas del carrito
  // Limpiar selectores de salsa principal en cada producto
  const productMainSauceSelects = document.querySelectorAll('.product-main-sauce');
  productMainSauceSelects.forEach(select => {
    select.value = '';
  });
  
  // Limpiar cantidades de salsas adicionales (dinámicas)
  const extraSauceInputs = document.querySelectorAll('input[id^="extraSauce_"]');
  extraSauceInputs.forEach(input => {
    input.value = '0';
  });
  
  // Navegar a la página de confirmación
  setTimeout(() => {
    router.navigate('confirmation');
  }, 500);
}

// Función para alternar entre retiro y despacho
function toggleDeliveryOption(option) {
  const addressSection = document.getElementById('deliveryAddressSection');
  const btnRetiro = document.getElementById('btnRetiro');
  const btnDespacho = document.getElementById('btnDespacho');
  
  if (option === 'despacho') {
    addressSection.classList.remove('hidden');
    btnDespacho.classList.remove('text-gray-500', 'dark:text-gray-400');
    btnDespacho.classList.add('bg-white', 'dark:bg-surface-dark', 'shadow-sm', 'text-primary', 'font-bold');
    btnRetiro.classList.remove('bg-white', 'dark:bg-surface-dark', 'shadow-sm', 'text-primary', 'font-bold');
    btnRetiro.classList.add('text-gray-500', 'dark:text-gray-400', 'font-medium');
    updateCheckoutTotal(true);
  } else {
    addressSection.classList.add('hidden');
    btnRetiro.classList.remove('text-gray-500', 'dark:text-gray-400');
    btnRetiro.classList.add('bg-white', 'dark:bg-surface-dark', 'shadow-sm', 'text-primary', 'font-bold');
    btnDespacho.classList.remove('bg-white', 'dark:bg-surface-dark', 'shadow-sm', 'text-primary', 'font-bold');
    btnDespacho.classList.add('text-gray-500', 'dark:text-gray-400', 'font-medium');
    updateCheckoutTotal(false);
  }
}

// Función para actualizar el total en checkout
function updateCheckoutTotal(hasDelivery) {
  // Calcular el total real del carrito
  const cartItems = getCartItems();
  let baseTotal = 0;
  cartItems.forEach(item => {
    baseTotal += item.subtotal;
  });
  
  // Agregar costo de salsas adicionales (dinámicas)
  let extraSaucesTotal = 0;
  const extraSauceInputs = document.querySelectorAll('input[id^="extraSauce_"]');
  extraSauceInputs.forEach(input => {
    const quantity = parseInt(input.value) || 0;
    const price = parseFloat(input.dataset.saucePrice) || 0;
    extraSaucesTotal += quantity * price;
  });
  baseTotal += extraSaucesTotal;
  
  const deliveryCost = 3000;
  const totalElement = document.getElementById('checkoutTotal');
  
  if (hasDelivery) {
    const newTotal = baseTotal + deliveryCost;
    if (totalElement) {
      totalElement.textContent = `$${Math.round(newTotal)}`;
    }
  } else {
    if (totalElement) {
      totalElement.textContent = `$${Math.round(baseTotal)}`;
    }
  }
}

// Función para actualizar la visualización de salsas en el checkout
function updateCheckoutSauces() {
  const checkoutSaucesContainer = document.getElementById('checkoutSaucesSection');
  if (!checkoutSaucesContainer) return;
  
  const sauces = getCartSauces();
  let html = '';
  
  // Mostrar salsas principales por producto
  if (sauces.productMainSauces && sauces.productMainSauces.length > 0) {
    html += '<div class="mb-3">';
    html += '<p class="text-xs font-medium text-[#836967] dark:text-zinc-400 mb-2">Salsas Principales:</p>';
    const sauceNames = {
      'soya': 'Salsa Soya',
      'agridulce': 'Salsa Agridulce'
    };
    sauces.productMainSauces.forEach(item => {
      html += `<div class="flex items-center justify-between text-sm mb-1">
        <span class="text-[#171212] dark:text-white">${item.productName}</span>
        <span class="text-[#836967] dark:text-zinc-400">${sauceNames[item.sauce] || item.sauce}</span>
      </div>`;
    });
    html += '</div>';
  }
  
  // Mostrar salsas adicionales con cantidades y precios (dinámicas)
  if (sauces.extraSauces && sauces.extraSauces.length > 0) {
    html += '<div>';
    html += '<p class="text-xs font-medium text-[#836967] dark:text-zinc-400 mb-2">Salsas Adicionales:</p>';
    sauces.extraSauces.forEach(sauce => {
      const sauceName = sauce.name || sauce.type || sauce.id;
      const totalPrice = sauce.quantity * sauce.price;
      html += `<div class="flex items-center justify-between text-sm mb-1">
        <span class="text-[#171212] dark:text-white">${sauceName} x${sauce.quantity}</span>
        <span class="text-[#836967] dark:text-zinc-400 font-medium">$${totalPrice.toFixed(0)}</span>
      </div>`;
    });
    html += '</div>';
  }
  
  if (html === '') {
    checkoutSaucesContainer.innerHTML = '<p class="text-xs text-gray-400 dark:text-gray-500">No hay salsas seleccionadas</p>';
  } else {
    checkoutSaucesContainer.innerHTML = html;
  }
}
