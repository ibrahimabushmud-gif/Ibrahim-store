let cart = JSON.parse(localStorage.getItem('cart')) || [];
let cartCountEl = document.getElementById('cartCount');
let cartItemsEl = document.getElementById('cartItems');
let checkoutSection = document.getElementById('checkoutSection');
let totalAmount = 0;
let selectedPayment = 'full';
let selectedDownPayment = 0;
let selectedMonths = 0;
let selectedMonthlyPayment = 0;

const curr = '<img src="https://upload.wikimedia.org/wikipedia/commons/e/ee/UAE_Dirham_Symbol.svg" style="height:16px; vertical-align:middle; margin-left:4px;">';
const currLarge = '<img src="https://upload.wikimedia.org/wikipedia/commons/e/ee/UAE_Dirham_Symbol.svg" style="height:24px; vertical-align:middle; margin-left:5px;">';

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
                    <div class="price">${curr}${item.price}</div>
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
    document.getElementById('totalAmount').innerHTML = currLarge + totalAmount.toFixed(2);
    checkoutSection.style.display = 'block';
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
    document.querySelectorAll('.payment-method-row').forEach(el => el.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    
    const installmentOptions = document.getElementById('installmentOptions');
    const installmentTitle = document.getElementById('installmentTitle');
    const monthsSection = document.getElementById('monthsSection');
    
    if (type === 'installment') {
        installmentOptions.style.display = 'block';
        installmentTitle.textContent = 'اختر قيمة الدفعة الأولى *';
        monthsSection.style.display = 'block';
        createDownPaymentOptions();
        createMonthsOptions();
        document.getElementById('installmentTable').innerHTML = '';
        document.getElementById('monthlyCalc').style.display = 'none';
    } else if (type === 'tamara') {
        installmentOptions.style.display = 'block';
        installmentTitle.textContent = 'تفاصيل Tamara';
        monthsSection.style.display = 'none';
        selectedDownPayment = 1000;
        selectedMonths = 12;
        selectedMonthlyPayment = (totalAmount - 1000) / 12;
        
        document.getElementById('downPaymentOptions').innerHTML = `<div style="background:white; padding:15px; border-radius:10px; width:100%;"><p style="margin:0; color:var(--primary-color); font-weight:bold;">💜 Tamara: دفعة أولى 1000 + 12 قسط شهري</p></div>`;
        document.getElementById('monthlyCalc').style.display = 'block';
        document.getElementById('monthlyAmount').innerHTML = curr + selectedMonthlyPayment.toFixed(2);
        
        let tableHtml = '<table class="installment-table"><thead><tr><th>#</th><th>نوع الدفعة</th><th>التاريخ</th><th>المبلغ</th></tr></thead><tbody>';
        tableHtml += `<tr style="background:#F3E5F5;"><td>1</td><td>💰 الدفعة الأولى (الآن)</td><td>${getFutureDate(0)}</td><td><b>${curr}${selectedDownPayment.toFixed(2)}</b></td></tr>`;
        for (let i = 1; i <= 12; i++) {
            tableHtml += `<tr><td>${i + 1}</td><td>📅 قسط شهري</td><td>${getFutureDate(i)}</td><td>${curr}${selectedMonthlyPayment.toFixed(2)}</td></tr>`;
        }
        tableHtml += '</tbody></table>';
        document.getElementById('installmentTable').innerHTML = tableHtml;
    } else if (type === 'tabby') {
        installmentOptions.style.display = 'block';
        installmentTitle.textContent = 'تفاصيل Tabby';
        monthsSection.style.display = 'none';
        selectedDownPayment = totalAmount / 4;
        selectedMonths = 4;
        selectedMonthlyPayment = selectedDownPayment;
        
        document.getElementById('downPaymentOptions').innerHTML = `<div style="background:white; padding:15px; border-radius:10px; width:100%;"><p style="margin:0; color:var(--primary-color); font-weight:bold;">💳 Tabby: 4 دفعات متساوية</p><p style="margin:5px 0 0 0; color:#666; font-size:14px;">الدفعة الأولى تدفع الآن، و3 أقساط شهرية</p></div>`;
        document.getElementById('monthlyCalc').style.display = 'block';
        document.getElementById('monthlyAmount').innerHTML = curr + selectedMonthlyPayment.toFixed(2);
        
        let tableHtml = '<table class="installment-table"><thead><tr><th>#</th><th>نوع الدفعة</th><th>التاريخ</th><th>المبلغ</th></tr></thead><tbody>';
        tableHtml += `<tr style="background:#F3E5F5;"><td>1</td><td>💰 الدفعة الأولى (الآن)</td><td>${getFutureDate(0)}</td><td><b>${curr}${selectedDownPayment.toFixed(2)}</b></td></tr>`;
        for (let i = 1; i <= 3; i++) {
            tableHtml += `<tr><td>${i + 1}</td><td>📅 قسط شهري</td><td>${getFutureDate(i)}</td><td>${curr}${selectedMonthlyPayment.toFixed(2)}</td></tr>`;
        }
        tableHtml += '</tbody></table>';
        document.getElementById('installmentTable').innerHTML = tableHtml;
    } else {
        installmentOptions.style.display = 'none';
    }
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
            // استخدام innerHTML بدلاً من textContent لعرض الصورة
            btn.innerHTML = curr + amount;
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
    select.innerHTML = '<option value="">-- اختر عدد الأشهر --</option>';
    for (let i = 3; i <= 24; i++) {
        select.innerHTML += `<option value="${i}">${i} شهر</option>`;
    }
}

