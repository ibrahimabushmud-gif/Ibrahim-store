import { db, collection, getDocs } from './firebase-config.js';

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let productsData = [];

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const el = document.getElementById('cartCount');
    if (el) el.textContent = ` السلة (${count})`;
}

async function loadProducts() {
    const querySnapshot = await getDocs(collection(db, "products"));
    querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() });
    });
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cartItems');
    const summary = document.getElementById('cartSummary');
    
    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-cart"><h3>🛒 السلة فارغة</h3><p>أضف منتجات من المتجر</p></div>';
        summary.style.display = 'none';
        updateCartCount();
        return;
    }

    let total = 0;
    container.innerHTML = '';
    
    cart.forEach((item, index) => {
        const product = productsData.find(p => p.id === item.id);
        if (!product) return;
        
        const itemTotal = product.price * item.quantity;
        total += itemTotal;
        
        container.innerHTML += `
            <div class="cart-item">
                <img src="${product.image}" onerror="this.src='https://via.placeholder.com/80'">
                <div class="cart-item-info">
                    <h3>${product.name}</h3>
                    <div class="price">${product.price} ر.س</div>
                </div>
                <div class="quantity-controls">
                    <button onclick="changeQty(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQty(${index}, 1)">+</button>
                </div>
                <button class="btn-remove" onclick="removeItem(${index})">حذف</button>
            </div>
        `;
    });
    
    document.getElementById('totalPrice').textContent = total.toFixed(2);
    summary.style.display = 'block';
    updateCartCount();
}

window.changeQty = function(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
};

window.removeItem = function(index) {
    if (confirm('حذف هذا المنتج من السلة؟')) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }
};

window.goToCheckout = function() {
    window.location.href = 'checkout.html';
};

updateCartCount();
loadProducts();
