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
let categoryNavigationStack = [];
let storeSettings = {};
let countdownInterval;
let notifInterval;
let appliedCoupon = null;

const curr = '<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTtauUniR9dGoEXyG6AaYXbzovVet90qe0igubKGL7Ew&s=10" style="height:12px; vertical-align:middle; margin-left:4px;">';
const currLarge = '<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTtauUniR9dGoEXyG6AaYXbzovVet90qe0igubKGL7Ew&s=10" style="height:18px; vertical-align:middle; margin-left:3px;">';

// ============ تحميل الإعدادات ============
async function loadStoreSettings() {
    try {
        const snapshot = await getDocs(collection(db, "settings"));
        storeSettings = {};
        snapshot.forEach(docSnap => { storeSettings[docSnap.id] = docSnap.data().value; });
        applySettings();
    } catch (error) {
        console.log('لا توجد إعدادات، استخدام القيم الافتراضية');
        storeSettings = {
            primaryColor: '#D4AF37', storeName: 'شرف DG', whatsapp: '+971592152484',
            freeShipping: 500, welcomeEnabled: true, welcomeDiscount: 10, welcomeCode: 'WELCOME10',
            countdownEnabled: true, notificationsEnabled: true, notifInterval: 15,
            trustBadgesEnabled: true,
            notifications: 'أحمد من دبي|آيفون 18 برو\nفاطمة من أبوظبي|سامسونج S26'
        };
        applySettings();
    }
}

function applySettings() {
    if (storeSettings.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', storeSettings.primaryColor);
        document.documentElement.style.setProperty('--primary-dark', storeSettings.primaryColor);
    }
    if (storeSettings.storeName) document.title = storeSettings.storeName + ' - متجر إلكتروني';
    if (storeSettings.whatsapp) {
        const whatsappBtn = document.querySelector('.whatsapp-float');
        if (whatsappBtn) whatsappBtn.href = `https://wa.me/${storeSettings.whatsapp.replace(/[^0-9]/g, '')}`;
    }
    if (storeSettings.trustBadgesEnabled === false) {
        const badges = document.querySelector('.trust-badges');
        if (badges) badges.style.display = 'none';
    }
}

// ============ الوضع الداكن ============
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// تطبيق الوضع الداكن المحفوظ
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

// ============ التحقق من تسجيل الدخول ============
onAuthStateChanged(auth, (user) => {
    const userMenuEl = document.getElementById('userMenu');
    if (userMenuEl) {
        if (user) {
            if (user.email === ADMIN_EMAIL) {
                userMenuEl.innerHTML = `<a href="admin.html" style="color:var(--primary-color); text-decoration:none; font-weight:bold; margin-left:10px;">⚙️ الإدارة</a><button onclick="doLogout()" style="background:none; border:none; color:var(--danger-color); cursor:pointer; font-family:'Tajawal'; font-weight:bold;">خروج</button>`;
            } else {
                userMenuEl.innerHTML = `<span style="color:var(--text-light); font-size:14px;">مرحباً</span>`;
            }
        } else {
            userMenuEl.innerHTML = `<a href="login.html" style="color:var(--primary-color); text-decoration:none; font-weight:bold;">دخول</a>`;
        }
    }
});

window.doLogout = async function() {
    await signOut(auth);
    window.location.reload();
};

// ============ نافذة الترحيب ============
function checkWelcomeModal() {
    if (storeSettings.welcomeEnabled === false) return;
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
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
                if (p) p.innerHTML = `احصل على <b style="color:var(--danger-color); font-size:24px;">خصم ${discount}%</b> على أول طلب!`;
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
    if (!email || !email.includes('@')) { alert('⚠️ الرجاء إدخال بريد إلكتروني صحيح'); return; }
    localStorage.setItem('discountCode', storeSettings.welcomeCode || 'WELCOME10');
    localStorage.setItem('discountEmail', email);
    alert(`✅ تم حفظ كود الخصم: ${storeSettings.welcomeCode || 'WELCOME10'}`);
    closeWelcomeModal();
};

