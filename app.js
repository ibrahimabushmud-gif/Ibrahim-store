9import { db, collection, getDocs } from './firebase-config.js';
import { auth, signOut, onAuthStateChanged } from './firebase-config.js';

const sidebarCategories = document.getElementById('sidebarCategories');
const bannersContainer = document.getElementById('bannersContainer');
const cartCountEl = document.getElementById('cartCount');
const userMenuEl = document.getElementById('userMenu');
const productsByCategoryContainer = document.getElementById('productsByCategory');
const cartDrawer = document.getElementById('cartDrawer');
const cartContent = document.getElementById('cartContent');
const cartTotalEl = document.getElementById('cartTotal');

const ADMIN_EMAIL = 'ibrahimabushmud@gmail.com';
const WHATSAPP_NUMBER = '972592152484';

let allProducts = [];
let allCategories = [];
let currentCategory = 'all';
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// التحقق من حالة المستخدم
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (user.email === ADMIN_EMAIL) {
            userMenuEl.innerHTML = `
                <a href="admin.html" style="color:var(--primary-color); text-decoration:none; font-weight:bold;">⚙️ الإدارة</a>
                <button onclick="logout()" style="background:none; border:none; color:var(--danger-color); cursor:pointer; font-family:'Tajawal'; font-weight:bold; margin-right:10px;">خروج</button>
            `;
        } else {
            userMenuEl.innerHTML = `
                <span style="color:var(--text-light); font-size:14px;">مرحباً</span>
                <button onclick="logout()" style="background:none; border:none; color:var(--danger-color); cursor:pointer; font-family:'Tajawal'; font-weight:bold;">خروج</button>
            `;
        }
    } else {
        userMenuEl.innerHTML = `<a href="login.html" style="color:var(--primary-color); text-decoration:none; font-weight:bold;">دخول</a>`;
    }
});

window.logout = async function() { await signOut(auth); window.location.reload(); };

// فتح/إغلاق القائمة
window.toggleCategories = function() {
    const sidebar = document.getElementById('categoriesSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
};

// فتح/إغلاق السلة - الإصلاح الرئيسي
window.toggleCart = function(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    if (cartDrawer) {
        cartDrawer.classList.toggle('open');
        renderCartDrawer();
    }
};

// تحديث عداد السلة
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountEl) {
        cartCountEl.textContent = count;
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartTotal();
}

// تحديث مجموع السلة
function updateCartTotal() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotalEl) {
        cartTotalEl.textContent = total.toFixed(2) + ' ر.س';
    }
}

