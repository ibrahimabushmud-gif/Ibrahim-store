import { db, collection, getDocs } from './firebase-config.js';
import { auth, signOut, onAuthStateChanged } from './firebase-config.js';

const productsContainer = document.getElementById('products-container');
const sidebarCategories = document.getElementById('sidebarCategories');
const bannersContainer = document.getElementById('bannersContainer');
const cartCountEl = document.getElementById('cartCount');
const userMenuEl = document.getElementById('userMenu');

let allProducts = [];
let allCategories = [];
let currentCategory = 'all';
const ADMIN_EMAIL = 'ibrahimabushmud@gmail.com';

onAuthStateChanged(auth, (user) => {
    if (user) {
        // التحقق من أن المستخدم هو المدير فقط
        if (user.email === ADMIN_EMAIL) {
            userMenuEl.innerHTML = `
                <a href="admin.html" style="margin-right:15px; color:#666; text-decoration:none;">⚙️ الإدارة</a>
                <button onclick="logout()" style="background:none; border:none; color:var(--primary-color); cursor:pointer; font-family:'Tajawal'; font-weight:bold;">خروج</button>
            `;
        } else {
            // مستخدم عادي - لا يظهر له رابط الإدارة
            userMenuEl.innerHTML = `
                <span style="margin-right:15px; color:#666;">مرحباً، ${user.email}</span>
                <button onclick="logout()" style="background:none; border:none; color:var(--primary-color); cursor:pointer; font-family:'Tajawal'; font-weight:bold;">خروج</button>
            `;
        }
    } else {
        userMenuEl.innerHTML = `
            <a href="login.html" style="margin-right:15px; color:#666; text-decoration:none;">دخول</a>
            <a href="register.html" style="color:var(--primary-color); text-decoration:none;">تسجيل</a>
        `;
    }
});


window.logout = async function() { await signOut(auth); window.location.reload(); };

window.toggleCategories = function() {
    document.getElementById('categoriesSidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('show');
};

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountEl.textContent = `🛒 السلة (${count})`;
}

window.addToCart = function(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const qtyInput = document.getElementById(`qty-${productId}`);
    const quantity = parseInt(qtyInput.value) || 1;
    
    let selectedColor = 'افتراضي';
    const colorBtns = document.querySelectorAll(`.color-btn-${productId}`);
    colorBtns.forEach(btn => {
        if (btn.classList.contains('selected')) selectedColor = btn.getAttribute('data-color');
    });

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemId = `${productId}_${selectedColor}`;
    const existing = cart.find(item => item.id === cartItemId);
    
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ id: cartItemId, productId, name: product.name, price: product.price, image: product.image, color: selectedColor, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert(`✅ تمت إضافة ${quantity} x ${product.name} (${selectedColor}) للسلة!`);
};

window.changeQty = function(productId, delta) {
    const input = document.getElementById(`qty-${productId}`);
    let val = parseInt(input.value) || 1;
    val += delta;
    if (val < 1) val = 1;
    input.value = val;
};

window.selectColor = function(productId, colorName, btnElement) {
    document.querySelectorAll(`.color-btn-${productId}`).forEach(btn => btn.classList.remove('selected'));
    btnElement.classList.add('selected');
};

async function loadBanners() {
    const snapshot = await getDocs(collection(db, "banners"));
    bannersContainer.innerHTML = '';
    if (snapshot.empty) {
        bannersContainer.innerHTML = '<div style="background:#eee; height:200px; border-radius:12px; display:flex; align-items:center; justify-content:center; width:100%;"><h2>عروض حصرية</h2></div>';
        return;
    }
    snapshot.forEach((doc) => {
        const banner = doc.data();
        if (banner.isActive) {
            bannersContainer.innerHTML += `<img src="${banner.imageUrl}" class="banner-img" alt="banner">`;
        }
    });
}

async function loadCategories() {
    const snapshot = await getDocs(collection(db, "categories"));
    allCategories = [];
    snapshot.forEach((doc) => allCategories.push({ id: doc.id, ...doc.data() }));
    
    sidebarCategories.innerHTML = '<div class="category-item active" data-category="all" onclick="filterCategory(\'all\')">🏠 الكل</div>';
    allCategories.forEach(cat => {
        sidebarCategories.innerHTML += `<div class="category-item" data-category="${cat.name}" onclick="filterCategory('${cat.name}')">${cat.name}</div>`;
    });
}

window.filterCategory = function(category) {
    currentCategory = category;
    document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    renderProducts();
    toggleCategories();
};

async function loadProducts() {
    const snapshot = await getDocs(collection(db, "products"));
    allProducts = [];
    snapshot.forEach((doc) => allProducts.push({ id: doc.id, ...doc.data() }));
    renderProducts();
}

function renderProducts() {
    const filtered = currentCategory === 'all' ? allProducts : allProducts.filter(p => p.category === currentCategory);
    productsContainer.innerHTML = '';
    
    if (filtered.length === 0) {
        productsContainer.innerHTML = '<p style="padding:20px; grid-column: 1/-1;">لا توجد منتجات في هذا القسم.</p>';
        return;
    }
    
    filtered.forEach((product) => {
        const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
        
        let colorsHtml = '';
        if (product.hasColors && product.colors) {
            const colorsArray = product.colors.split(',').map(c => c.trim());
            colorsHtml = `<div class="color-options">`;
            colorsArray.forEach((color, index) => {
                const isSelected = index === 0 ? 'selected' : '';
                colorsHtml += `<button class="color-btn color-btn-${product.id} ${isSelected}" data-color="${color}" onclick="selectColor('${product.id}', '${color}', this)" title="${color}"></button>`;
            });
            colorsHtml += `</div>`;
        }

        productsContainer.innerHTML += `
            <div class="product-card">
                ${discount > 0 ? `<div class="discount-badge">خصم ${discount}%</div>` : ''}
                <img src="${product.image}" class="product-image" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                <div class="product-title">${product.name}</div>
                <small style="color:#999">${product.category || ''}</small>
                ${product.oldPrice ? `<div class="old-price">${product.oldPrice} ر.س</div>` : ''}
                <div class="new-price">${product.price} ر.س</div>
                
                <div class="product-options">
                    ${colorsHtml}
                    <div class="qty-selector">
                        <button class="qty-btn" onclick="changeQty('${product.id}', -1)">-</button>
                        <input type="number" id="qty-${product.id}" class="qty-input" value="1" min="1" readonly>
                        <button class="qty-btn" onclick="changeQty('${product.id}', 1)">+</button>
                    </div>
                </div>
                
                <button class="add-to-cart" onclick="addToCart('${product.id}')">أضف للسلة</button>
            </div>
        `;
    });
}

updateCartCount();
loadBanners();
loadCategories();
loadProducts();