// ============ البحث الذكي ============
window.searchProducts = function() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const resultsDiv = document.getElementById('searchResults');
    if (query.length < 2) { resultsDiv.style.display = 'none'; return; }
    const matches = allProducts.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)).slice(0, 5);
    if (matches.length === 0) {
        resultsDiv.innerHTML = '<div style="padding:15px; text-align:center; color:#999;">لا توجد نتائج</div>';
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

// ============ قائمة الأمنيات (Wishlist) ============
window.toggleWishlist = function() {
    const drawer = document.getElementById('wishlistDrawer');
    const overlay = document.getElementById('wishlistOverlay');
    if (drawer) {
        drawer.classList.toggle('open');
        if (overlay) overlay.classList.toggle('show');
        renderWishlist();
    }
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
    // تحديث الأيقونات في الصفحة
    document.querySelectorAll(`.wishlist-btn-${productId}`).forEach(btn => {
        if (btn) btn.classList.toggle('active');
    });
};

function updateWishlistCount() {
    const el = document.getElementById('wishlistCount');
    if (el) el.textContent = wishlist.length;
}

function renderWishlist() {
    const content = document.getElementById('wishlistContent');
    if (!content) return;
    if (wishlist.length === 0) {
        content.innerHTML = `<div class="empty-cart"><div class="icon">❤️</div><h3>المفضلة فارغة</h3><p>أضف منتجات للمفضلة</p></div>`;
        return;
    }
    const wishlistProducts = allProducts.filter(p => wishlist.includes(p.id));
    let html = '';
    wishlistProducts.forEach(product => {
        html += `<div class="cart-item"><img src="${product.image}" onerror="this.src='https://via.placeholder.com/80'"><div class="cart-item-info"><h4>${product.name}</h4><div class="price">${curr}${product.price}</div></div><div class="cart-item-actions"><button onclick="addToCart('${product.id}'); toggleWishlistItem('${product.id}')" style="background:var(--primary-color); color:white; border:none; padding:8px 12px; border-radius:15px; cursor:pointer; font-family:'Tajawal'; font-size:12px;">أضف للسلة</button><button onclick="toggleWishlistItem('${product.id}')" class="remove-btn">حذف</button></div></div>`;
    });
    content.innerHTML = html;
}

// ============ مقارنة المنتجات ============
window.toggleCompare = function() {
    const modal = document.getElementById('compareModal');
    if (modal) {
        modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
        if (modal.style.display === 'flex') renderCompare();
    }
};

window.toggleCompareItem = function(productId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const index = compareList.indexOf(productId);
    if (index > -1) {
        compareList.splice(index, 1);
        showToast('تم الإزالة من المقارنة', '#2196F3');
    } else {
        if (compareList.length >= 4) {
            alert('⚠️ يمكنك مقارنة 4 منتجات كحد أقصى');
            return;
        }
        compareList.push(productId);
        showToast('تمت الإضافة للمقارنة ⚖️', '#2196F3');
    }
    localStorage.setItem('compareList', JSON.stringify(compareList));
    updateCompareCount();
    document.querySelectorAll(`.compare-btn-${productId}`).forEach(btn => {
        if (btn) btn.classList.toggle('active');
    });
};

function updateCompareCount() {
    const el = document.getElementById('compareCount');
    if (el) el.textContent = compareList.length;
}

function renderCompare() {
    const content = document.getElementById('compareContent');
    if (!content) return;
    if (compareList.length === 0) {
        content.innerHTML = '<div style="text-align:center; padding:40px;"><h3>لم تقارن أي منتج بعد</h3><p>اضغط على ⚖️ في المنتجات للمقارنة</p></div>';
        return;
    }
    const compareProducts = allProducts.filter(p => compareList.includes(p.id));
    let html = '<div style="display:grid; grid-template-columns:repeat(' + compareProducts.length + ', 1fr); gap:20px;">';
    compareProducts.forEach(p => {
        html += `<div style="text-align:center;"><img src="${p.image}" style="width:100%; height:150px; object-fit:contain; border-radius:10px;"><h4 style="margin:10px 0;">${p.name}</h4><div style="font-size:20px; font-weight:bold; color:var(--primary-color);">${curr}${p.price}</div><button onclick="addToCart('${p.id}')" style="background:var(--primary-color); color:white; border:none; padding:10px 20px; border-radius:20px; cursor:pointer; font-family:'Tajawal'; margin-top:10px;">أضف للسلة</button><button onclick="toggleCompareItem('${p.id}'); renderCompare();" style="background:#dc3545; color:white; border:none; padding:8px 15px; border-radius:15px; cursor:pointer; font-family:'Tajawal'; margin-top:10px; font-size:12px;">إزالة</button></div>`;
    });
    html += '</div>';
    content.innerHTML = html;
}

// ============ إدارة السلة ============
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
    if (drawer) {
        drawer.classList.toggle('open');
        if (overlay) overlay.classList.toggle('show');
        renderCartDrawer();
    }
};

