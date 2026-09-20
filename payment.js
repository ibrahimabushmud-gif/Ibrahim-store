import { db, collection, addDoc } from './firebase-config.js';

const orderData = JSON.parse(localStorage.getItem('pendingOrder'));

if (!orderData) {
    document.body.innerHTML = '<div style="text-align:center; padding:50px;"><h2>لا يوجد طلب</h2><a href="index.html" style="color:var(--primary-color);">العودة للمتجر</a></div>';
} else {
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
        <h3> ملخص الطلب</h3>
        ${itemsHtml}
        ${paymentInfo}
        <div class="summary-row"><span>المجموع الكلي</span><span>${orderData.total.toFixed(2)} ر.س</span></div>
    `;

    document.getElementById('cardNumber').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '');
        let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formatted;
    });

    document.getElementById('cardExpiry').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
        e.target.value = value;
    });
}

window.processPayment = function() {
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCVV = document.getElementById('cardCVV').value;
    const cardName = document.getElementById('cardName').value;

    if (!cardNumber || !cardExpiry || !cardCVV || !cardName) {
        alert('⚠️ الرجاء ملء جميع بيانات البطاقة');
        return;
    }

    if (cardNumber.length < 13) {
        alert('️ رقم البطاقة غير صحيح');
        return;
    }

    addDoc(collection(db, "orders"), {
        ...orderData,
        cardLast4: cardNumber.slice(-4),
        paymentStatus: 'completed',
        paidAt: new Date()
    }).then(() => {
        localStorage.removeItem('pendingOrder');
        localStorage.removeItem('cart');
        alert('✅ تم الدفع بنجاح! شكراً لطلبك.');
        window.location.href = 'index.html';
    }).catch(err => {
        alert('حدث خطأ: ' + err.message);
    });
};