window.calculateInstallments = function() {
    selectedMonths = parseInt(document.getElementById('monthsSelect').value) || 0;
    if (!selectedDownPayment || !selectedMonths) {
        document.getElementById('installmentTable').innerHTML = '';
        document.getElementById('monthlyCalc').style.display = 'none';
        return;
    }
    const remaining = totalAmount - selectedDownPayment;
    selectedMonthlyPayment = remaining / selectedMonths;
    
    document.getElementById('monthlyCalc').style.display = 'block';
    document.getElementById('monthlyAmount').innerHTML = curr + selectedMonthlyPayment.toFixed(2);
    
    let tableHtml = '<table class="installment-table"><thead><tr><th>#</th><th>نوع الدفعة</th><th>التاريخ</th><th>المبلغ</th></tr></thead><tbody>';
    tableHtml += `<tr style="background:#F3E5F5;"><td>1</td><td>💰 الدفعة الأولى</td><td>${getFutureDate(0)}</td><td><b>${curr}${selectedDownPayment.toFixed(2)}</b></td></tr>`;
    for (let i = 1; i <= selectedMonths; i++) {
        tableHtml += `<tr><td>${i + 1}</td><td>📅 قسط شهري</td><td>${getFutureDate(i)}</td><td>${curr}${selectedMonthlyPayment.toFixed(2)}</td></tr>`;
    }
    tableHtml += '</tbody></table>';
    document.getElementById('installmentTable').innerHTML = tableHtml;
};

function getFutureDate(monthsFromNow) {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsFromNow);
    return date.toLocaleDateString('ar-AE');
}