// ============ نظام كوبونات الخصم ============
window.applyCoupon = function() {
    const code = document.getElementById('couponInput').value.trim().toUpperCase();
    const messageEl = document.getElementById('couponMessage');
    
    if (!code) {
        messageEl.innerHTML = '<span style="color:#dc3545;">⚠️ الرجاء إدخال كود الخصم</span>';
        return;
    }
    
    // قائمة الكوبونات المتاحة
    const validCoupons = {
        'WELCOME10': { type: 'percent', value: 10, description: 'خصم 10% للزوار الجدد' },
        'SAVE20': { type: 'percent', value: 20, description: 'خصم 20%' },
        'SUMMER15': { type: 'percent', value: 15, description: 'خصم صيفي 15%' },
        'FLAT100': { type: 'fixed', value: 100, description: 'خصم 100 د.إ' }
    };
    
    if (validCoupons[code]) {
        appliedCoupon = { code: code, ...validCoupons[code] };
        messageEl.innerHTML = `<span style="color:#28a745;">✅ تم تطبيق الكود: ${validCoupons[code].description}</span>`;
        renderCartDrawer();
    } else {
        appliedCoupon = null;
        messageEl.innerHTML = '<span style="color:#dc3545;">❌ كود غير صالح</span>';
        renderCartDrawer();
    }
};

function calculateDiscount(subtotal) {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percent') {
        return (subtotal * appliedCoupon.value) / 100;
    } else {
        return appliedCoupon.value;
    }
}

function renderCartDrawer() {
    const content = document.getElementById('cartContent');
    const totalEl = document.getElementById('cartTotal');
    const subtotalEl = document.getElementById('cartSubtotal');
    const discountRow = document.getElementById('discountRow');
    const discountAmount = document.getElementById('discountAmount');
    if (!content) return;
    
    if (cart.length === 0) {
        content.innerHTML = `<div class="empty-cart"><div class="icon">🛒</div><h3>السلة فارغة</h3><p>أضف منتجات للبدء</p><button onclick="toggleCart(); window.location.href='index.html'" style="background:var(--primary-color); color:white; border:none; padding:12px 30px; border-radius:25px; font-family:'Tajawal'; font-weight:bold; margin-top:15px; cursor:pointer;">تصفح المنتجات</button></div>`;
        if (totalEl) totalEl.innerHTML = currLarge + '0';
        if (discountRow) discountRow.style.display = 'none';
        return;
    }
    
    let html = '';
    let subtotal = 0;
    cart.forEach((item, index) => {
        subtotal += item.price * item.quantity;
        html += `<div class="cart-item"><img src="${item.image}" onerror="this.src='https://via.placeholder.com/80'"><div class="cart-item-info"><h4>${item.name}</h4><span class="color-tag">${item.color}</span><div class="price">${curr}${item.price}</div></div><div class="cart-item-actions"><div class="qty-controls"><button onclick="updateCartQty(${index}, 1)">+</button><span style="font-weight:bold; min-width:20px; text-align:center;">${item.quantity}</span><button onclick="updateCartQty(${index}, -1)">−</button></div><button class="remove-btn" onclick="removeFromCart(${index})">حذف</button></div></div>`;
    });
    
    content.innerHTML = html;
    if (subtotalEl) subtotalEl.innerHTML = currLarge + subtotal.toFixed(2);
    
    const discount = calculateDiscount(subtotal);
    const total = subtotal - discount;
    
    if (discountRow && discountAmount) {
        if (discount > 0) {
            discountRow.style.display = 'flex';
            discountAmount.innerHTML = '-' + currLarge + discount.toFixed(2);
        } else {
            discountRow.style.display = 'none';
        }
    }
    
    if (totalEl) totalEl.innerHTML = currLarge + total.toFixed(2);
    updateShippingProgress();
}

