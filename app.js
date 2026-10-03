import { db, collection, getDocs } from './firebase-config.js';
import { auth, signOut, onAuthStateChanged } from './firebase-config.js';

console.log('🚀 بدء تحميل المتجر...');

const ADMIN_EMAIL = 'ibrahimabushmud@gmail.com';

let allProducts = [];
let allCategories = [];
let currentCategory = 'all';
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let compareList = JSON.parse(localStorage.getItem('compareList')) || [];
let storeSettings = {};
let countdownInterval;
let notifInterval;
let appliedCoupon = null;

const heartEmptySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
const heartFilledSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#e91e63" stroke="#e91e63" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

let curr = '';
let currLarge = '';
let currXLarge = '';

function updateCurrencySymbols() {
    const icon = storeSettings.currencyIcon || '';
    const sizeProduct = storeSettings.currencySizeProduct || 12;
    const sizeCart = storeSettings.currencySizeCart || 18;
    const sizeLarge = storeSettings.currencySizeLarge || 24;
    const text = storeSettings.currencyText || 'د.إ';
    
    if (icon) {
        // استخدام الصورة
        curr = `<img src="${icon}" style="height:${sizeProduct}px; vertical-align:middle; margin-left:4px;">`;
        currLarge = `<img src="${icon}" style="height:${sizeCart}px; vertical-align:middle; margin-left:3px;">`;
        currXLarge = `<img src="${icon}" style="height:${sizeLarge}px; vertical-align:middle; margin-left:3px;">`;
    } else {
        // استخدام النص
        curr = `<span style="font-weight:bold; color:var(--primary-color); margin-left:4px; font-size:${sizeProduct}px;">${text}</span>`;
        currLarge = `<span style="font-weight:bold; color:var(--primary-color); margin-left:3px; font-size:${sizeCart}px;">${text}</span>`;
        currXLarge = `<span style="font-weight:bold; color:var(--primary-color); margin-left:3px; font-size:${sizeLarge}px;">${text}</span>`;
    }
}
function updateCurrencySymbols() {
    const icon = storeSettings.currencyIcon || '';
    const size = storeSettings.currencySize || 12;
    const sizeLarge = storeSettings.currencySizeLarge || 18;
    
    if (icon) {
        curr = `<img src="${icon}" style="height:${size}px; vertical-align:middle; margin-left:4px;">`;
        currLarge = `<img src="${icon}" style="height:${sizeLarge}px; vertical-align:middle; margin-left:3px;">`;
    } else {
        curr = `<span style="font-weight:bold; color:var(--primary-color); margin-left:4px; font-size:${size}px;">د.إ</span>`;
        currLarge = `<span style="font-weight:bold; color:var(--primary-color); margin-left:3px; font-size:${sizeLarge}px;">د.إ</span>`;
    }
}

// ============ تحميل الإعدادات ============
async function loadStoreSettings() {
    try {
        const snapshot = await getDocs(collection(db, "settings"));
        storeSettings = {};
        snapshot.forEach(docSnap => { storeSettings[docSnap.id] = docSnap.data().value; });
        console.log('⚙️ الإعدادات المحملة:', storeSettings);
        applySettings();
    } catch (error) {
        console.log('لا توجد إعدادات، استخدام القيم الافتراضية');
        storeSettings = {
            primaryColor: '#D4AF37', storeName: 'شرف DG', whatsapp: '+971592152484', email: 'info@sharafdg.com',
            freeShipping: 500, welcomeEnabled: true, welcomeDiscount: 10, welcomeCode: 'WELCOME10',
            countdownEnabled: true, notificationsEnabled: true, notifInterval: 15,
            trustBadgesEnabled: true, footerDesc: 'متجرك الإلكتروني الأول في الإمارات',
            notifications: 'أحمد من دبي|آيفون 18 برو\nفاطمة من أبوظبي|سامسونج S26',
            currencyIcon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTtauUniR9dGoEXyG6AaYXbzovVet90qe0igubKGL7Ew&s=10',
            currencySize: 12, currencySizeLarge: 18, cartImageSize: 80, productImageSize: 200
        };
        applySettings();
    }
}

function applySettings() {
    console.log(' تطبيق الإعدادات...');
    if (storeSettings.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', storeSettings.primaryColor);
        document.documentElement.style.setProperty('--primary-dark', storeSettings.primaryColor);
    }
    if (storeSettings.storeName) {
        document.title = storeSettings.storeName;
        const footerName = document.getElementById('footerStoreName');
        if (footerName) footerName.textContent = storeSettings.storeName;
    }
    if (storeSettings.whatsapp) {
        const whatsappBtn = document.querySelector('.whatsapp-float');
        if (whatsappBtn) whatsappBtn.href = `https://wa.me/${storeSettings.whatsapp.replace(/[^0-9]/g,'')}`;
        const footerWhatsapp = document.getElementById('footerWhatsapp');
        if (footerWhatsapp) footerWhatsapp.textContent = `📱 ${storeSettings.whatsapp}`;
    }
    if (storeSettings.email) {
        const footerEmail = document.getElementById('footerEmail');
        if (footerEmail) footerEmail.textContent = ` ${storeSettings.email}`;
    }
    if (storeSettings.footerDesc) {
        const footerDesc = document.getElementById('footerDescription');
        if (footerDesc) footerDesc.textContent = storeSettings.footerDesc;
    }
    if (storeSettings.facebook) { const fb = document.getElementById('footerFacebook'); if (fb) fb.href = storeSettings.facebook; }
    if (storeSettings.instagram) { const ig = document.getElementById('footerInstagram'); if (ig) ig.href = storeSettings.instagram; }
    if (storeSettings.twitter) { const tw = document.getElementById('footerTwitter'); if (tw) tw.href = storeSettings.twitter; }
    
    const badges = document.querySelector('.trust-badges');
    if (badges) badges.style.display = storeSettings.trustBadgesEnabled === false ? 'none' : 'grid';
    
    // تحديث حجم صورة المنتج
    const productImageSize = storeSettings.productImageSize || 200;
    document.documentElement.style.setProperty('--product-image-height', productImageSize + 'px');
    
    updateCurrencySymbols();
        // تحديث رموز العملة
    updateCurrencySymbols();
    console.log('✅ تم تطبيق الإعدادات');
}