window.proceedToPayment = async function() {
    const name = document.getElementById('custName').value.trim();
    const nationalId = document.getElementById('custId').value.trim();
    const email = document.getElementById('custEmail').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const city = document.getElementById('custCity').value.trim();
    const district = document.getElementById('custDistrict').value.trim();

    if (!name || !nationalId || !email || !phone || !city || !district) {
        alert('⚠️ الرجاء ملء جميع البيانات المطلوبة');
        return;
    }
    if (selectedPayment === 'installment' && (!selectedDownPayment || !selectedMonths)) {
        alert('⚠️ الرجاء اختيار الدفعة الأولى وعدد الأشهر');
        return;
    }

    const fullPhone = '+971' + phone;
    const orderId = Date.now().toString().slice(-8);
    const baseUrl = window.location.origin + '/Ibrahim-store';

    // ملاحظة: نستخدم "د.إ" كنص في تلجرام لأنه لا يدعم صور HTML
    let message = `🛍️ <b>طلب جديد من المتجر</b>\n\n📋 <b>رقم الطلب:</b> #${orderId}\n\n<b>بيانات الزبون</b>\n👤 <b>الاسم:</b> ${name}\n🆔 <b>رقم الهوية:</b> ${nationalId}\n📧 <b>البريد:</b> ${email}\n📱 <b>واتساب:</b> ${fullPhone}\n📍 <b>المدينة:</b> ${city}\n🏘️ <b>الحي:</b> ${district}\n\n<b>إجمالي:</b> ${totalAmount.toFixed(2)} د.إ\n`;
    
    if (selectedPayment === 'installment') {
        message += `💳 <b>طريقة الدفع:</b> تقسيط المتجر\n💰 <b>الدفعة الأولى:</b> ${selectedDownPayment} د.إ\n📅 <b>عدد الأشهر:</b> ${selectedMonths} شهر\n💵 <b>القسط الشهري:</b> ${selectedMonthlyPayment.toFixed(2)} د.إ\n`;
    } else if (selectedPayment === 'tamara') {
        message += `💳 <b>طريقة الدفع:</b> Tamara\n💰 <b>الدفعة الأولى:</b> 1000 د.إ\n📅 <b>عدد الأشهر:</b> 12 شهر\n💵 <b>القسط الشهري:</b> ${selectedMonthlyPayment.toFixed(2)} د.إ\n`;
    } else if (selectedPayment === 'tabby') {
        message += `💳 <b>طريقة الدفع:</b> Tabby\n💰 <b>الدفعة الأولى (الآن):</b> ${selectedDownPayment.toFixed(2)} د.إ\n📅 <b>الأقساط المتبقية:</b> 3 أقساط شهرية\n💵 <b>قيمة كل قسط:</b> ${selectedMonthlyPayment.toFixed(2)} د.إ\n`;
    } else {
        message += `💳 <b>طريقة الدفع:</b> دفع كامل\n`;
    }
    
    message += `\n📦 <b>المنتجات:</b>\n`;
    cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name} (${item.color})\n   الكمية: ${item.quantity} × ${item.price} = ${(item.price * item.quantity).toFixed(2)} د.إ\n`;
    });
    message += `\n💰 <b>المجموع الكلي:</b> ${totalAmount.toFixed(2)} د.إ\n\n<b>الروابط:</b>\n📄 <b>الفاتورة:</b> ${baseUrl}/invoice.html?id=${orderId}\n💵 <b>سند قبض:</b> ${baseUrl}/receipt.html?id=${orderId}\n`;
    if (selectedPayment === 'installment' || selectedPayment === 'tamara' || selectedPayment === 'tabby') {
        message += `📝 <b>عقد التقسيط:</b> ${baseUrl}/contract.html?id=${orderId}\n`;
    }

    try {
        const telegramResponse = await fetch(`https://api.telegram.org/bot8763567744:AAEjPuOYFJAHMQspuLqODgYrlTqU6W61hpI/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: '8214447975', text: message, parse_mode: 'HTML' })
        });
        const telegramData = await telegramResponse.json();
        if (!telegramData.ok) { alert('⚠️ فشل إرسال البيانات للتلجرام: ' + telegramData.description); return; }
    } catch (error) {
        alert('⚠️ حدث خطأ في الاتصال: ' + error.message);
        return;
    }

    const orderData = { orderId, customerName: name, nationalId, email, phone: fullPhone, city, district, items: cart, total: totalAmount, paymentMethod: selectedPayment, downPayment: selectedDownPayment, monthlyPayment: selectedMonthlyPayment, months: selectedMonths, status: 'pending', createdAt: new Date() };
    localStorage.setItem('pendingOrder', JSON.stringify(orderData));
    
    alert('✅ تم إرسال طلبك بنجاح! سيتم تحويلك لصفحة الدفع.');
    window.location.href = 'payment.html';
};

console.log('✅ cart.js تم تحميله بنجاح');
updateCartCount();
renderCart();