window.updateCartQty = function(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity < 1) cart[index].quantity = 1;
    if (cart[index].quantity > 10) cart[index].quantity = 10;
    updateCartCount();
    renderCartDrawer();
};

window.removeFromCart = function(index) {
    if (confirm('حذف هذا المنتج؟')) {
        cart.splice(index, 1);
        updateCartCount();
        renderCartDrawer();
    }
};

window.addToCart = function(productId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const product = allProducts.find(p => p.id === productId);
    if (!product) { alert('⚠️ المنتج غير موجود'); return; }
    const qtyInput = document.getElementById(`qty-${productId}`);
    const quantity = parseInt(qtyInput?.value) || 1;
    let selectedColor = 'افتراضي';
    document.querySelectorAll(`.color-btn-${productId}`).forEach(btn => {
        if (btn.classList.contains('selected')) selectedColor = btn.getAttribute('data-color');
    });
    const cartItemId = `${productId}_${selectedColor}`;
    const existing = cart.find(item => item.id === cartItemId);
    if (existing) { existing.quantity += quantity; } 
    else { cart.push({ id: cartItemId, productId, name: product.name, price: product.price, image: product.image, color: selectedColor, quantity }); }
    updateCartCount();
    showToast(`✅ تمت إضافة ${product.name} للسلة`, '#27AE60');
};

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

window.selectColor = function(productId, colorName, btnElement) {
    document.querySelectorAll(`.color-btn-${productId}`).forEach(btn => btn.classList.remove('selected'));
    btnElement.classList.add('selected');
};

// ============ Toast Notification ============
function showToast(message, color = '#27AE60') {
    const toast = document.createElement('div');
    toast.style.cssText = `position: fixed; top: 100px; left: 50%; transform: translateX(-50%); background: ${color}; color: white; padding: 15px 30px; border-radius: 25px; z-index: 3000; font-weight: bold; box-shadow: 0 4px 15px rgba(0,0,0,0.2); font-family: 'Tajawal'; animation: slideDown 0.3s ease;`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 2500);
}

// ============ نظام البنرات ============
let carouselImages = [];
let currentSlide = 0;
let carouselInterval;

async function loadBannersSystem() {
    try {
        const snapshot = await getDocs(collection(db, "banners"));
        const topBannerEl = document.getElementById('topBanner');
        const carouselContainer = document.getElementById('carouselContainer');
        const carouselSlides = document.getElementById('carouselSlides');
        const carouselDots = document.getElementById('carouselDots');
        carouselImages = [];
        let topBannerUrl = '';
        snapshot.forEach((doc) => {
            const banner = doc.data();
            if (banner.isActive) {
                if (banner.type === 'top') topBannerUrl = banner.imageUrl;
                else carouselImages.push({ id: doc.id, url: banner.imageUrl, link: banner.link || '#', order: banner.order || 100 });
            }
        });
        carouselImages.sort((a, b) => a.order - b.order);
        if (topBannerEl && topBannerUrl) {
            topBannerEl.innerHTML = `<img src="${topBannerUrl}" style="width:100%; max-height:120px; object-fit:cover;">`;
            topBannerEl.style.display = 'block';
        }
        if (carouselContainer && carouselSlides && carouselDots && carouselImages.length > 0) {
            carouselContainer.style.display = 'block';
            carouselSlides.innerHTML = '';
            carouselDots.innerHTML = '';
            carouselImages.forEach((img, index) => {
                const slide = document.createElement('div');
                slide.style.cssText = 'min-width:100%; position:relative;';
                slide.innerHTML = `<a href="${img.link}" target="_blank"><img src="${img.url}" style="width:100%; height:400px; object-fit:cover; display:block;"></a>`;
                carouselSlides.appendChild(slide);
                const dot = document.createElement('button');
                dot.style.cssText = `width:12px; height:12px; border-radius:50%; border:none; cursor:pointer; background:${index === 0 ? 'var(--primary-color)' : 'rgba(0,0,0,0.3)'}; transition:0.3s;`;
                dot.onclick = () => goToSlide(index);
                carouselDots.appendChild(dot);
            });
            startCarousel();
        }
    } catch (error) { console.error('خطأ في تحميل البنرات:', error); }
}