// ============ الوضع الداكن ============
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}
if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');

// ============ تسجيل الدخول ============
onAuthStateChanged(auth, (user) => {
    const userMenuEl = document.getElementById('userMenu');
    if (userMenuEl) {
        if (user) {
            if (user.email === ADMIN_EMAIL) {
                userMenuEl.innerHTML = `<a href="admin.html" style="color:var(--primary-color); text-decoration:none; font-weight:bold; margin-left:10px;">⚙️ الإدارة</a><button onclick="doLogout()" style="background:none; border:none; color:var(--danger-color); cursor:pointer;">خروج</button>`;
            } else {
                userMenuEl.innerHTML = `<span style="color:var(--text-light); font-size:14px;">مرحباً</span>`;
            }
        } else {
            userMenuEl.innerHTML = `<a href="login.html" style="color:var(--primary-color); text-decoration:none; font-weight:bold;">دخول</a>`;
        }
    }
});
window.doLogout = async function() { await signOut(auth); window.location.reload(); };

// ============ نافذة الترحيب ============
function checkWelcomeModal() {
    if (storeSettings.welcomeEnabled === false) return;
    if (!localStorage.getItem('hasVisited')) {
        setTimeout(() => {
            const modal = document.getElementById('welcomeModal');
            if (modal) {
                const discount = storeSettings.welcomeDiscount || 10;
                const code = storeSettings.welcomeCode || 'WELCOME10';
                const storeName = storeSettings.storeName || 'متجرنا';
                const h2 = modal.querySelector('h2');
                const p = modal.querySelector('p');
                const codeDiv = modal.querySelector('.discount-code');
                if (h2) h2.textContent = `مرحباً بك في ${storeName}!`;
                if (p) p.innerHTML = `احصل على <b style="color:var(--danger-color); font-size:24px;">خصم ${discount}%</b>!`;
                if (codeDiv) codeDiv.textContent = code;
                modal.style.display = 'flex';
                localStorage.setItem('hasVisited', 'true');
            }
        }, 3000);
    }
}
window.closeWelcomeModal = function() { document.getElementById('welcomeModal').style.display = 'none'; };
window.claimDiscount = function() {
    const email = document.getElementById('welcomeEmail').value;
    if (!email || !email.includes('@')) { alert('️ بريد صحيح'); return; }
    localStorage.setItem('discountCode', storeSettings.welcomeCode || 'WELCOME10');
    alert(`✅ الكود: ${storeSettings.welcomeCode || 'WELCOME10'}`);
    closeWelcomeModal();
};

// ============ البحث ============
window.searchProducts = function() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const resultsDiv = document.getElementById('searchResults');
    if (query.length < 2) { resultsDiv.style.display = 'none'; return; }
    const matches = allProducts.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)).slice(0, 5);
    if (matches.length === 0) {
        resultsDiv.innerHTML = '<div style="padding:15px; text-align:center; color:#999;">لا نتائج</div>';
    } else {
        resultsDiv.innerHTML = matches.map(p => `<div class="search-result-item" onclick="window.location.href='product.html?id=${p.id}'"><img src="${p.image}" style="width:50px; height:50px; object-fit:cover; border-radius:8px;"><div style="flex:1;"><div style="font-weight:bold; font-size:14px;">${p.name}</div><div style="color:var(--primary-color); font-weight:bold;">${curr}${p.price}</div></div></div>`).join('');
    }
    resultsDiv.style.display = 'block';
};
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        const sr = document.getElementById('searchResults');
        if (sr) sr.style.display = 'none';
    }
});

// ============ المفضلة ============
window.toggleWishlist = function() {
    const drawer = document.getElementById('wishlistDrawer');
    const overlay = document.getElementById('wishlistOverlay');
    if (drawer) { drawer.classList.toggle('open'); if (overlay) overlay.classList.toggle('show'); renderWishlist(); }
};

