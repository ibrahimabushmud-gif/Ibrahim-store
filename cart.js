let cart = JSON.parse(localStorage.getItem('cart')) || [];
let cartCountEl = document.getElementById('cartCount');
let cartItemsEl = document.getElementById('cartItems');
let checkoutSection = document.getElementById('checkoutSection');
let totalAmount = 0;
let selectedPayment = 'full';
let selectedDownPayment = 0;
let selectedMonths = 0;
let selectedMonthlyPayment = 0;

// قائمة الدول المبسطة
const countriesList = [
    { name: 'فلسطين', dial: '+970' },
    { name: 'السعودية', dial: '+966' },
    { name: 'الإمارات', dial: '+971' },
    { name: 'الكويت', dial: '+965' },
    { name: 'قطر', dial: '+974' },
    { name: 'البحرين', dial: '+973' },
    { name: 'عُمان', dial: '+968' },
    { name: 'الأردن', dial: '+962' },
    { name: 'مصر', dial: '+20' },
    { name: 'العراق', dial: '+964' },
    { name: 'لبنان', dial: '+961' },
    { name: 'سوريا', dial: '+963' },
    { name: 'اليمن', dial: '+967' },
    { name: 'ليبيا', dial: '+218' },
    { name: 'تونس', dial: '+216' },
    { name: 'الجزائر', dial: '+213' },
    { name: 'المغرب', dial: '+212' },
    { name: 'السودان', dial: '+249' },
    { name: 'الولايات المتحدة', dial: '+1' },
    { name: 'بريطانيا', dial: '+44' },
    { name: 'تركيا', dial: '+90' }
];

// ملء قائمة الدول
function populateCountries() {
    const select = document.getElementById('custCountry');
    if (!select) return;
    
    countriesList.forEach(country => {
        const option = document.createElement('option');
        option.value = country.dial;
        option.textContent = `${country.name} (${country.dial})`;
        select.appendChild(option);
    });
    
    select.value = '+970';
}

window.updatePhonePrefix = function() {
    const select = document.getElementById('custCountry');
    const prefixInput = document.getElementById('phonePrefix');
    if (select && prefixInput) {
        prefixInput.value = select.value;
    }
};

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountEl) cartCountEl.textContent = count;
}

function renderCart() {
    if (cart.length === 0) {
        cartItemsEl.innerHTML = '<div style="text-align:center; padding:50px;"><h3>🛒 السلة فارغة</h3><p>أضف منتجات للبدء</p><button onclick="window.location.href=\'index.html\'" style="background:var(--primary-color); color:white; border:none; padding:15px 40px; border-radius:25px; font-family:Tajawal; font-weight:bold; margin-top:20px; cursor:pointer;">تصفح المنتجات</button></div>';
        checkoutSection.style.display = 'none';
        return;
    }

    totalAmount = 0;
    let html = '';
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;
        html += `
            <div class="cart-item-full">
                <img src="${item.image}" onerror="this.src='https://via.placeholder.com/100'">
                <div class="cart-item-full-info">
                    <h3>${item.name}</h3>
                    <span class="color-tag">${item.color}</span>
                    <div class="price">${item.price} ر.س</div>
                </div>
                <div class="qty-controls-full">
                    <button onclick="updateQty(${index}, 1)">+</button>
                    <span style="font-weight:bold; min-width:30px; text-align:center;">${item.quantity}</span>
                    <button onclick="updateQty(${index}, -1)">−</button>
                </div>
                <button class="remove-btn-full" onclick="removeItem(${index})">حذف</button>
            </div>
        `;
    });

    cartItemsEl.innerHTML = html;
    document.getElementById('totalAmount').textContent = totalAmount.toFixed(2) + ' ر.س';
    checkoutSection.style.display = 'block';
    
    createDownPaymentOptions();
    createMonthsOptions();
    createMonthlyPaymentOptions();
}

window.updateQty = function(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity < 1) cart[index].quantity = 1;
    if (cart[index].quantity > 10) cart[index].quantity = 10;
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
};

window.removeItem = function(index) {
    if (confirm('حذف هذا المنتج؟')) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        renderCart();
    }
};