function startCarousel() {
    if (carouselInterval) clearInterval(carouselInterval);
    carouselInterval = setInterval(() => { moveSlide(1); }, 3000);
}

window.moveSlide = function(direction) {
    if (carouselImages.length === 0) return;
    currentSlide = (currentSlide + direction + carouselImages.length) % carouselImages.length;
    updateCarousel();
    startCarousel();
};

window.goToSlide = function(index) {
    currentSlide = index;
    updateCarousel();
    startCarousel();
};

function updateCarousel() {
    const slides = document.getElementById('carouselSlides');
    const dots = document.querySelectorAll('#carouselDots button');
    if (!slides) return;
    slides.style.transform = `translateX(${currentSlide * 100}%)`;
    dots.forEach((dot, index) => { dot.style.background = index === currentSlide ? 'var(--primary-color)' : 'rgba(0,0,0,0.3)'; });
}

const carouselContainerEl = document.getElementById('carouselContainer');
if (carouselContainerEl) {
    carouselContainerEl.addEventListener('mouseenter', () => { if (carouselInterval) clearInterval(carouselInterval); });
    carouselContainerEl.addEventListener('mouseleave', () => { startCarousel(); });
}

// ============ العداد التنازلي ============
function startCountdown() {
    if (storeSettings.countdownEnabled === false) return;
    const countdownEl = document.getElementById('countdownTimer');
    if (!countdownEl) return;
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        const now = new Date();
        const diff = endOfDay - now;
        if (diff <= 0) { countdownEl.textContent = '00:00:00'; return; }
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        countdownEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

// ============ الإشعارات الفورية ============
function showLiveNotification() {
    if (storeSettings.notificationsEnabled === false) return;
    const notificationsText = storeSettings.notifications || '';
    const notifications = notificationsText.split('\n').filter(n => n.trim()).map(n => {
        const [name, product] = n.split('|');
        return { name: name || '', product: product || '', time: 'قبل دقائق' };
    });
    if (notifications.length === 0) return;
    const interval = (storeSettings.notifInterval || 15) * 1000;
    let index = 0;
    const container = document.getElementById('liveNotifications');
    if (!container) return;
    if (notifInterval) clearInterval(notifInterval);
    notifInterval = setInterval(() => {
        const notif = notifications[index % notifications.length];
        const notifEl = document.createElement('div');
        notifEl.style.cssText = `background: white; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); margin-bottom: 10px; animation: slideInLeft 0.5s ease; max-width: 300px; border-right: 4px solid var(--primary-color);`;
        notifEl.innerHTML = `<div style="font-size:14px; font-weight:bold; color:var(--primary-color);">🛍️ عملية شراء جديدة</div><div style="font-size:13px; margin:5px 0;"><b>${notif.name}</b> اشترى <b>${notif.product}</b></div><div style="font-size:11px; color:#999;">${notif.time}</div>`;
        container.appendChild(notifEl);
        setTimeout(() => { notifEl.style.opacity = '0'; notifEl.style.transition = 'opacity 0.5s'; setTimeout(() => notifEl.remove(), 500); }, 5000);
        index++;
    }, interval);
}

// ============ نظام التصنيفات ============
async function loadCategories() {
    const sidebar = document.getElementById('sidebarCategories');
    if (!sidebar) return;
    try {
        const snapshot = await getDocs(collection(db, "categories"));
        allCategories = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            allCategories.push({ id: doc.id, ...data, level: data.level || (data.parentCategory ? 2 : 1), order: data.order || 100 });
        });
        allCategories.sort((a, b) => a.order - b.order);
        categoryNavigationStack = [];
        renderCategorySidebar();
    } catch (error) { console.error('خطأ في تحميل التصنيفات:', error); }
}