window.toggleWishlistItem = function(productId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const index = wishlist.indexOf(productId);
    if (index > -1) {
        wishlist.splice(index, 1);
        showToast('تم الإزالة من المفضلة', '#e91e63');
    } else {
        wishlist.push(productId);
        showToast('تمت الإضافة إلى المفضلة ❤️', '#e91e63');
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistCount();
    
    const btn = document.querySelector(`.wishlist-btn-${productId}`);
    if (btn) {
        const isNowInWishlist = wishlist.includes(productId);
        btn.innerHTML = isNowInWishlist ? heartFilledSvg : heartEmptySvg;
        btn.style.background = isNowInWishlist ? '#e91e63' : 'white';
        btn.classList.toggle('active');
    }
};

function updateWishlistCount() {
    const el = document.getElementById('wishlistCount');
    if (el) el.textContent = wishlist.length;
}

function renderWishlist() {
    const content = document.getElementById('wishlistContent');
    if (!content) return;
    if (wishlist.length === 0) {
        content.innerHTML = `<div class="empty-cart"><div class="icon">❤️</div><h3>المفضلة فارغة</h3></div>`;
        return;
    }
    const wishlistProducts = allProducts.filter(p => wishlist.includes(p.id));
    const cartImgSize = storeSettings.cartImageSize || 80;
    content.innerHTML = wishlistProducts.map(product => `
        <div class="cart-item">
            <img src="${product.image}" onerror="this.src='https://via.placeholder.com/80'" style="width:${cartImgSize}px; height:${cartImgSize}px; object-fit:cover; border-radius:10px;">
            <div class="cart-item-info"><h4>${product.name}</h4><div class="price">${curr}${product.price}</div></div>
            <div class="cart-item-actions">
                <button onclick="addToCart('${product.id}'); toggleWishlistItem('${product.id}')" style="background:var(--primary-color); color:white; border:none; padding:8px 12px; border-radius:15px; cursor:pointer; font-family:'Tajawal'; font-size:12px;">أضف للسلة</button>
                <button onclick="toggleWishlistItem('${product.id}')" class="remove-btn">حذف</button>
            </div>
        </div>
    `).join('');
}

// ============ المقارنة ============
window.toggleCompare = function() {
    const modal = document.getElementById('compareModal');
    if (modal) { modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex'; if (modal.style.display === 'flex') renderCompare(); }
};

window.toggleCompareItem = function(productId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const index = compareList.indexOf(productId);
    if (index > -1) {
        compareList.splice(index, 1);
        showToast('تم الإزالة', '#2196F3');
    } else {
        if (compareList.length >= 4) { alert('️ 4 كحد أقصى'); return; }
        compareList.push(productId);
        showToast('تمت الإضافة ⚖️', '#2196F3');
    }
    localStorage.setItem('compareList', JSON.stringify(compareList));
    updateCompareCount();
    document.querySelectorAll(`.compare-btn-${productId}`).forEach(btn => { if (btn) btn.classList.toggle('active'); });
};

function updateCompareCount() {
    const el = document.getElementById('compareCount');
    if (el) el.textContent = compareList.length;
}

function renderCompare() {
    const content = document.getElementById('compareContent');
    if (!content) return;
    if (compareList.length === 0) {
        content.innerHTML = '<div style="text-align:center; padding:40px;"><h3>لم تقارن</h3></div>';
        return;
    }
    const compareProducts = allProducts.filter(p => compareList.includes(p.id));
    let html = `<div style="display:grid; grid-template-columns:repeat(${compareProducts.length}, 1fr); gap:20px;">`;
    compareProducts.forEach(p => {
        html += `<div style="text-align:center;"><img src="${p.image}" style="width:100%; height:150px; object-fit:contain; border-radius:10px;"><h4 style="margin:10px 0;">${p.name}</h4><div style="font-size:20px; font-weight:bold; color:var(--primary-color);">${curr}${p.price}</div><button onclick="addToCart('${p.id}')" style="background:var(--primary-color); color:white; border:none; padding:10px 20px; border-radius:20px; cursor:pointer; font-family:'Tajawal'; margin-top:10px;">أضف للسلة</button><button onclick="toggleCompareItem('${p.id}'); renderCompare();" style="background:#dc3545; color:white; border:none; padding:8px 15px; border-radius:15px; cursor:pointer; font-family:'Tajawal'; margin-top:10px; font-size:12px;">إزالة</button></div>`;
    });
    html += '</div>';
    content.innerHTML = html;
}

// ============ السلة ============
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const el = document.getElementById('cartCount');
    if (el) el.textContent = count;
    localStorage.setItem('cart', JSON.stringify(cart));
    updateShippingProgress();
}

function updateShippingProgress() {
    const threshold = storeSettings.freeShipping || 500;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const remaining = Math.max(0, threshold - total);
    const progress = Math.min(100, (total / threshold) * 100);
    const remainingEl = document.getElementById('shippingRemaining');
    const progressBar = document.getElementById('shippingProgressBar');
    const totalBox = document.getElementById('cartTotalBox');
    
    if (totalBox) totalBox.style.display = cart.length > 0 ? 'block' : 'none';
    if (remainingEl) {
        if (remaining > 0) {
            remainingEl.textContent = `أضف ${curr}${remaining.toFixed(2)} للشحن المجاني`;
            if (progressBar) { progressBar.style.width = progress + '%'; progressBar.style.background = 'var(--primary-color)'; }
        } else {
            remainingEl.innerHTML = '<span style="color:var(--success-color); font-weight:bold;">✅ شحن مجاني!</span>';
            if (progressBar) { progressBar.style.width = '100%'; progressBar.style.background = 'var(--success-color)'; }
        }
    }
}

window.toggleCategories = function() {
    const sidebar = document.getElementById('categoriesSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');
};

window.toggleCart = function(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer) { drawer.classList.toggle('open'); if (overlay) overlay.classList.toggle('show'); renderCartDrawer(); }
};

window.applyCoupon = function() {
    const code = document.getElementById('couponInput').value.trim().toUpperCase();
    const messageEl = document.getElementById('couponMessage');
    if (!code) { messageEl.innerHTML = '<span style="color:#dc3545;">⚠️ أدخل الكود</span>'; return; }
    const coupons = {
        'WELCOME10': { type: 'percent', value: 10, description: 'خصم 10%' },
        'SAVE20': { type: 'percent', value: 20, description: 'خصم 20%' },
        'SUMMER15': { type: 'percent', value: 15, description: 'خصم 15%' },
        'FLAT100': { type: 'fixed', value: 100, description: 'خصم 100 د.إ' }
    };
    if (coupons[code]) {
        appliedCoupon = { code, ...coupons[code] };
        messageEl.innerHTML = `<span style="color:#28a745;">✅ ${coupons[code].description}</span>`;
    } else {
        appliedCoupon = null;
        messageEl.innerHTML = '<span style="color:#dc3545;">❌ غير صالح</span>';
    }
    renderCartDrawer();
};

