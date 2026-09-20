import { db, collection, addDoc, getDocs } from './firebase-config.js';
import { auth, onAuthStateChanged } from './firebase-config.js';

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let productsData = [];
let currentUser = null;

// التحقق من تسجيل الدخول
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadUserData(user.uid);
    } else {
        alert('يجب تسجيل الدخول أولاً!');
        window.location.href = 'login.html';
    }
});

async function loadUserData(uid) {
    const snapshot = await getDocs(collection(db, "users"));
    snapshot.forEach((doc) => {
        if (doc.data().uid === uid) {
            const data = doc.data();
            document.getElementById('fullName').value = data.name || '';
            document.getElementById('phone').value = data.phone || '';
        }
    });
}

// تحميل المنتجات
async function loadProducts() {
    const snapshot = await getDocs(collection(db, "products"));
    snapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() });
    });
    renderOrderItems();
}

function renderOrderItems() {
    const container = document.getElementById('orderItems');
    let total = 0;
    
    if (cart.length === 0) {
        container.innerHTML = '<p>السلة فارغة!</p>';
        return;
    }
    
    container.innerHTML = '';
    cart.forEach(item => {
        const product = productsData.find(p => p.id === item.id);
        if (!product) return;
        
        const itemTotal = product.price * item.quantity;
        total += itemTotal;
        
        container.innerHTML += `
            <div class="order-item">
                <img src="${product.image}" onerror="this.src='https://via.placeholder.com/60'">
                <div class="order-item-info">
                    <h4>${product.name}</h4>
                    <div>الكمية: ${item.quantity}</div>
                </div>
                <div class="price">${itemTotal.toFixed(2)} ر.س</div>
            </div>
        `;
    });
    
    document.getElementById('totalPrice').textContent = total.toFixed(2);
}

// اختيار طريقة الدفع
document.querySelectorAll('.payment-option').forEach(option => {
    option.addEventListener('click', function() {
        document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        this.querySelector('input').checked = true;
    });
});

// إرسال الطلب
document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (cart.length === 0) {
        alert('السلة فارغة!');
        return;
    }
    
    const order = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        customerName: document.getElementById('fullName').value,
        phone: document.getElementById('phone').value,
        city: document.getElementById('city').value,
        address: document.getElementById('address').value,
        paymentMethod: document.querySelector('input[name="payment"]:checked').value,
        items: cart.map(item => {
            const product = productsData.find(p => p.id === item.id);
            return {
                productId: item.id,
                name: product.name,
                price: product.price,
                quantity: item.quantity
            };
        }),
        total: Number(document.getElementById('totalPrice').textContent),
        status: 'pending',
        createdAt: new Date()
    };
    
    try {
        await addDoc(collection(db, "orders"), order);
        localStorage.removeItem('cart');
        alert('✅ تم تأكيد طلبك بنجاح! سنتواصل معك قريباً.');
        window.location.href = 'index.html';
    } catch (error) {
        alert('حدث خطأ: ' + error.message);
    }
});

loadProducts();