function renderCategorySidebar() {
    const sidebar = document.getElementById('sidebarCategories');
    if (!sidebar) return;
    sidebar.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:15px; border-bottom:2px solid var(--accent-color);"><h3 style="color:var(--primary-color); margin:0;"> التصنيفات</h3><button onclick="toggleCategories()" style="background:none; border:none; font-size:24px; cursor:pointer;">✕</button></div>`;
    if (categoryNavigationStack.length > 0) {
        const backBtn = document.createElement('div');
        backBtn.className = 'category-item';
        backBtn.style.cssText = 'background: #f0f0f0; font-weight: bold;';
        backBtn.innerHTML = '← رجوع';
        backBtn.onclick = () => goBackCategory();
        sidebar.appendChild(backBtn);
    }
    if (categoryNavigationStack.length === 0) {
        const allBtn = document.createElement('div');
        allBtn.className = 'category-item active';
        allBtn.dataset.category = 'all';
        allBtn.innerHTML = '🏠 الكل';
        allBtn.onclick = () => filterCategory('all');
        sidebar.appendChild(allBtn);
    }
    let categoriesToShow = [];
    if (categoryNavigationStack.length === 0) {
        categoriesToShow = allCategories.filter(c => c.level === 1);
    } else {
        const currentParent = categoryNavigationStack[categoryNavigationStack.length - 1];
        categoriesToShow = allCategories.filter(c => c.parentCategory === currentParent);
    }
    categoriesToShow.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'category-item';
        item.dataset.category = cat.name;
        const hasChildren = allCategories.some(c => c.parentCategory === cat.name);
        item.innerHTML = hasChildren ? `📁 ${cat.name} ›` : `📄 ${cat.name}`;
        item.onclick = () => navigateToCategory(cat.name);
        sidebar.appendChild(item);
    });
}

window.navigateToCategory = function(categoryName) {
    categoryNavigationStack.push(categoryName);
    renderCategorySidebar();
    filterCategory(categoryName);
};

window.goBackCategory = function() {
    categoryNavigationStack.pop();
    renderCategorySidebar();
    if (categoryNavigationStack.length === 0) filterCategory('all');
    else filterCategory(categoryNavigationStack[categoryNavigationStack.length - 1]);
};

window.filterCategory = function(category) {
    currentCategory = category;
    const sidebar = document.getElementById('categoriesSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    renderProductsByCategory();
};

function getAllSubCategories(parentName) {
    const subs = allCategories.filter(c => c.parentCategory === parentName);
    let allNames = [parentName];
    subs.forEach(sub => { allNames = [...allNames, ...getAllSubCategories(sub.name)]; });
    return allNames;
}

async function loadProducts() {
    try {
        const snapshot = await getDocs(collection(db, "products"));
        allProducts = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            allProducts.push({ id: doc.id, ...data, order: data.order || 100, isNew: data.isNew || false, isSale: data.isSale || false, discountPercent: data.discountPercent || 0, saleEndDate: data.saleEndDate || null, displayLocation: data.displayLocation || 'all', salesCount: data.salesCount || Math.floor(Math.random() * 100) });
        });
        allProducts.sort((a, b) => a.order - b.order);
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
    if (currentCategory === 'all') {
        const level1Cats = allCategories.filter(c => c.level === 1);
        if (level1Cats.length === 0) {
            renderCategorySection('جميع المنتجات', allProducts.filter(p => p.displayLocation !== 'hidden'));
        } else {
            level1Cats.forEach(mainCat => {
                const allCats = getAllSubCategories(mainCat.name);
                const categoryProducts = allProducts.filter(p => allCats.includes(p.category) && p.displayLocation !== 'hidden');
                if (categoryProducts.length > 0) displayCategoryProducts(mainCat.name, 0, container);
            });
        }
    } else {
        const allCats = getAllSubCategories(currentCategory);
        const categoryProducts = allProducts.filter(p => allCats.includes(p.category) && p.displayLocation !== 'hidden');
        if (categoryProducts.length > 0) displayCategoryProducts(currentCategory, 0, container);
        else container.innerHTML = '<div style="text-align:center; padding:50px; color:#666;">لا توجد منتجات في هذا القسم</div>';
    }
}