function calcDiscount(sub) { if (!appliedCoupon) return 0; return appliedCoupon.type === 'percent' ? (sub * appliedCoupon.value) / 100 : appliedCoupon.value; }

function renderCartDrawer() {
    const content = document.getElementById('cartContent');
    const totalEl = document.getElementById('cartTotal');
    const subtotalEl = document.getElementById('cartSubtotal');
    const discountRow = document.getElementById('discountRow');
    const discountAmount = document.getElementById('discountAmount');
    if (!content) return;
    
    const cartImgSize = storeSettings.cartImageSize || 80;
    
    if (cart.length === 0) {
        content.innerHTML = `<div class="empty-cart"><div class="icon">🛒</div><h3>السلة فارغة</h3><button onclick="toggleCart();window.location.href='index.html'" style="background:var(--primary-color); color:white; border:none; padding:12px 30px; border-radius:25px; font-family:'Tajawal'; font-weight:bold; margin-top:15px; cursor:pointer;">تصفح</button></div>`;
        if (totalEl) totalEl.innerHTML = currLarge + '0';
        if (discountRow) discountRow.style.display = 'none';
        return;
    }
    
    let html = '', sub = 0;
    cart.forEach((it, i) => {
        sub += it.price * it.quantity;
        html += `<div class="cart-item"><img src="${it.image}" onerror="this.src='https://via.placeholder.com/80'" style="width:${cartImgSize}px; height:${cartImgSize}px; object-fit:cover; border-radius:10px;"><div class="cart-item-info"><h4>${it.name}</h4><span class="color-tag">${it.color}</span><div class="price">${curr}${it.price}</div></div><div class="cart-item-actions"><div class="qty-controls"><button onclick="updateCartQty(${i},1)">+</button><span style="font-weight:bold; min-width:20px; text-align:center;">${it.quantity}</span><button onclick="updateCartQty(${i},-1)">−</button></div><button class="remove-btn" onclick="removeFromCart(${i})">حذف</button></div></div>`;
    });
    
    content.innerHTML = html;
    if (subtotalEl) subtotalEl.innerHTML = currLarge + sub.toFixed(2);
    const disc = calcDiscount(sub), tot = sub - disc;
    if (discountRow && discountAmount) {
        if (disc > 0) { discountRow.style.display = 'flex'; discountAmount.innerHTML = '-' + currLarge + disc.toFixed(2); }
        else discountRow.style.display = 'none';
    }
    if (totalEl) totalEl.innerHTML = currLarge + tot.toFixed(2);
    updateShippingProgress();
}

window.updateCartQty = (i, d) => { cart[i].quantity += d; if (cart[i].quantity < 1) cart[i].quantity = 1; if (cart[i].quantity > 10) cart[i].quantity = 10; updateCartCount(); renderCartDrawer(); };
window.removeFromCart = (i) => { if (confirm('حذف؟')) { cart.splice(i, 1); updateCartCount(); renderCartDrawer(); } };

window.addToCart = (pid, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const p = allProducts.find(x => x.id === pid);
    if (!p) { alert('⚠️ غير موجود'); return; }
    const qi = document.getElementById(`qty-${pid}`), qty = parseInt(qi?.value) || 1;
    let col = 'افتراضي';
    document.querySelectorAll(`.color-btn-${pid}`).forEach(b => { if (b.classList.contains('selected')) col = b.getAttribute('data-color'); });
    const cid = `${pid}_${col}`, ex = cart.find(x => x.id === cid);
    if (ex) ex.quantity += qty; else cart.push({ id: cid, productId: pid, name: p.name, price: p.price, image: p.image, color: col, quantity: qty });
    updateCartCount();
    showToast(`✅ تمت إضافة ${p.name}`, '#27AE60');
};

window.changeQty = (pid, d) => { const i = document.getElementById(`qty-${pid}`); if (i) { let v = parseInt(i.value) || 1; v += d; if (v < 1) v = 1; if (v > 10) v = 10; i.value = v; } };
window.selectColor = (pid, cn, b) => { document.querySelectorAll(`.color-btn-${pid}`).forEach(x => x.classList.remove('selected')); b.classList.add('selected'); };