window.selectPayment = function(type) {
    selectedPayment = type;
    document.querySelectorAll('.payment-method').forEach(el => el.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    document.getElementById('installmentOptions').classList.toggle('show', type === 'installment');
};

function createDownPaymentOptions() {
    const options = [1000, 1500, 2000];
    const container = document.getElementById('downPaymentOptions');
    if (!container) return;
    container.innerHTML = '';
    options.forEach(amount => {
        if (amount < totalAmount) {
            const btn = document.createElement('button');
            btn.className = 'down-payment-btn';
            btn.textContent = amount + ' ر.س';
            btn.onclick = function() {
                document.querySelectorAll('.down-payment-btn').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                selectedDownPayment = amount;
                calculateInstallments();
            };
            container.appendChild(btn);
        }
    });
}

function createMonthsOptions() {
    const select = document.getElementById('monthsSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- يُحسب تلقائياً --</option>';
    for (let i = 1; i <= 24; i++) {
        select.innerHTML += `<option value="${i}">${i} شهر</option>`;
    }
}

function createMonthlyPaymentOptions() {
    const container = document.getElementById('monthlyPaymentOptions');
    if (!container) return;
    container.innerHTML = '';
    
    const remaining = totalAmount - selectedDownPayment;
    if (remaining <= 0) return;
    
    const baseMonthly = remaining / 12;
    const options = [baseMonthly * 0.5, baseMonthly * 0.75, baseMonthly, baseMonthly * 1.5, baseMonthly * 2];
    
    options.forEach(amount => {
        if (amount > 0 && amount < remaining) {
            const btn = document.createElement('button');
            btn.className = 'monthly-payment-btn';
            btn.textContent = Math.round(amount) + ' ر.س/شهر';
            btn.onclick = function() {
                document.querySelectorAll('.monthly-payment-btn').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                selectedMonthlyPayment = Math.round(amount);
                calculateInstallments();
            };
            container.appendChild(btn);
        }
    });
    
    const customInput = document.createElement('div');
    customInput.style.marginTop = '15px';
    customInput.innerHTML = `
        <label style="display:block; margin-bottom:8px; font-weight:bold;">أو أدخل قيمة مخصصة:</label>
        <input type="number" id="customMonthlyPayment" placeholder="أدخل قيمة القسط الشهري" 
               style="width:100%; padding:12px; border:2px solid var(--primary-color); border-radius:10px; font-family:Tajawal; font-size:16px;"
               oninput="setCustomMonthlyPayment(this.value)">
    `;
    container.appendChild(customInput);
}

window.setCustomMonthlyPayment = function(value) {
    selectedMonthlyPayment = parseFloat(value) || 0;
    document.querySelectorAll('.monthly-payment-btn').forEach(b => b.classList.remove('selected'));
    calculateInstallments();
};

window.calculateInstallments = function() {
    selectedMonths = parseInt(document.getElementById('monthsSelect').value) || 0;
    
    if (!selectedDownPayment || (!selectedMonths && !selectedMonthlyPayment)) {
        document.getElementById('installmentTable').innerHTML = '';
        return;
    }

    const remaining = totalAmount - selectedDownPayment;
    
    if (selectedMonthlyPayment > 0) {
        selectedMonths = Math.ceil(remaining / selectedMonthlyPayment);
        document.getElementById('monthsSelect').value = selectedMonths;
    } else if (selectedMonths > 0) {
        selectedMonthlyPayment = remaining / selectedMonths;
    }
    
    const monthlyPayment = selectedMonthlyPayment || (remaining / selectedMonths);
    
    let tableHtml = '<table class="installment-table"><thead><tr><th>#</th><th>تاريخ الدفعة</th><th>الدفعة (ر.س)</th></tr></thead><tbody>';
    tableHtml += `<tr><td>1</td><td>${getFutureDate(0)}</td><td>${selectedDownPayment.toFixed(2)}</td></tr>`;
    
    for (let i = 1; i <= selectedMonths; i++) {
        const payment = (i === selectedMonths) ? (remaining - (monthlyPayment * (selectedMonths - 1))) : monthlyPayment;
        tableHtml += `<tr><td>${i + 1}</td><td>${getFutureDate(i)}</td><td>${payment.toFixed(2)}</td></tr>`;
    }
    
    tableHtml += '</tbody></table>';
    document.getElementById('installmentTable').innerHTML = tableHtml;
};

function getFutureDate(monthsFromNow) {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsFromNow);
    return date.toLocaleDateString('ar-SA');
}

// ============ دالة متابعة الشراء (المعدلة) ============
window.proceedToPayment = async function() {
    console.log('🔄 بدء proceedToPayment...');
    
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const city = document.getElementById('custCity').value.trim();
    const district = document.getElementById('custDistrict').value.trim();
    const countrySelect = document.getElementById('custCountry');
    const phonePrefix = document.getElementById('phonePrefix').value;

    console.log('البيانات:', { name, phone, city, district, countrySelect: countrySelect?.value });

    if (!countrySelect.value) {
        alert('⚠️ الرجاء اختيار الدولة');
        return;
    }
    if (!name || !phone || !city || !district) {
        alert('⚠️ الرجاء ملء جميع البيانات المطلوبة');
        return;
    }

    if (selectedPayment === 'installment' && (!selectedDownPayment || !selectedMonthlyPayment)) {
        alert('⚠️ الرجاء اختيار الدفعة الأولى والقسط الشهري');
        return;
    }

    const fullPhone = phonePrefix + phone;
    const countryName = countrySelect.options[countrySelect.selectedIndex].text;
    const orderId = Date.now().toString().slice(-8);
    const baseUrl = window.location.origin;

    // بناء رسالة التلجرام
    let message = `🛍️ <b>طلب جديد من المتجر</b>\n\n`;
    message += `📋 <b>رقم الطلب:</b> #${orderId}\n\n`;
    message += `<b>بيانات الزبون</b>\n`;
    message += `👤 <b>الاسم:</b> ${name}\n`;
    message += ` <b>الدولة:</b> ${countryName}\n`;
    message += `📱 <b>واتساب:</b> ${fullPhone}\n`;
    message += `📍 <b>المدينة:</b> ${city}\n`;
    message += `🏘️ <b>الحي:</b> ${district}\n\n`;
    
    message += `<b>إجمالي:</b> ${totalAmount.toFixed(2)} ر.س\n`;
    
    if (selectedPayment === 'installment') {
        message += `💳 <b>طريقة الدفع:</b> تقسيط المتجر\n`;
        message += `💰 <b>الدفعة الأولى:</b> ${selectedDownPayment} ر.س\n`;
        message += `📅 <b>التقسيط على:</b> [${selectedMonths}] شهر [${selectedMonthlyPayment}] ر.س\n`;
    } else {
        message += ` <b>طريقة الدفع:</b> دفع كامل\n`;
    }
    
    message += `\n📦 <b>المنتجات:</b>\n`;
    cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name} (${item.color})\n`;
        message += `   الكمية: ${item.quantity} × ${item.price} = ${(item.price * item.quantity).toFixed(2)} ر.س\n`;
    });
    
    message += `\n💰 <b>المجموع الكلي:</b> ${totalAmount.toFixed(2)} ر.س\n\n`;
    
  message += `<b>الروابط:</b>\n`;
message += `📄 <b>الفاتورة:</b> ${baseUrl}/invoice.html?id=${orderId}\n`;
message += `💵 <b>سند قبض:</b> ${baseUrl}/receipt.html?id=${orderId}\n`;

if (selectedPayment === 'installment') {
    message += `📝 <b>عقد التقسيط:</b> ${baseUrl}/contract.html?id=${orderId}\n`;
}

    console.log('📤 الرسالة:', message);

    // إرسال للتلجرام
    try {
        const telegramResponse = await fetch(`https://api.telegram.org/bot8763567744:AAEjPuOYFJAHMQspuLqODgYrlTqU6W61hpI/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: '8214447975',
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const telegramData = await telegramResponse.json();
        console.log('📤 نتيجة الإرسال:', telegramData);
        
        if (!telegramData.ok) {
            console.error('❌ فشل الإرسال:', telegramData.description);
            alert('⚠️ فشل إرسال البيانات للتلجرام: ' + telegramData.description);
            return;
        }
    } catch (error) {
        console.error('❌ خطأ في الإرسال:', error);
        alert('⚠️ حدث خطأ في الاتصال: ' + error.message);
        return;
    }

    const orderData = {
        orderId,
        customerName: name,
        phone: fullPhone,
        country: countryName,
        city, district,
        items: cart,
        total: totalAmount,
        paymentMethod: selectedPayment,
        downPayment: selectedDownPayment,
        monthlyPayment: selectedMonthlyPayment,
        months: selectedMonths,
        status: 'pending',
        createdAt: new Date()
    };

    localStorage.setItem('pendingOrder', JSON.stringify(orderData));
    
    alert('✅ تم إرسال طلبك بنجاح! سيتم تحويلك لصفحة الدفع.');
    window.location.href = 'payment.html';
};

// تشغيل
console.log('✅ cart.js تم تحميله');
updateCartCount();
populateCountries();
renderCart();