function displayCategoryProducts(parentName, level, container) {
    const subs = allCategories.filter(c => c.parentCategory === parentName);
    const directProducts = allProducts.filter(p => p.category === parentName && p.displayLocation !== 'hidden');
    if (directProducts.length > 0) renderCategorySection(parentName, directProducts);
    subs.forEach(subCat => { displayCategoryProducts(subCat.name, level + 1, container); });
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
        if (!isExpired) badges += `<div style="position:absolute; top:10px; left:10px; background:#dc3545; color:white; padding:5px 12px; border-radius:15px; font-size:12px; font-weight:bold; z-index:10;">خصم ${product.discountPercent}%</div>`;
    }
    if (showSalesBadge && product.salesCount > 50) badges += '<div style="position:absolute; bottom:10px; right:10px; background:var(--primary-color); color:white; padding:5px 12px; border-radius:15px; font-size:11px; font-weight:bold; z-index:10;"> الأكثر مبيعاً</div>';
    
    // أزرار المفضلة والمقارنة
    const actionButtons = `
        <div style="position:absolute; top:10px; left:10px; display:flex; flex-direction:column; gap:5px; z-index:10;">
            <button class="wishlist-btn-${product.id} ${inWishlist ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlistItem('${product.id}')" style="width:35px; height:35px; border-radius:50%; border:none; background:white; cursor:pointer; font-size:18px; box-shadow:0 2px 5px rgba(0,0,0,0.2); ${inWishlist ? 'background:#e91e63;' : ''}" title="المفضلة">❤️</button>
            <button class="compare-btn-${product.id} ${inCompare ? 'active' : ''}" onclick="event.stopPropagation(); toggleCompareItem('${product.id}')" style="width:35px; height:35px; border-radius:50%; border:none; background:white; cursor:pointer; font-size:16px; box-shadow:0 2px 5px rgba(0,0,0,0.2); ${inCompare ? 'background:#2196F3;' : ''}" title="مقارنة">️</button>
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
    
    return `<div class="product-card" onclick="window.location.href='product.html?id=${product.id}'" style="cursor:pointer; position:relative;">${actionButtons}${badges}${discount > 0 ? `<div style="position:absolute; top:40px; right:10px; background:var(--danger-color); color:white; padding:3px 8px; border-radius:10px; font-size:11px; font-weight:bold; z-index:5;">-${discount}%</div>` : ''}<img src="${product.image}" class="product-image" onerror="this.src='https://via.placeholder.com/200?text=No+Image'"><div class="product-title">${product.name}</div><small style="color:var(--text-light)">${product.category || ''}</small>${product.oldPrice ? `<div class="old-price">${curr}${product.oldPrice}</div>` : ''}<div class="new-price">${curr}${product.price}</div><div class="product-options" onclick="event.stopPropagation();">${colorsHtml}<div class="qty-selector"><button class="qty-btn" onclick="event.stopPropagation(); changeQty('${product.id}', -1)">−</button><input type="number" id="qty-${product.id}" class="qty-input" value="1" min="1" max="10" readonly><button class="qty-btn" onclick="event.stopPropagation(); changeQty('${product.id}', 1)">+</button></div></div><button class="add-to-cart" onclick="event.stopPropagation(); addToCart('${product.id}', event)">أضف للسلة</button></div>`;
}

window.scrollSection = function(categoryName, direction) {
    const sectionId = `section-${categoryName.replace(/\s+/g, '-')}`;
    const container = document.getElementById(sectionId);
    if (container) container.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
};

// ============ بدء التشغيل ============
console.log('✅ بدء التشغيل...');
updateWishlistCount();
updateCompareCount();
loadStoreSettings().then(() => {
    updateCartCount();
    loadBannersSystem();
    loadCategories();
    loadProducts();
    checkWelcomeModal();
    showLiveNotification();
});