function showToast(msg, col = '#27AE60') {
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;top:100px;left:50%;transform:translateX(-50%);background:${col};color:white;padding:15px 30px;border-radius:25px;z-index:3000;font-weight:bold;box-shadow:0 4px 15px rgba(0,0,0,0.2);font-family:'Tajawal';animation:slideDown 0.3s ease;`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 2500);
}

// ============ البنرات ============
let carouselImages = [], currentSlide = 0, carouselInterval;
async function loadBannersSystem() {
    console.log('🖼️ بدء تحميل البنرات...');
    try {
        const snapshot = await getDocs(collection(db, "banners"));
        console.log('📊 عدد البنرات المحملة:', snapshot.size);
        
        const topBannerEl = document.getElementById('topBanner');
        const carouselContainer = document.getElementById('carouselContainer');
        const carouselSlides = document.getElementById('carouselSlides');
        const carouselDots = document.getElementById('carouselDots');
        
        carouselImages = [];
        let topBannerUrl = '';
        
        snapshot.forEach((doc) => {
            const banner = doc.data();
            console.log(' بنر:', banner.type, '| مفعل:', banner.isActive);
            if (banner.isActive) {
                if (banner.type === 'top') {
                    topBannerUrl = banner.imageUrl;
                } else {
                    carouselImages.push({ 
                        id: doc.id, 
                        url: banner.imageUrl, 
                        link: banner.link || '#', 
                        order: banner.order || 100 
                    });
                }
            }
        });
        
        carouselImages.sort((a, b) => a.order - b.order);
        console.log(' صور السلايدر:', carouselImages.length);
        
        // عرض البنر العلوي
        if (topBannerEl && topBannerUrl) {
            topBannerEl.innerHTML = `<img src="${topBannerUrl}" style="width:100%; max-height:120px; object-fit:cover;">`;
            topBannerEl.style.display = 'block';
            console.log('✅ البنر العلوي ظاهر');
        }
        
        // عرض السلايدر
        if (carouselContainer && carouselSlides && carouselDots) {
            if (carouselImages.length > 0) {
                carouselContainer.style.display = 'block';
                carouselContainer.classList.add('show');
                carouselSlides.innerHTML = '';
                carouselDots.innerHTML = '';
                
                carouselImages.forEach((img, index) => {
                    const slide = document.createElement('div');
                    slide.style.cssText = 'min-width:100%; position:relative;';
                    slide.innerHTML = `<a href="${img.link}" target="_blank"><img src="${img.url}" style="width:100%; height:400px; object-fit:cover; display:block;" onerror="this.parentElement.style.display='none'; console.log(' فشل تحميل صورة:', '${img.url}');"></a>`;
                    carouselSlides.appendChild(slide);
                    
                    const dot = document.createElement('button');
                    dot.style.cssText = `width:12px; height:12px; border-radius:50%; border:none; cursor:pointer; background:${index === 0 ? 'var(--primary-color)' : 'rgba(0,0,0,0.3)'}; transition:0.3s;`;
                    dot.onclick = () => goToSlide(index);
                    carouselDots.appendChild(dot);
                });
                
                console.log('✅ السلايدر ظاهر مع', carouselImages.length, 'صورة');
                startCarousel();
            } else {
                console.log('⚠️ لا توجد صور للسلايدر');
                carouselContainer.style.display = 'none';
            }
        }
    } catch (error) { 
        console.error('❌ خطأ في تحميل البنرات:', error); 
    }
}
function startCarousel() { if (carouselInterval) clearInterval(carouselInterval); carouselInterval = setInterval(() => moveSlide(1), 3000); }
window.moveSlide = d => { if (carouselImages.length === 0) return; currentSlide = (currentSlide + d + carouselImages.length) % carouselImages.length; updateCarousel(); startCarousel(); };
window.goToSlide = i => { currentSlide = i; updateCarousel(); startCarousel(); };
function updateCarousel() { const s = document.getElementById('carouselSlides'), d = document.querySelectorAll('#carouselDots button'); if (!s) return; s.style.transform = `translateX(${currentSlide * 100}%)`; d.forEach((x, i) => { x.style.background = i === currentSlide ? 'var(--primary-color)' : 'rgba(0,0,0,0.3)'; }); }
const cce = document.getElementById('carouselContainer');
if (cce) { cce.addEventListener('mouseenter', () => { if (carouselInterval) clearInterval(carouselInterval); }); cce.addEventListener('mouseleave', () => startCarousel()); }

// ============ العداد ============
function startCountdown() {
    if (storeSettings.countdownEnabled === false) return;
    const ce = document.getElementById('countdownTimer');
    if (!ce) return;
    const end = new Date(); end.setHours(23, 59, 59, 999);
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        const now = new Date(), diff = end - now;
        if (diff <= 0) { ce.textContent = '00:00:00'; return; }
        const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
        ce.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }, 1000);
}

// ============ الإشعارات ============
function showLiveNotification() {
    if (storeSettings.notificationsEnabled === false) return;
    const txt = storeSettings.notifications || '', notifs = txt.split('\n').filter(n => n.trim()).map(n => { const [nm, pr] = n.split('|'); return { name: nm || '', product: pr || '', time: 'قبل دقائق' }; });
    if (notifs.length === 0) return;
    const intv = (storeSettings.notifInterval || 15) * 1000;
    let idx = 0; const c = document.getElementById('liveNotifications');
    if (!c) return;
    if (notifInterval) clearInterval(notifInterval);
    notifInterval = setInterval(() => {
        const n = notifs[idx % notifs.length];
        const el = document.createElement('div');
        el.style.cssText = 'background:white; padding:15px; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.2); margin-bottom:10px; animation:slideInLeft 0.5s ease; max-width:300px; border-right:4px solid var(--primary-color);';
        el.innerHTML = `<div style="font-size:14px; font-weight:bold; color:var(--primary-color);">🛍️ عملية شراء</div><div style="font-size:13px; margin:5px 0;"><b>${n.name}</b> اشترى <b>${n.product}</b></div><div style="font-size:11px; color:#999;">${n.time}</div>`;
        c.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.5s'; setTimeout(() => el.remove(), 500); }, 5000);
        idx++;
    }, intv);
}

// ============ التصنيفات - إصلاح مهم ============
async function loadCategories() {
    const sidebar = document.getElementById('sidebarCategories');
    console.log('📁 تحميل الأقسام...');
    
    try {
        const snapshot = await getDocs(collection(db, "categories"));
        allCategories = [];
        
        console.log('📊 عدد الأقسام المحملة:', snapshot.size);
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            console.log('📂 قسم:', data.name, '| المستوى:', data.level, '| الأب:', data.parentCategory);
            
            // تحديد المستوى: إذا لم يكن هناك level، نعتبره مستوى 1 إذا لم يكن له أب
            let level = data.level;
            if (!level) {
                level = data.parentCategory ? 2 : 1;
            }
            
            allCategories.push({ 
                id: doc.id, 
                ...data, 
                level: level, 
                order: data.order || 100 
            });
        });
        
        allCategories.sort((a, b) => a.order - b.order);
        
        console.log('✅ الأقسام بعد المعالجة:', allCategories.map(c => `${c.name} (مستوى ${c.level})`));
        
        renderCategorySidebar();
    } catch (error) { 
        console.error('❌ خطأ في تحميل الأقسام:', error); 
    }
}

function renderCategorySidebar() {
    const sidebar = document.getElementById('sidebarCategories');
    if (!sidebar) {
        console.error('❌ عنصر sidebarCategories غير موجود!');
        return;
    }
    
    console.log('🎨 رسم القائمة الجانبية...');
    console.log(' الأقسام المتاحة:', allCategories.length);
    
    sidebar.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:15px; border-bottom:2px solid var(--accent-color);">
            <h3 style="color:var(--primary-color); margin:0;">📁 جميع التصنيفات</h3>
            <button onclick="toggleCategories()" style="background:none; border:none; font-size:24px; cursor:pointer;">✕</button>
        </div>
    `;
    
    // زر عرض الكل
    const allBtn = document.createElement('div');
    allBtn.className = 'category-item active';
    allBtn.dataset.category = 'all';
    allBtn.innerHTML = ' عرض الكل';
    allBtn.onclick = () => filterCategory('all');
    sidebar.appendChild(allBtn);
    
    if (allCategories.length === 0) {
        sidebar.innerHTML += '<div style="padding:20px; text-align:center; color:#999;">لا توجد أقسام بعد</div>';
        return;
    }
    
    // عرض الأقسام الرئيسية (المستوى 1)
    const level1Cats = allCategories.filter(c => c.level === 1);
    console.log('📁 الأقسام الرئيسية:', level1Cats.length);
    
    level1Cats.forEach(mainCat => {
        const mainItem = document.createElement('div');
        mainItem.className = 'category-item';
        mainItem.dataset.category = mainCat.name;
        mainItem.style.cssText = 'font-weight:bold; font-size:16px; padding:15px 20px;';
        mainItem.innerHTML = `📁 ${mainCat.name}`;
        mainItem.onclick = () => { filterCategory(mainCat.name); };
        sidebar.appendChild(mainItem);
        
        // الفروع (المستوى 2)
        const level2Cats = allCategories.filter(c => c.parentCategory === mainCat.name);
        level2Cats.forEach(subCat => {
            const subItem = document.createElement('div');
            subItem.className = 'category-item';
            subItem.dataset.category = subCat.name;
            subItem.style.cssText = 'padding:12px 20px 12px 40px; font-size:15px;';
            subItem.innerHTML = `📂 ${subCat.name}`;
            subItem.onclick = () => { filterCategory(subCat.name); };
            sidebar.appendChild(subItem);
            
            // الفروع الفرعية (المستوى 3)
            const level3Cats = allCategories.filter(c => c.parentCategory === subCat.name);
            level3Cats.forEach(subSubCat => {
                const subSubItem = document.createElement('div');
                subSubItem.className = 'category-item';
                subSubItem.dataset.category = subSubCat.name;
                subSubItem.style.cssText = 'padding:10px 20px 10px 60px; font-size:14px; color:#666;';
                subSubItem.innerHTML = ` ${subSubCat.name}`;
                subSubItem.onclick = () => { filterCategory(subSubCat.name); };
                sidebar.appendChild(subSubItem);
            });
        });
    });
}

