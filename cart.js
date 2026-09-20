let cart = JSON.parse(localStorage.getItem('cart')) || [];
let cartCountEl = document.getElementById('cartCount');
let cartItemsEl = document.getElementById('cartItems');
let checkoutSection = document.getElementById('checkoutSection');
let totalAmount = 0;
let selectedPayment = 'full';
let selectedDownPayment = 0;
let selectedMonths = 0;
let selectedMonthlyPayment = 0;

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountEl.textContent = count;
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
    select.innerHTML = '<option value="">-- يُحسب تلقائياً --</option>';
    for (let i = 1; i <= 24; i++) {
        select.innerHTML += `<option value="${i}">${i} شهر</option>`;
    }
}

function createMonthlyPaymentOptions() {
    const container = document.getElementById('monthlyPaymentOptions');
    container.innerHTML = '';
    
    const remaining = totalAmount - selectedDownPayment;
    if (remaining <= 0) return;
    
    const baseMonthly = remaining / 12;
    const options = [
        baseMonthly * 0.5,
        baseMonthly * 0.75,
        baseMonthly,
        baseMonthly * 1.5,
        baseMonthly * 2
    ];
    
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

window.proceedToPayment = function() {
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const city = document.getElementById('custCity').value.trim();
    const district = document.getElementById('custDistrict').value.trim();

    if (!name || !phone || !city || !district) {
        alert('⚠️ الرجاء ملء جميع البيانات المطلوبة');
        return;
    }

    if (selectedPayment === 'installment' && (!selectedDownPayment || !selectedMonthlyPayment)) {
        alert('⚠️ الرجاء اختيار الدفعة الأولى والقسط الشهري');
        return;
    }

    const orderData = {
        customerName: name,
        phone, city, district,
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
    window.location.href = 'payment.html';
};

updateCartCount();
renderCart();
