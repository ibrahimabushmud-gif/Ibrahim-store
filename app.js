import { db, collection, getDocs } from './firebase-config.js';
import { auth, signOut, onAuthStateChanged } from './firebase-config.js';

const productsContainer = document.getElementById('products-container');
const categoriesContainer = document.getElementById('categoriesContainer');
const cartCountEl = document.getElementById('cartCount');
const userMenuEl = document.getElementById('userMenu');
let allProducts = [];
let allCategories = [];
let currentCategory = 'all';

// التحقق من حالة المستخدم
onAuthStateChanged(auth, (user) => {
    if (user) {
        userMenuEl.innerHTML = `
            <a href="admin.html" style="margin-right:15px; color:#666; text-decoration:none;">⚙️ لوحة التحكم</a>
            <button onclick="logout()" style="background:none; border:none; color:var(--primary-color); cursor:pointer; font-family:'Tajawal'; font-weight:bold;">خروج</button>
        `;
    } else {
        userMenuEl.innerHTML = `
            <a href="login.html" style="margin-right:15px; color:#666; text-decoration:none;">دخول</a>
            <a href="register.html" style="color:var(--primary-color); text-decoration:none;">تسجيل</a>
        `;
    }
});

window.logout = async function() {
    await signOut(auth);
    alert('تم تسجيل الخروج');
    window.location.reload();
};

// تحديث عداد السلة
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountEl.textContent = `🛒 السلة (${count})`;
}

// إضافة للسلة
window.addToCart = function(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existing = cart.find(item => item.id === productId);
    
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ id: productId, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert('✅ تم إضافة المنتج للسلة!');
};

// تحميل التصنيفات
async function loadCategories() {
    const snapshot = await getDocs(collection(db, "categories"));
    allCategories = [];
    snapshot.forEach((doc) => {
        allCategories.push({ id: doc.id, ...doc.data() });
    });
    
    categoriesContainer.innerHTML = '<div class="category-item active" data-category="all" onclick="filterCategory(\'all\')">الكل</div>';
    allCategories.forEach(cat => {
        categoriesContainer.innerHTML += `<div class="category-item" data-category="${cat.name}" onclick="filterCategory('${cat.name}')">${cat.name}</div>`;
    });
}

// فلترة حسب القسم
window.filterCategory = function(category) {
    currentCategory = category;
    document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    renderProducts();
};

// تحميل المنتجات
async function loadProducts() {
    const snapshot = await getDocs(collection(db, "products"));
    allProducts = [];
    snapshot.forEach((doc) => {
        allProducts.push({ id: doc.id, ...doc.data() });
    });
    renderProducts();
}

// عرض المنتجات
function renderProducts() {
    const filtered = currentCategory === 'all' 
        ? allProducts 
        : allProducts.filter(p => p.category === currentCategory);
    
    productsContainer.innerHTML = '';
    
    if (filtered.length === 0) {
        productsContainer.innerHTML = '<p style="padding:20px">لا توجد منتجات في هذا القسم.</p>';
        return;
    }
    
    filtered.forEach((product) => {
        const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
        productsContainer.innerHTML += `
            <div class="product-card">
                ${discount > 0 ? `<div class="discount-badge">خصم ${discount}%</div>` : ''}
                <img src="${product.image}" class="product-image" onerror="this.src='https://via.placeholder.com/200?text=No+Image'">
                <div class="product-title">${product.name}</div>
                <small style="color:#999">${product.category || ''}</small>
                ${product.oldPrice ? `<div class="old-price">${product.oldPrice} ر.س</div>` : ''}
                <div class="new-price">${product.price} ر.س</div>
                <button class="add-to-cart" onclick="addToCart('${product.id}')">أضف للسلة</button>
            </div>
        `;
    });
}

const style = document.createElement('style');
style.textContent = `.category-item.active { background: var(--primary-color); color: white; }`;
document.head.appendChild(style);

updateCartCount();
loadCategories();
loadProducts();