window.filterCategory = function(category) {
    currentCategory = category;
    const sidebar = document.getElementById('categoriesSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    
    document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
    const activeItem = document.querySelector(`.category-item[data-category="${category}"]`);
    if (activeItem) activeItem.classList.add('active');
    
    renderProductsByCategory();
};

function getAllSubCategories(parentName) {
    const subs = allCategories.filter(c => c.parentCategory === parentName);
    let allNames = [parentName];
    subs.forEach(sub => { allNames = [...allNames, ...getAllSubCategories(sub.name)]; });
    return allNames;
}

// ============ المنتجات ============
async function loadProducts() {
    try {
        const snapshot = await getDocs(collection(db, "products"));
        allProducts = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            allProducts.push({ 
                id: doc.id, 
                ...data, 
                order: data.order || 100, 
                isNew: data.isNew || false, 
                isSale: data.isSale || false, 
                discountPercent: data.discountPercent || 0, 
                saleEndDate: data.saleEndDate || null, 
                displayLocation: data.displayLocation || 'all', 
                salesCount: data.salesCount || Math.floor(Math.random() * 100) 
            });
        });
        allProducts.sort((a, b) => a.order - b.order);
        console.log(' عدد المنتجات:', allProducts.length);
        renderSpecialSections();
        renderProductsByCategory();
    } catch (error) { console.error('❌ خطأ في تحميل المنتجات:', error); }
}