// عرض محتوى السلة
function renderCartDrawer() {
    if (!cartContent) return;
    
    if (cart.length === 0) {
        cartContent.innerHTML = `
            <div class="empty-cart">
                <div class="icon">🛒</div>
                <h3>السلة فارغة</h3>
                <p>أضف منتجات للبدء</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    cart.forEach((item, index) => {
        html += `
            <div class="cart-item">
                <img src="${item.image}" onerror="this.src='https://via.placeholder.com/80'">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span class="color-tag">${item.color}</span>
                    <div class="price">${item.price} ر.س</div>
                </div>
                <div class="cart-item-actions">
                    <div class="qty-controls">
                        <button onclick="updateCartQty(${index}, 1)">+</button>
                        <span style="font-weight:bold; min-width:20px; text-align:center;">${item.quantity}</span>
                        <button onclick="updateCartQty(${index}, -1)">−</button>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart(${index})">حذف</button>
                </div>
            </div>
        `;
    });
    
    cartContent.innerHTML = html;
}

// تحديث كمية المنتج في السلة
window.updateCartQty = function(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity < 1) cart[index].quantity = 1;
    if (cart[index].quantity > 10) cart[index].quantity = 10;
    updateCartCount();
    renderCartDrawer();
};

// حذف من السلة
window.removeFromCart = function(index) {
    if (confirm('حذف هذا المنتج من السلة؟')) {
        cart.splice(index, 1);
        updateCartCount();
        renderCartDrawer();
    }
};

// إضافة للسلة - الإصلاح الكامل
window.addToCart = function(productId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        alert('️ المنتج غير موجود');
        return;
    }
    
    const qtyInput = document.getElementById(`qty-${productId}`);
    const quantity = parseInt(qtyInput?.value) || 1;
    
    let selectedColor = 'افتراضي';
    const colorBtns = document.querySelectorAll(`.color-btn-${productId}`);
    colorBtns.forEach(btn => {
        if (btn.classList.contains('selected')) {
            selectedColor = btn.getAttribute('data-color');
        }
    });

    const cartItemId = `${productId}_${selectedColor}`;
    const existing = cart.find(item => item.id === cartItemId);
    
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({
            id: cartItemId,
            productId,
            name: product.name,
            price: product.price,
            image: product.image,
            color: selectedColor,
            quantity
        });
    }
    
    updateCartCount();
    
    // رسالة نجاح
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
        background: var(--success-color); color: white; padding: 15px 30px;
        border-radius: 25px; z-index: 1000; font-weight: bold;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2); animation: slideDown 0.3s;
    `;
    toast.textContent = `✅ تمت إضافة ${product.name} للسلة`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
    
    // إشعار فقط - لا تفتح السلة تلقائياً
// المستخدم يفتح السلة بنفسه عند الانتهاء

// تغيير الكمية في بطاقة المنتج
window.changeQty = function(productId, delta) {
    const input = document.getElementById(`qty-${productId}`);
    if (input) {
        let val = parseInt(input.value) || 1;
        val += delta;
        if (val < 1) val = 1;
        if (val > 10) val = 10;
        input.value = val;
    }
};

// اختيار اللون
window.selectColor = function(productId, colorName, btnElement) {
    document.querySelectorAll(`.color-btn-${productId}`).forEach(btn => btn.classList.remove('selected'));
    btnElement.classList.add('selected');
};

// تحميل البنرات
async function loadBanners() {
    const snapshot = await getDocs(collection(db, "banners"));
    if (bannersContainer) {
        bannersContainer.innerHTML = '';
        if (snapshot.empty) {
            bannersContainer.innerHTML = `<div style="background:linear-gradient(135deg, var(--primary-color), var(--primary-light)); height:250px; border-radius:16px; display:flex; align-items:center; justify-content:center; color:white; font-size:28px; font-weight:bold; width:100%;">🔥 عروض حصرية</div>`;
            return;
        }
        snapshot.forEach((doc) => {
            const banner = doc.data();
            if (banner.isActive) bannersContainer.innerHTML += `<img src="${banner.imageUrl}" class="banner-img" alt="banner">`;
        });
    }
}

// تحميل التصنيفات
async function loadCategories() {
    const snapshot = await getDocs(collection(db, "categories"));
    allCategories = [];
    snapshot.forEach((doc) => allCategories.push({ id: doc.id, ...doc.data() }));
    
    if (sidebarCategories) {
        sidebarCategories.innerHTML = '<div class="category-item active" data-category="all" onclick="filterCategory(\'all\')">🏠 الكل</div>';
        allCategories.forEach(cat => {
            sidebarCategories.innerHTML += `<div class="category-item" data-category="${cat.name}" onclick="filterCategory('${cat.name}')">${cat.name}</div>`;
        });
    }
}

// فلترة حسب القسم
window.filterCategory = function(category) {
    currentCategory = category;
    document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
    const target = document.querySelector(`[data-category="${category}"]`);
    if (target) target.classList.add('active');
    renderProductsByCategory();
    toggleCategories();
};

// تحميل المنتجات
async function loadProducts() {
    const snapshot = await getDocs(collection(db, "products"));
    allProducts = [];
    snapshot.forEach((doc) => allProducts.push({ id: doc.id, ...doc.data() }));
    renderProductsByCategory();
}

// عرض المنتجات حسب الأقسام
function renderProductsByCategory() {
    if (!productsByCategoryContainer) return;
    productsByCategoryContainer.innerHTML = '';
    
    if (currentCategory !== 'all') {
        const categoryProducts = allProducts.filter(p => p.category === currentCategory);
        renderCategorySection(currentCategory, categoryProducts);
    } else {
        if (allCategories.length === 0) {
            renderCategorySection('all', allProducts);
        } else {
            allCategories.forEach(cat => {
                const categoryProducts = allProducts.filter(p => p.category === cat.name);
                if (categoryProducts.length > 0) renderCategorySection(cat.name, categoryProducts);
            });
            const noCategoryProducts = allProducts.filter(p => !p.category || p.category === '');
            if (noCategoryProducts.length > 0) renderCategorySection('منتجات أخرى', noCategoryProducts);
        }
    }
}

function renderCategorySection(categoryName, products) {
    const section = document.createElement('div');
    section.style.marginBottom = '40px';
    const displayTitle = categoryName === 'all' ? 'جميع المنتجات' : categoryName;
    
    section.innerHTML = `
        <div class="section-header">
            <h2 class="section-title">${displayTitle}</h2>
            <div class="nav-arrows">
                <button class="nav-arrow" onclick="scrollSection('${categoryName}', 'right')">›</button>
                <button class="nav-arrow" onclick="scrollSection('${categoryName}', 'left')">‹</button>
            </div>
        </div>
        <div class="products-scroll" id="section-${categoryName.replace(/\s+/g, '-')}">
            ${products.map(product => createProductCard(product)).join('')}
        </div>
    `;
    productsByCategoryContainer.appendChild(section);
}

function createProductCard(product) {
    const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
    
    let colorsHtml = '';
    if (product.hasColors && product.colors) {
        const colorsArray = product.colors.split(',').map(c => c.trim());
        const colorValues = {
            'أحمر': '#E74C3C', 'أسود': '#2C3E50', 'أبيض': '#ECF0F1',
            'أزرق': '#3498DB', 'أخضر': '#27AE60', 'ذهبي': '#F39C12',
            'فضي': '#BDC3C7', 'وردي': '#E91E63', 'بنفسجي': '#9B59B6'
        };
        colorsHtml = '<div class="color-options">';
        colorsArray.forEach((color, index) => {
            const bgColor = colorValues[color] || '#999';
            const isSelected = index === 0 ? 'selected' : '';
            colorsHtml += `<button class="color-btn color-btn-${product.id} ${isSelected}" style="background:${bgColor}" data-color="${color}" onclick="event.stopPropagation(); selectColor('${product.id}', '${color}', this)" title="${color}"></button>`;
        });
        colorsHtml += '</div>';
    }
    
    return `
        <div class="product-card" onclick="window.location.href='product.html?id=${product.id}'" style="cursor:pointer;">
            ${discount > 0 ? `<div class="discount-badge">خصم ${discount}%</div>` : ''}
            <img src="${product.image}" class="product-image" onerror="this.src='https://via.placeholder.com/200?text=No+Image'">
            <div class="product-title">${product.name}</div>
            <small style="color:var(--text-light)">${product.category || ''}</small>
            ${product.oldPrice ? `<div class="old-price">${product.oldPrice} ر.س</div>` : ''}
            <div class="new-price">${product.price} ر.س</div>
            
            <div class="product-options" onclick="event.stopPropagation();">
                ${colorsHtml}
                <div class="qty-selector">
                    <button class="qty-btn" onclick="event.stopPropagation(); changeQty('${product.id}', -1)">−</button>
                    <input type="number" id="qty-${product.id}" class="qty-input" value="1" min="1" max="10" readonly>
                    <button class="qty-btn" onclick="event.stopPropagation(); changeQty('${product.id}', 1)">+</button>
                </div>
            </div>
            
            <button class="add-to-cart" onclick="event.stopPropagation(); addToCart('${product.id}', event)">
                 أضف للسلة
            </button>
        </div>
    `;
}

// التمرير الأفقي
window.scrollSection = function(categoryName, direction) {
    const sectionId = `section-${categoryName.replace(/\s+/g, '-')}`;
    const container = document.getElementById(sectionId);
    if (container) {
        const scrollAmount = 300;
        container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
};

// CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translate(-50%, -20px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// التشغيل
updateCartCount();
loadBanners();
loadCategories();
loadProducts();

console.log('✅ المتجر تم تحميله بنجاح');
console.log(' عدد المنتجات:', allProducts.length);
console.log('🛒 عدد عناصر السلة:', cart.length);