function renderSpecialSections() {
    const bestSellers = [...allProducts].sort((a, b) => b.salesCount - a.salesCount).slice(0, 10);
    if (bestSellers.length > 0) {
        document.getElementById('bestSellersSection').style.display = 'block';
        document.getElementById('bestSellersScroll').innerHTML = bestSellers.map(p => createProductCard(p, true)).join('');
    }
    const newArrivals = allProducts.filter(p => p.isNew).slice(0, 10);
    if (newArrivals.length > 0) {
        document.getElementById('newArrivalsSection').style.display = 'block';
        document.getElementById('newArrivalsScroll').innerHTML = newArrivals.map(p => createProductCard(p)).join('');
    }
    const flashSales = allProducts.filter(p => p.isSale && p.discountPercent > 0);
    if (flashSales.length > 0) {
        document.getElementById('flashSaleSection').style.display = 'block';
        document.getElementById('flashSaleScroll').innerHTML = flashSales.map(p => createProductCard(p)).join('');
        startCountdown();
    }
}

function renderProductsByCategory() {
    const container = document.getElementById('productsByCategory');
    if (!container) return;
    container.innerHTML = '';
    
    console.log('🎯 عرض المنتجات للقسم:', currentCategory);
    console.log('📊 الأقسام:', allCategories.length);
    
    if (currentCategory === 'all') {
        const level1Cats = allCategories.filter(c => c.level === 1);
        console.log('📁 الأقسام الرئيسية:', level1Cats.length);
        
        if (level1Cats.length === 0) {
            const allVisible = allProducts.filter(p => p.displayLocation !== 'hidden');
            if (allVisible.length > 0) {
                console.log('️ لا توجد أقسام، عرض كل المنتجات');
                renderCategorySection('جميع المنتجات', allVisible);
            }
        } else {
            level1Cats.forEach(mainCat => {
                console.log('📁 عرض القسم:', mainCat.name);
                const mainSection = document.createElement('div');
                mainSection.style.marginBottom = '40px';
                mainSection.innerHTML = `<div class="section-header" style="margin-bottom:20px;"><h2 class="section-title" style="font-size:24px; border-right:5px solid var(--primary-color); padding-right:15px;"> ${mainCat.name}</h2></div>`;
                container.appendChild(mainSection);
                displaySubCategoriesWithProducts(mainCat.name, container);
            });
        }
    } else {
        const allCats = getAllSubCategories(currentCategory);
        const categoryProducts = allProducts.filter(p => allCats.includes(p.category) && p.displayLocation !== 'hidden');
        console.log('📂 قسم محدد:', currentCategory, '| المنتجات:', categoryProducts.length);
        
        if (categoryProducts.length > 0) {
            displaySubCategoriesWithProducts(currentCategory, container);
        } else {
            container.innerHTML = '<div style="text-align:center; padding:50px; color:#666;">لا توجد منتجات في هذا القسم</div>';
        }
    }
}

function displaySubCategoriesWithProducts(parentName, container) {
    const subs = allCategories.filter(c => c.parentCategory === parentName);
    const directProducts = allProducts.filter(p => p.category === parentName && p.displayLocation !== 'hidden');
    
    console.log(`📂 ${parentName}: ${directProducts.length} منتج مباشر، ${subs.length} فرع`);
    
    if (directProducts.length > 0) {
        const section = document.createElement('div');
        section.style.marginBottom = '30px';
        section.innerHTML = `
            <div class="section-header" style="margin-bottom:15px;"><h3 class="section-title" style="font-size:20px; color:#666;"> منتجات ${parentName}</h3></div>
            <div class="products-scroll" style="padding:15px 10px;">${directProducts.map(p => createProductCard(p)).join('')}</div>
        `;
        container.appendChild(section);
    }
    
    subs.forEach(subCat => {
        const subSubs = allCategories.filter(c => c.parentCategory === subCat.name);
        const subProducts = allProducts.filter(p => p.category === subCat.name && p.displayLocation !== 'hidden');
        
        if (subProducts.length > 0 || subSubs.length > 0) {
            const subSection = document.createElement('div');
            subSection.style.marginBottom = '30px';
            subSection.style.paddingRight = '20px';
            subSection.style.borderRight = '3px solid var(--accent-color)';
            subSection.innerHTML = `<div class="section-header" style="margin-bottom:15px;"><h3 class="section-title" style="font-size:22px;">📂 ${subCat.name}</h3></div>`;
            container.appendChild(subSection);
            
            if (subProducts.length > 0) {
                const productsSection = document.createElement('div');
                productsSection.style.marginBottom = '20px';
                productsSection.innerHTML = `<div class="products-scroll" style="padding:15px 10px;">${subProducts.map(p => createProductCard(p)).join('')}</div>`;
                container.appendChild(productsSection);
            }
            
            subSubs.forEach(subSubCat => {
                const subSubProducts = allProducts.filter(p => p.category === subSubCat.name && p.displayLocation !== 'hidden');
                if (subSubProducts.length > 0) {
                    const subSubSection = document.createElement('div');
                    subSubSection.style.marginBottom = '20px';
                    subSubSection.style.paddingRight = '40px';
                    subSubSection.innerHTML = `
                        <div class="section-header" style="margin-bottom:10px;"><h4 class="section-title" style="font-size:18px; color:#888;">📄 ${subSubCat.name}</h4></div>
                        <div class="products-scroll" style="padding:10px;">${subSubProducts.map(p => createProductCard(p)).join('')}</div>
                    `;
                    container.appendChild(subSubSection);
                }
            });
        }
    });
}

function renderCategorySection(categoryName, products) {
    const container = document.getElementById('productsByCategory');
    if (!container || products.length === 0) return;
    const section = document.createElement('div');
    section.style.marginBottom = '40px';
    section.innerHTML = `<div class="section-header"><h2 class="section-title">${categoryName}</h2><div class="nav-arrows"><button class="nav-arrow" onclick="scrollSection('${categoryName}', 'right')">›</button><button class="nav-arrow" onclick="scrollSection('${categoryName}', 'left')">‹</button></div></div><div class="products-scroll" id="section-${categoryName.replace(/\s+/g, '-')}">${products.map(product => createProductCard(product)).join('')}</div>`;
    container.appendChild(section);
}

function createProductCard(product, showSalesBadge = false) {
    const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
    const inWishlist = wishlist.includes(product.id);
    const inCompare = compareList.includes(product.id);
    
    let badges = '';
    if (product.isNew) badges += '<div style="position:absolute; top:10px; right:10px; background:#28a745; color:white; padding:5px 12px; border-radius:15px; font-size:12px; font-weight:bold; z-index:10;">🆕 جديد</div>';
    if (product.isSale && product.discountPercent) {
        const endDate = product.saleEndDate ? new Date(product.saleEndDate) : null;
        const isExpired = endDate && endDate < new Date();
        if (!isExpired) badges += `<div style="position:absolute; top:50px; right:10px; background:#dc3545; color:white; padding:3px 8px; border-radius:10px; font-size:11px; font-weight:bold; z-index:9;">خصم ${product.discountPercent}%</div>`;
    }
    if (showSalesBadge && product.salesCount > 50) badges += '<div style="position:absolute; bottom:10px; right:10px; background:var(--primary-color); color:white; padding:5px 12px; border-radius:15px; font-size:11px; font-weight:bold; z-index:10;">🏆 الأكثر مبيعاً</div>';
    
    const heartSvg = inWishlist ? heartFilledSvg : heartEmptySvg;
    const heartBg = inWishlist ? 'background:#e91e63;' : 'background:white;';
    
    const actionButtons = `
        <div style="position:absolute; top:10px; left:10px; display:flex; flex-direction:column; gap:5px; z-index:15;">
            <button class="wishlist-btn-${product.id} ${inWishlist ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlistItem('${product.id}')" style="width:35px; height:35px; border-radius:50%; border:none; ${heartBg} cursor:pointer; font-size:18px; box-shadow:0 2px 5px rgba(0,0,0,0.2); display:flex; align-items:center; justify-content:center; transition:0.3s;" title="المفضلة">${heartSvg}</button>
            <button class="compare-btn-${product.id} ${inCompare ? 'active' : ''}" onclick="event.stopPropagation(); toggleCompareItem('${product.id}')" style="width:35px; height:35px; border-radius:50%; border:none; ${inCompare ? 'background:#2196F3;color:white;' : 'background:white;'} cursor:pointer; font-size:16px; box-shadow:0 2px 5px rgba(0,0,0,0.2); display:flex; align-items:center; justify-content:center; transition:0.3s;" title="مقارنة">️</button>
        </div>
    `;
    
    let colorsHtml = '';
    if (product.hasColors && product.colors) {
        const colorsArray = product.colors.split(',').map(c => c.trim());
        const colorValues = { 'أحمر': '#E74C3C', 'أسود': '#2C3E50', 'أبيض': '#ECF0F1', 'أزرق': '#3498DB', 'أخضر': '#27AE60', 'ذهبي': '#F39C12', 'فضي': '#BDC3C7', 'وردي': '#E91E63', 'بنفسجي': '#9B59B6' };
        colorsHtml = '<div class="color-options">';
        colorsArray.forEach((color, index) => {
            const bgColor = colorValues[color] || '#999';
            colorsHtml += `<button class="color-btn color-btn-${product.id} ${index === 0 ? 'selected' : ''}" style="background:${bgColor}" data-color="${color}" onclick="event.stopPropagation(); selectColor('${product.id}', '${color}', this)" title="${color}"></button>`;
        });
        colorsHtml += '</div>';
    }
    
    return `<div class="product-card" onclick="window.location.href='product.html?id=${product.id}'" style="cursor:pointer; position:relative;">${actionButtons}${badges}<img src="${product.image}" class="product-image" onerror="this.src='https://via.placeholder.com/200?text=No+Image'" style="height:var(--product-image-height, 200px);"><div class="product-title">${product.name}</div><small style="color:var(--text-light)">${product.category||''}</small>${product.oldPrice?`<div class="old-price">${curr}${product.oldPrice}</div>`:''}<div class="new-price">${curr}${product.price}</div><div class="product-options" onclick="event.stopPropagation();">${colorsHtml}<div class="qty-selector"><button class="qty-btn" onclick="event.stopPropagation();changeQty('${product.id}',-1)">−</button><input type="number" id="qty-${product.id}" class="qty-input" value="1" min="1" max="10" readonly><button class="qty-btn" onclick="event.stopPropagation();changeQty('${product.id}',1)">+</button></div></div><button class="add-to-cart" onclick="event.stopPropagation();addToCart('${product.id}',event)">أضف للسلة</button></div>`;
}

window.scrollSection = (cn, d) => { const c = document.getElementById(`section-${cn.replace(/\s+/g,'-')}`); if (c) c.scrollBy({ left: d === 'left' ? -300 : 300, behavior: 'smooth' }); };

// ============ بدء التشغيل ============
console.log('✅ بدء التشغيل...');
updateWishlistCount();
updateCompareCount();
loadStoreSettings().then(() => {
    updateCurrencySymbols(); // تحديث رموز العملة أولاً
    updateCartCount();
    loadBannersSystem();
    loadCategories();
    loadProducts();
    checkWelcomeModal();
    showLiveNotification();
});
