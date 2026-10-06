import { db, collection, getDocs } from './firebase-config.js';
import { auth, signOut, onAuthStateChanged } from './firebase-config.js';

console.log('🚀 بدء تحميل المتجر...');

const ADMIN_EMAILS = ['ibrahimabushmud@gmail.com', 'sharafdguaeofficial@gmail.com'];
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
let curr = '';
let currLarge = '';
let currXLarge = '';
let carouselImages = [];
let currentSlide = 0;
let carouselInterval;

// ============ شعار العملة ============
function updateCurrencySymbols() {
    var icon = storeSettings.currencyIcon || '';
    var sizeP = storeSettings.currencySizeProduct || 10;
    var sizeC = storeSettings.currencySizeCart || 16;
    var sizeL = storeSettings.currencySizeLarge || 20;
    var text = storeSettings.currencyText || 'د.إ';
    
    if (icon) {
        curr = '<img src="' + icon + '" style="height:' + sizeP + 'px; width:auto; vertical-align:middle; margin-left:3px;">';
        currLarge = '<img src="' + icon + '" style="height:' + sizeC + 'px; width:auto; vertical-align:middle; margin-left:4px;">';
        currXLarge = '<img src="' + icon + '" style="height:' + sizeL + 'px; width:auto; vertical-align:middle; margin-left:4px;">';
    } else {
        curr = '<span style="font-weight:bold; color:var(--primary-color); margin-left:3px; font-size:' + sizeP + 'px;">' + text + '</span>';
        currLarge = '<span style="font-weight:bold; color:var(--primary-color); margin-left:4px; font-size:' + sizeC + 'px;">' + text + '</span>';
        currXLarge = '<span style="font-weight:bold; color:var(--primary-color); margin-left:4px; font-size:' + sizeL + 'px;">' + text + '</span>';
    }
}

// ============ تحميل الإعدادات ============
async function loadStoreSettings() {
    console.log('️ تحميل الإعدادات...');
    try {
        var snapshot = await getDocs(collection(db, "settings"));
        storeSettings = {};
        snapshot.forEach(function(docSnap) { 
            storeSettings[docSnap.id] = docSnap.data().value; 
        });
        console.log('✅ الإعدادات المحملة:', Object.keys(storeSettings).length);
        applySettings();
    } catch (error) {
        console.error('❌ خطأ في تحميل الإعدادات:', error);
        storeSettings = { 
            primaryColor: '#D4AF37', 
            storeName: 'شرف DG', 
            whatsapp: '+971592152484', 
            email: 'info@sharafdg.com', 
            freeShipping: 500, 
            welcomeEnabled: true, 
            welcomeDiscount: 10, 
            welcomeCode: 'WELCOME10', 
            countdownEnabled: true, 
            notificationsEnabled: true, 
            notifInterval: 15, 
            trustBadgesEnabled: true, 
            footerDesc: 'متجرك الإلكتروني الأول في الإمارات', 
            currencyIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/UAE_Dirham_Symbol.svg/1200px-UAE_Dirham_Symbol.svg.png', 
            currencySizeProduct: 10, 
            currencySizeCart: 16, 
            currencySizeLarge: 20, 
            currencyText: 'د.إ', 
            notifications: 'أحمد من دبي|آيفون 18 برو\nفاطمة من أبوظبي|سامسونج S26' 
        };
        applySettings();
    }
}

function applySettings() {
    console.log('🎨 تطبيق الإعدادات...');
    if (storeSettings.primaryColor) { 
        document.documentElement.style.setProperty('--primary-color', storeSettings.primaryColor); 
        document.documentElement.style.setProperty('--primary-dark', storeSettings.primaryColor); 
    }
    if (storeSettings.storeName) { 
        document.title = storeSettings.storeName; 
        var fn = document.getElementById('footerStoreName'); 
        if (fn) fn.textContent = storeSettings.storeName; 
    }
    if (storeSettings.whatsapp) { 
        var w = document.querySelector('.whatsapp-float'); 
        if (w) w.href = 'https://wa.me/' + storeSettings.whatsapp.replace(/[^0-9]/g,''); 
        var fw = document.getElementById('footerWhatsapp'); 
        if (fw) fw.textContent = '📱 ' + storeSettings.whatsapp; 
    }
    if (storeSettings.email) { 
        var fe = document.getElementById('footerEmail'); 
        if (fe) fe.textContent = '📧 ' + storeSettings.email; 
    }
    if (storeSettings.footerDesc) { 
        var fd = document.getElementById('footerDescription'); 
        if (fd) fd.textContent = storeSettings.footerDesc; 
    }
    if (storeSettings.facebook) { var fb = document.getElementById('footerFacebook'); if (fb) fb.href = storeSettings.facebook; }
    if (storeSettings.instagram) { var ig = document.getElementById('footerInstagram'); if (ig) ig.href = storeSettings.instagram; }
    if (storeSettings.twitter) { var tw = document.getElementById('footerTwitter'); if (tw) tw.href = storeSettings.twitter; }
    
    var badges = document.querySelector('.trust-badges'); 
    if (badges) badges.style.display = storeSettings.trustBadgesEnabled === false ? 'none' : 'grid';
    
    var productImageSize = storeSettings.productImageSize || 200;
    document.documentElement.style.setProperty('--product-image-height', productImageSize + 'px');
    updateCurrencySymbols();
    console.log('✅ تم تطبيق الإعدادات');
}

// ============ الوضع الداكن ============
window.toggleDarkMode = function() { 
    console.log('🌙 تبديل الوضع الداكن');
    document.body.classList.toggle('dark-mode'); 
    var isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    
    // تغيير أيقونة الزر
    var darkBtn = document.querySelector('button[onclick="toggleDarkMode()"]');
    if (darkBtn) {
        darkBtn.innerHTML = isDark ? '☀️' : '🌙';
        darkBtn.title = isDark ? 'الوضع الفاتح' : 'الوضع الداكن';
    }
    
    console.log('الوضع الداكن:', isDark ? 'مفعل' : 'معطل');
};

if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    var darkBtn = document.querySelector('button[onclick="toggleDarkMode()"]');
    if (darkBtn) {
        darkBtn.innerHTML = '☀️';
        darkBtn.title = 'الوضع الفاتح';
    }
}

// ============ تسجيل الدخول ============
onAuthStateChanged(auth, function(user) {
    var userMenuEl = document.getElementById('userMenu');
    if (userMenuEl) {
        if (user) {
            // ✅ فقط المدراء يرون رابط الإدارة
            if (ADMIN_EMAILS.includes(user.email)) {
                userMenuEl.innerHTML = '<a href="admin.html" style="color:var(--primary-color); text-decoration:none; font-weight:bold; margin-left:10px;">️ الإدارة</a>';
            } else {
                // المستخدم العادي - لا يظهر شيء
                userMenuEl.innerHTML = '';
            }
        } else {
            //  لا يوجد مستخدم - لا نظهر زر دخول
            userMenuEl.innerHTML = '';
        }
    }
});
window.doLogout = function() { 
    signOut(auth).then(function() { 
        window.location.reload(); 
    }); 
};

// ============ نافذة الترحيب ============
function checkWelcomeModal() {
    if (storeSettings.welcomeEnabled === false) return;
    if (!localStorage.getItem('hasVisited')) {
        setTimeout(function() {
            var modal = document.getElementById('welcomeModal');
            if (modal) {
                var discount = storeSettings.welcomeDiscount || 10;
                var code = storeSettings.welcomeCode || 'WELCOME10';
                var storeName = storeSettings.storeName || 'متجرنا';
                var h2 = modal.querySelector('h2');
                var p = modal.querySelector('p');
                var codeDiv = modal.querySelector('.discount-code');
                if (h2) h2.textContent = 'مرحباً بك في ' + storeName + '!';
                if (p) p.innerHTML = 'احصل على <b style="color:var(--danger-color); font-size:24px;">خصم ' + discount + '%</b>!';
                if (codeDiv) codeDiv.textContent = code;
                modal.style.display = 'flex';
                localStorage.setItem('hasVisited', 'true');
            }
        }, 3000);
    }
}

window.closeWelcomeModal = function() { 
    document.getElementById('welcomeModal').style.display = 'none'; 
};

window.claimDiscount = function() {
    var email = document.getElementById('welcomeEmail').value;
    if (!email || !email.includes('@')) { 
        alert('⚠️ بريد صحيح'); 
        return; 
    }
    localStorage.setItem('discountCode', storeSettings.welcomeCode || 'WELCOME10');
    alert('✅ الكود: ' + (storeSettings.welcomeCode || 'WELCOME10'));
    window.closeWelcomeModal();
};

// ============ البحث ============
window.searchProducts = function() {
    var query = document.getElementById('searchInput').value.toLowerCase().trim();
    var resultsDiv = document.getElementById('searchResults');
    if (query.length < 2) { 
        resultsDiv.style.display = 'none'; 
        return; 
    }
    var matches = allProducts.filter(function(p) { 
        return p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
    }).slice(0, 5);
    
    if (matches.length === 0) {
        resultsDiv.innerHTML = '<div style="padding:15px; text-align:center; color:#999;">لا نتائج</div>';
    } else {
        resultsDiv.innerHTML = matches.map(function(p) {
            return '<div class="search-result-item" onclick="window.location.href=\'product.html?id=' + p.id + '\'"><img src="' + p.image + '" style="width:50px; height:50px; object-fit:cover; border-radius:8px;"><div style="flex:1;"><div style="font-weight:bold; font-size:14px;">' + p.name + '</div><div style="color:var(--primary-color); font-weight:bold;">' + curr + p.price + '</div></div></div>';
        }).join('');
    }
    
    resultsDiv.style.display = 'block';
};

document.addEventListener('click', function(e) { 
    if (!e.target.closest('.search-container')) { 
        var sr = document.getElementById('searchResults'); 
        if (sr) sr.style.display = 'none'; 
    } 
});

// ============ المفضلة ============
window.toggleWishlist = function() { 
    var drawer = document.getElementById('wishlistDrawer');
    var overlay = document.getElementById('wishlistOverlay'); 
    
    if (!drawer) return;
    
    var isOpen = drawer.classList.contains('open');
    
    if (isOpen) {
        drawer.classList.remove('open');
        if (overlay) {
            overlay.classList.remove('show');
            // إزالة مستمع الحدث عند الإغلاق
            overlay.onclick = null;
        }
    } else {
        drawer.classList.add('open');
        if (overlay) {
            overlay.classList.add('show');
            // إضافة مستمع حدث للإغلاق عند الضغط على الـ overlay
            overlay.onclick = function(e) {
                if (e.target === overlay) {
                    window.closeWishlist();
                }
            };
        }
        renderWishlist();
    }
};

window.closeWishlist = function() {
    var drawer = document.getElementById('wishlistDrawer');
    var overlay = document.getElementById('wishlistOverlay'); 
    if (drawer) { 
        drawer.classList.remove('open'); 
    }
    if (overlay) { 
        overlay.classList.remove('show');
        overlay.onclick = null;
    }
};

window.toggleWishlistItem = function(productId, event) {
    if (event) { 
        event.preventDefault(); 
        event.stopPropagation(); 
    }
    var index = wishlist.indexOf(productId);
    if (index > -1) { 
        wishlist.splice(index, 1); 
        showToast('تم الإزالة من المفضلة', '#e91e63'); 
    } else { 
        wishlist.push(productId); 
        showToast('تمت الإضافة إلى المفضلة', '#e91e63'); 
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist)); 
    updateWishlistCount();
    
    var btn = document.querySelector('.wishlist-btn-' + productId);
    if (btn) {
        var isNow = wishlist.includes(productId);
        if (isNow) {
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#e91e63" stroke="#e91e63" stroke-width="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
        } else {
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
        }
    }
};

function updateWishlistCount() { 
    var el = document.getElementById('wishlistCount'); 
    if (el) el.textContent = wishlist.length; 
}

function renderWishlist() {
    var content = document.getElementById('wishlistContent');
    if (!content) return;
    if (wishlist.length === 0) { 
        content.innerHTML = '<div class="empty-cart"><div class="icon">❤️</div><h3>المفضلة فارغة</h3><p>أضف منتجات للمفضلة</p></div>'; 
        return; 
    }
    var cartImgSize = storeSettings.cartImageSize || 80;
    var wishlistProducts = allProducts.filter(function(p) { return wishlist.includes(p.id); });
    content.innerHTML = wishlistProducts.map(function(product) {
        return '<div class="cart-item"><img src="' + product.image + '" onerror="this.src=\'https://via.placeholder.com/80\'" style="width:' + cartImgSize + 'px; height:' + cartImgSize + 'px; object-fit:cover; border-radius:10px;"><div class="cart-item-info"><h4>' + product.name + '</h4><div class="price">' + curr + product.price + '</div></div><div class="cart-item-actions"><button onclick="addToCart(\'' + product.id + '\'); toggleWishlistItem(\'' + product.id + '\')" style="background:var(--primary-color); color:white; border:none; padding:8px 12px; border-radius:15px; cursor:pointer; font-family:\'Tajawal\'; font-size:12px;">أضف للسلة</button><button onclick="toggleWishlistItem(\'' + product.id + '\')" class="remove-btn">حذف</button></div></div>';
    }).join('');
}

// ============ المقارنة ============
window.toggleCompare = function() { 
    var modal = document.getElementById('compareModal'); 
    if (modal) { 
        modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex'; 
        if (modal.style.display === 'flex') renderCompare(); 
    } 
};

window.toggleCompareItem = function(productId, event) {
    if (event) { 
        event.preventDefault(); 
        event.stopPropagation(); 
    }
    var index = compareList.indexOf(productId);
    if (index > -1) { 
        compareList.splice(index, 1); 
        showToast('تم الإزالة من المقارنة', '#2196F3'); 
    } else {
        if (compareList.length >= 4) { 
            alert('4 منتجات كحد أقصى'); 
            return; 
        }
        compareList.push(productId); 
        showToast('تمت الإضافة للمقارنة', '#2196F3');
    }
    localStorage.setItem('compareList', JSON.stringify(compareList)); 
    updateCompareCount();
    
    var btn = document.querySelector('.compare-btn-' + productId);
    if (btn) {
        var isNow = compareList.includes(productId);
        if (isNow) {
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#2196F3" stroke="#2196F3" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
        } else {
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
        }
    }
};

function updateCompareCount() { 
    var el = document.getElementById('compareCount'); 
    if (el) el.textContent = compareList.length; 
}

function renderCompare() {
    var content = document.getElementById('compareContent');
    if (!content) return;
    if (compareList.length === 0) { 
        content.innerHTML = '<div style="text-align:center; padding:40px;"><h3>لم تقارن أي منتج بعد</h3><p>اضغط على أيقونة المقارنة ⚖️ في المنتجات</p></div>'; 
        return; 
    }
    var ps = allProducts.filter(function(p) { return compareList.includes(p.id); });
    var html = '<div style="display:grid; grid-template-columns:repeat(' + ps.length + ', 1fr); gap:20px;">';
    ps.forEach(function(p) {
        html += '<div style="text-align:center;"><img src="' + p.image + '" style="width:100%; height:150px; object-fit:contain; border-radius:10px;"><h4 style="margin:10px 0;">' + p.name + '</h4><div style="font-size:20px; font-weight:bold; color:var(--primary-color);">' + curr + p.price + '</div><button onclick="addToCart(\'' + p.id + '\')" style="background:var(--primary-color); color:white; border:none; padding:10px 20px; border-radius:20px; cursor:pointer; font-family:\'Tajawal\'; margin-top:10px;">أضف للسلة</button><button onclick="toggleCompareItem(\'' + p.id + '\'); renderCompare();" style="background:#dc3545; color:white; border:none; padding:8px 15px; border-radius:15px; cursor:pointer; font-family:\'Tajawal\'; margin-top:10px; font-size:12px;">إزالة</button></div>';
    });
    html += '</div>';
    content.innerHTML = html;
}

// ============ السلة ============
function updateCartCount() { 
    var count = cart.reduce(function(sum, item) { return sum + item.quantity; }, 0); 
    var el = document.getElementById('cartCount'); 
    if (el) el.textContent = count; 
    localStorage.setItem('cart', JSON.stringify(cart)); 
    updateShippingProgress(); 
}

function updateShippingProgress() {
    var threshold = storeSettings.freeShipping || 500;
    var total = cart.reduce(function(sum, item) { return sum + (item.price * item.quantity); }, 0);
    var remaining = Math.max(0, threshold - total);
    var progress = Math.min(100, (total / threshold) * 100);
    var remainingEl = document.getElementById('shippingRemaining');
    var progressBar = document.getElementById('shippingProgressBar');
    var totalBox = document.getElementById('cartTotalBox');
    
    if (totalBox) totalBox.style.display = cart.length > 0 ? 'block' : 'none';
    if (remainingEl) {
        if (remaining > 0) { 
            remainingEl.textContent = 'أضف ' + curr + remaining.toFixed(2) + ' للشحن المجاني'; 
            if (progressBar) { 
                progressBar.style.width = progress + '%'; 
                progressBar.style.background = 'var(--primary-color)'; 
            } 
        } else { 
            remainingEl.innerHTML = '<span style="color:var(--success-color); font-weight:bold;">✅ شحن مجاني!</span>'; 
            if (progressBar) { 
                progressBar.style.width = '100%'; 
                progressBar.style.background = 'var(--success-color)'; 
            } 
        }
    }
}

window.toggleCategories = function() { 
    var sidebar = document.getElementById('categoriesSidebar');
    var overlay = document.getElementById('sidebarOverlay'); 
    if (sidebar) sidebar.classList.toggle('open'); 
    if (overlay) overlay.classList.toggle('show'); 
};

window.toggleCart = function(e) { 
    if (e) { 
        e.preventDefault(); 
        e.stopPropagation(); 
    }
    var drawer = document.getElementById('cartDrawer');
    var overlay = document.getElementById('cartOverlay'); 
    if (drawer) { 
        drawer.classList.toggle('open'); 
        if (overlay) overlay.classList.toggle('show'); 
        renderCartDrawer(); 
    } 
};

// ============ كوبونات ============
window.applyCoupon = function() {
    var code = document.getElementById('couponInput').value.trim().toUpperCase();
    var messageEl = document.getElementById('couponMessage');
    if (!code) { 
        messageEl.innerHTML = '<span style="color:#dc3545;">️ أدخل الكود</span>'; 
        return; 
    }
    var coupons = { 
        'WELCOME10': { type: 'percent', value: 10, description: 'خصم 10%' }, 
        'SAVE20': { type: 'percent', value: 20, description: 'خصم 20%' }, 
        'SUMMER15': { type: 'percent', value: 15, description: 'خصم 15%' }, 
        'FLAT100': { type: 'fixed', value: 100, description: 'خصم 100 د.إ' } 
    };
    if (coupons[code]) { 
        appliedCoupon = { code: code, type: coupons[code].type, value: coupons[code].value, description: coupons[code].description }; 
        messageEl.innerHTML = '<span style="color:#28a745;">✅ ' + coupons[code].description + '</span>'; 
    } else { 
        appliedCoupon = null; 
        messageEl.innerHTML = '<span style="color:#dc3545;">❌ غير صالح</span>'; 
    }
    renderCartDrawer();
};

function calcDiscount(sub) { 
    if (!appliedCoupon) return 0; 
    if (appliedCoupon.type === 'percent') {
        return (sub * appliedCoupon.value) / 100;
    }
    return appliedCoupon.value;
}

function renderCartDrawer() {
    var content = document.getElementById('cartContent');
    var totalEl = document.getElementById('cartTotal');
    var subtotalEl = document.getElementById('cartSubtotal');
    var discountRow = document.getElementById('discountRow');
    var discountAmount = document.getElementById('discountAmount');
    
    if (!content) return;
    
    var cartImgSize = storeSettings.cartImageSize || 80;
    
    if (cart.length === 0) {
        content.innerHTML = '<div class="empty-cart"><div class="icon">🛒</div><h3>السلة فارغة</h3><button onclick="toggleCart();window.location.href=\'index.html\'" style="background:var(--primary-color); color:white; border:none; padding:12px 30px; border-radius:25px; font-family:\'Tajawal\'; font-weight:bold; margin-top:15px; cursor:pointer;">تصفح</button></div>';
        if (totalEl) totalEl.innerHTML = currXLarge + '0';
        if (discountRow) discountRow.style.display = 'none';
        return;
    }
    
    var html = '';
    var sub = 0;
    cart.forEach(function(it, i) {
        sub += it.price * it.quantity;
        html += '<div class="cart-item"><img src="' + it.image + '" onerror="this.src=\'https://via.placeholder.com/80\'" style="width:' + cartImgSize + 'px; height:' + cartImgSize + 'px; object-fit:cover; border-radius:10px;"><div class="cart-item-info"><h4>' + it.name + '</h4><span class="color-tag">' + it.color + '</span><div class="price">' + curr + it.price + '</div></div><div class="cart-item-actions"><div class="qty-controls"><button onclick="updateCartQty(' + i + ',1)">+</button><span style="font-weight:bold; min-width:20px; text-align:center;">' + it.quantity + '</span><button onclick="updateCartQty(' + i + ',-1)">−</button></div><button class="remove-btn" onclick="removeFromCart(' + i + ')">حذف</button></div></div>';
    });
    
    content.innerHTML = html;
    if (subtotalEl) subtotalEl.innerHTML = currLarge + sub.toFixed(2);
    var disc = calcDiscount(sub);
    var tot = sub - disc;
    if (discountRow && discountAmount) { 
        if (disc > 0) { 
            discountRow.style.display = 'flex'; 
            discountAmount.innerHTML = '-' + currLarge + disc.toFixed(2); 
        } else {
            discountRow.style.display = 'none';
        }
    }
    if (totalEl) totalEl.innerHTML = currXLarge + tot.toFixed(2);
    updateShippingProgress();
}

window.updateCartQty = function(i, d) { 
    cart[i].quantity += d; 
    if (cart[i].quantity < 1) cart[i].quantity = 1; 
    if (cart[i].quantity > 10) cart[i].quantity = 10; 
    updateCartCount(); 
    renderCartDrawer(); 
};

window.removeFromCart = function(i) { 
    if (confirm('حذف؟')) { 
        cart.splice(i, 1); 
        updateCartCount(); 
        renderCartDrawer(); 
    } 
};

window.addToCart = function(pid, e) {
    if (e) { 
        e.preventDefault(); 
        e.stopPropagation(); 
    }
    var p = allProducts.find(function(x) { return x.id === pid; });
    if (!p) { 
        alert('المنتج غير موجود'); 
        return; 
    }
    var qi = document.getElementById('qty-' + pid);
    var qty = qi ? parseInt(qi.value) || 1 : 1;
    var col = 'افتراضي';
    document.querySelectorAll('.color-btn-' + pid).forEach(function(b) { 
        if (b.classList.contains('selected')) col = b.getAttribute('data-color'); 
    });
    var cid = pid + '_' + col;
    var ex = cart.find(function(x) { return x.id === cid; });
    if (ex) ex.quantity += qty; 
    else cart.push({ id: cid, productId: pid, name: p.name, price: p.price, image: p.image, color: col, quantity: qty });
    updateCartCount(); 
 showToast('تمت إضافة المنتج للسلة', '#27AE60');
};
window.changeQty = function(pid, d) { 
    var i = document.getElementById('qty-' + pid); 
    if (i) { 
        var v = parseInt(i.value) || 1; 
        v += d; 
        if (v < 1) v = 1; 
        if (v > 10) v = 10; 
        i.value = v; 
    } 
};

window.selectColor = function(pid, cn, b) { 
    document.querySelectorAll('.color-btn-' + pid).forEach(function(x) { x.classList.remove('selected'); }); 
    b.classList.add('selected'); 
};
function showToast(msg, col) {
    col = col || '#27AE60';
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;top:100px;left:50%;transform:translateX(-50%);background:' + col + ';color:white;padding:15px 30px;border-radius:25px;z-index:3000;font-weight:bold;box-shadow:0 4px 15px rgba(0,0,0,0.2);font-family:Tajawal,sans-serif;animation:slideDown 0.3s ease;font-size:16px;';
    t.textContent = msg; 
    document.body.appendChild(t);
    setTimeout(function() { 
        t.style.opacity = '0'; 
        t.style.transition = 'opacity 0.3s'; 
        setTimeout(function() { t.remove(); }, 300); 
    }, 2500);
}
// ============ البنرات ============
async function loadBannersSystem() {
    console.log('️ تحميل البنرات...');
    try {
        var snap = await getDocs(collection(db, "banners"));
        var tb = document.getElementById('topBanner');
        var cc = document.getElementById('carouselContainer');
        var cs = document.getElementById('carouselSlides');
        var cd = document.getElementById('carouselDots');
        
        carouselImages = []; 
        var tbu = '';
        
        snap.forEach(function(d) { 
            var b = d.data(); 
            if (b.isActive) { 
                if (b.type === 'top') tbu = b.imageUrl; 
                else carouselImages.push({ id: d.id, url: b.imageUrl, link: b.link || '#', order: b.order || 100 }); 
            } 
        });
        
        carouselImages.sort(function(a, b) { return a.order - b.order; });
        
        if (tb && tbu) { 
            tb.innerHTML = '<img src="' + tbu + '" style="width:100%; max-height:120px; object-fit:cover;">'; 
            tb.style.display = 'block'; 
        }
        
        if (cc && cs && cd) {
            if (carouselImages.length > 0) {
                cc.style.display = 'block'; 
                cc.classList.add('show'); 
                cs.innerHTML = ''; 
                cd.innerHTML = '';
                
                carouselImages.forEach(function(img, i) {
                    var s = document.createElement('div'); 
                    s.style.cssText = 'min-width:100%; position:relative;';
                    s.innerHTML = '<a href="' + img.link + '" target="_blank"><img src="' + img.url + '" style="width:100%; height:400px; object-fit:cover; display:block;" onerror="this.parentElement.style.display=\'none\';"></a>';
                    cs.appendChild(s);
                    
                    var dot = document.createElement('button'); 
                    dot.style.cssText = 'width:12px; height:12px; border-radius:50%; border:none; cursor:pointer; background:' + (i === 0 ? 'var(--primary-color)' : 'rgba(0,0,0,0.3)') + '; transition:0.3s;'; 
                    dot.onclick = function() { goToSlide(i); }; 
                    cd.appendChild(dot);
                });
                
                startCarousel();
                console.log('✅ السلايدر ظاهر مع', carouselImages.length, 'صورة');
            } else { 
                cc.style.display = 'none'; 
            }
        }
    } catch (e) { 
        console.error('❌ خطأ في البنرات:', e); 
    }
}

function startCarousel() { 
    if (carouselInterval) clearInterval(carouselInterval); 
    carouselInterval = setInterval(function() { moveSlide(1); }, 3000); 
}

window.moveSlide = function(d) { 
    if (carouselImages.length === 0) return; 
    currentSlide = (currentSlide + d + carouselImages.length) % carouselImages.length; 
    updateCarousel(); 
    startCarousel(); 
};

window.goToSlide = function(i) { 
    currentSlide = i; 
    updateCarousel(); 
    startCarousel(); 
};

function updateCarousel() { 
    var s = document.getElementById('carouselSlides');
    var dots = document.querySelectorAll('#carouselDots button'); 
    if (!s) return; 
    s.style.transform = 'translateX(' + (currentSlide * 100) + '%)'; 
    dots.forEach(function(x, i) { 
        x.style.background = i === currentSlide ? 'var(--primary-color)' : 'rgba(0,0,0,0.3)'; 
    }); 
}

var cce = document.getElementById('carouselContainer');
if (cce) { 
    cce.addEventListener('mouseenter', function() { 
        if (carouselInterval) clearInterval(carouselInterval); 
    }); 
    cce.addEventListener('mouseleave', function() { startCarousel(); }); 
}

// ============ العداد التنازلي ============
function startCountdown() {
    if (storeSettings.countdownEnabled === false) return;
    var ce = document.getElementById('countdownTimer'); 
    if (!ce) return;
    var end = new Date(); 
    end.setHours(23, 59, 59, 999);
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(function() {
        var now = new Date();
        var diff = end - now;
        if (diff <= 0) { 
            ce.textContent = '00:00:00'; 
            return; 
        }
        var h = Math.floor(diff / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        var s = Math.floor((diff % 60000) / 1000);
        ce.textContent = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    }, 1000);
}

// ============ الإشعارات ============
function showLiveNotification() {
    if (storeSettings.notificationsEnabled === false) return;
    var txt = storeSettings.notifications || '';
    var notifs = txt.split('\n').filter(function(n) { return n.trim(); }).map(function(n) { 
        var parts = n.split('|'); 
        return { name: parts[0] || '', product: parts[1] || '', time: 'قبل دقائق' }; 
    });
    if (notifs.length === 0) return;
    var intv = (storeSettings.notifInterval || 15) * 1000;
    var idx = 0; 
    var c = document.getElementById('liveNotifications'); 
    if (!c) return;
    if (notifInterval) clearInterval(notifInterval);
    notifInterval = setInterval(function() {
        var n = notifs[idx % notifs.length];
        var el = document.createElement('div');
        el.style.cssText = 'background:white; padding:15px; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.2); margin-bottom:10px; animation:slideInLeft 0.5s ease; max-width:300px; border-right:4px solid var(--primary-color);';
        el.innerHTML = '<div style="font-size:14px; font-weight:bold; color:var(--primary-color);">🛍️ عملية شراء</div><div style="font-size:13px; margin:5px 0;"><b>' + n.name + '</b> اشترى <b>' + n.product + '</b></div><div style="font-size:11px; color:#999;">' + n.time + '</div>';
        c.appendChild(el);
        setTimeout(function() { 
            el.style.opacity = '0'; 
            el.style.transition = 'opacity 0.5s'; 
            setTimeout(function() { el.remove(); }, 500); 
        }, 5000);
        idx++;
    }, intv);
}

// ============ الأقسام ============
async function loadCategories() {
    console.log('📁 بدء تحميل الأقسام...');
    
    var sidebar = document.getElementById('categoriesSidebar');
    if (!sidebar) {
        console.error('❌ عنصر categoriesSidebar غير موجود!');
        sidebar = document.createElement('div');
        sidebar.id = 'categoriesSidebar';
        sidebar.className = 'categories-sidebar';
        document.body.appendChild(sidebar);
        
        var overlay = document.createElement('div');
        overlay.id = 'sidebarOverlay';
        overlay.className = 'sidebar-overlay';
        overlay.onclick = function() { toggleCategories(); };
        document.body.appendChild(overlay);
        
        console.log('✅ تم إنشاء العناصر تلقائياً');
    }
    
    try {
        console.log('📡 جاري الاتصال بـ Firebase...');
        var snapshot = await getDocs(collection(db, "categories"));
        console.log('📊 عدد المستندات المحملة:', snapshot.size);
        
        allCategories = [];
        
        if (snapshot.empty) {
            console.warn('⚠️ لا توجد أقسام في Firebase!');
        } else {
            snapshot.forEach(function(doc) {
                var data = doc.data();
                console.log('📂 قسم:', data.name, '| المستوى:', data.level, '| الأب:', data.parentCategory);
                
                var level = data.level;
                if (!level) {
                    level = data.parentCategory ? 2 : 1;
                }
                
                allCategories.push({ 
                    id: doc.id, 
                    name: data.name,
                    level: level,
                    parentCategory: data.parentCategory || null,
                    order: data.order || 100
                });
            });
            
            allCategories.sort(function(a, b) { return a.order - b.order; });
            console.log('✅ الأقسام بعد المعالجة:', allCategories.length);
        }
        
        renderCategorySidebar();
    } catch (error) {
        console.error('❌ خطأ في تحميل الأقسام:', error);
        console.error('📝 تفاصيل الخطأ:', error.message);
        allCategories = [];
    }
}

// ============ القائمة الجانبية (نصوص فقط بدون أيقونات) ============
function renderCategorySidebar() {
    console.log('🎨 رسم القائمة الجانبية...');
    var sidebar = document.getElementById('categoriesSidebar'); 
    if (!sidebar) {
        console.error(' sidebar غير موجود');
        return;
    }
    
    sidebar.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:15px; border-bottom:2px solid var(--accent-color);"><h3 style="color:var(--primary-color); margin:0; font-size:20px;">جميع التصنيفات</h3><button onclick="toggleCategories()" style="background:none; border:none; font-size:24px; cursor:pointer;">✕</button></div>';
    
    var allBtn = document.createElement('div'); 
    allBtn.className = 'category-item active'; 
    allBtn.dataset.category = 'all'; 
    allBtn.innerHTML = 'عرض الكل'; 
    allBtn.style.cssText = 'font-weight:bold; font-size:17px; padding:15px 20px; background:var(--accent-color); border-radius:8px; margin-bottom:10px;';
    allBtn.onclick = function() { filterCategory('all'); }; 
    sidebar.appendChild(allBtn);
    
    if (allCategories.length === 0) { 
        sidebar.innerHTML += '<div style="padding:20px; text-align:center; color:#999;">لا توجد أقسام بعد</div>'; 
        console.log('⚠️ لا توجد أقسام');
        return; 
    }
    
    var level1Cats = allCategories.filter(function(c) { return c.level === 1; });
    console.log('📁 الأقسام الرئيسية:', level1Cats.length);
    
    level1Cats.forEach(function(mainCat) {
        var mainItem = document.createElement('div'); 
        mainItem.className = 'category-item'; 
        mainItem.dataset.category = mainCat.name; 
        mainItem.style.cssText = 'font-weight:bold; font-size:16px; padding:14px 20px; border-bottom:1px solid #f0f0f0; cursor:pointer; transition:0.3s;';
        mainItem.innerHTML = mainCat.name; 
        mainItem.onclick = function() { filterCategory(mainCat.name); }; 
        sidebar.appendChild(mainItem);
        
        var level2Cats = allCategories.filter(function(c) { return c.parentCategory === mainCat.name; });
        level2Cats.forEach(function(subCat) {
            var subItem = document.createElement('div'); 
            subItem.className = 'category-item'; 
            subItem.dataset.category = subCat.name; 
            subItem.style.cssText = 'padding:12px 20px 12px 40px; font-size:15px; color:#555; border-bottom:1px solid #f9f9f9; cursor:pointer; transition:0.3s;'; 
            subItem.innerHTML = subCat.name; 
            subItem.onclick = function() { filterCategory(subCat.name); }; 
            sidebar.appendChild(subItem);
            
            var level3Cats = allCategories.filter(function(c) { return c.parentCategory === subCat.name; });
            level3Cats.forEach(function(subSubCat) {
                var subSubItem = document.createElement('div'); 
                subSubItem.className = 'category-item'; 
                subSubItem.dataset.category = subSubCat.name; 
                subSubItem.style.cssText = 'padding:10px 20px 10px 60px; font-size:14px; color:#777; border-bottom:1px solid #f9f9f9; cursor:pointer; transition:0.3s;'; 
                subSubItem.innerHTML = subSubCat.name; 
                subSubItem.onclick = function() { filterCategory(subSubCat.name); }; 
                sidebar.appendChild(subSubItem);
            });
        });
    });
    
    console.log('✅ تم رسم القائمة الجانبية بنجاح');
}

// ============ فلترة الأقسام ============
window.filterCategory = function(category) {
    console.log('🔍 تصفية القسم:', category);
    currentCategory = category;
    
    var sidebar = document.getElementById('categoriesSidebar');
    var overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar) sidebar.classList.remove('open'); 
    if (overlay) overlay.classList.remove('show');
    
    document.querySelectorAll('.category-item').forEach(function(el) { 
        el.classList.remove('active'); 
        el.style.background = '';
        el.style.color = '';
    });
    
    var activeItem = document.querySelector('.category-item[data-category="' + category + '"]');
    if (activeItem) {
        activeItem.classList.add('active');
        activeItem.style.background = 'var(--primary-color)';
        activeItem.style.color = 'white';
        activeItem.style.borderRadius = '8px';
    }
    
    // ✅ إخفاء الأقسام الخاصة عند اختيار قسم محدد
    if (category !== 'all') {
        document.getElementById('bestSellersSection').style.display = 'none';
        document.getElementById('newArrivalsSection').style.display = 'none';
        document.getElementById('flashSaleSection').style.display = 'none';
    }
    
    renderProductsByCategory();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('✅ تم تصفية القسم:', category);
};

function getAllSubCategories(parentName) {
    var subs = allCategories.filter(function(c) { return c.parentCategory === parentName; });
    var allNames = [parentName];
    subs.forEach(function(sub) { 
        allNames = allNames.concat(getAllSubCategories(sub.name)); 
    });
    return allNames;
}

// ============ المنتجات ============
async function loadProducts() {
    console.log('📦 تحميل المنتجات...');
    try {
        var snapshot = await getDocs(collection(db, "products"));
        console.log('📊 عدد المنتجات المحملة:', snapshot.size);
        
        allProducts = [];
        snapshot.forEach(function(doc) {
            var data = doc.data();
            console.log('📦 منتج:', data.name, '| القسم:', data.category, '| السعر:', data.price);
            
            allProducts.push({ 
                id: doc.id, 
                name: data.name,
                image: data.image,
                category: data.category,
                price: data.price,
                oldPrice: data.oldPrice || null,
                order: data.order || 100, 
                isNew: data.isNew || false, 
                isSale: data.isSale || false, 
                discountPercent: data.discountPercent || 0, 
                saleEndDate: data.saleEndDate || null, 
                displayLocation: data.displayLocation || 'all', 
                hasColors: data.hasColors || false,
                colors: data.colors || '',
                salesCount: data.salesCount || Math.floor(Math.random() * 100) 
            });
        });
        
        allProducts.sort(function(a, b) { return a.order - b.order; });
        console.log('✅ المنتجات بعد المعالجة:', allProducts.length);
        
        renderSpecialSections();
        renderProductsByCategory();
    } catch (error) { 
        console.error(' خطأ في تحميل المنتجات:', error); 
    }
}

function renderSpecialSections() {
    console.log('🎨 عرض الأقسام الخاصة...');
    var bestSellers = allProducts.slice().sort(function(a, b) { return b.salesCount - a.salesCount; }).slice(0, 10);
    if (bestSellers.length > 0) { 
        document.getElementById('bestSellersSection').style.display = 'block'; 
        document.getElementById('bestSellersScroll').innerHTML = bestSellers.map(function(p) { return createProductCard(p, true); }).join(''); 
    }
    
    var newArrivals = allProducts.filter(function(p) { return p.isNew; }).slice(0, 10);
    if (newArrivals.length > 0) { 
        document.getElementById('newArrivalsSection').style.display = 'block'; 
        document.getElementById('newArrivalsScroll').innerHTML = newArrivals.map(function(p) { return createProductCard(p); }).join(''); 
    }
    
    var flashSales = allProducts.filter(function(p) { return p.isSale && p.discountPercent > 0; });
    if (flashSales.length > 0) { 
        document.getElementById('flashSaleSection').style.display = 'block'; 
        document.getElementById('flashSaleScroll').innerHTML = flashSales.map(function(p) { return createProductCard(p); }).join(''); 
        startCountdown(); 
    }
}

function renderProductsByCategory() {
    console.log('🎯 عرض المنتجات حسب الأقسام...');
    console.log('📊 عدد الأقسام:', allCategories.length);
    console.log(' عدد المنتجات:', allProducts.length);
    
    var container = document.getElementById('productsByCategory'); 
    if (!container) {
        console.error('❌ عنصر productsByCategory غير موجود!');
        return;
    }
    
    container.innerHTML = '';
    
    if (currentCategory === 'all') {
        var level1Cats = allCategories.filter(function(c) { return c.level === 1; });
        console.log('📁 الأقسام الرئيسية:', level1Cats.length);
        
        if (level1Cats.length === 0) {
            console.log('️ لا توجد أقسام، عرض كل المنتجات');
            var allVisible = allProducts.filter(function(p) { return p.displayLocation !== 'hidden'; });
            if (allVisible.length > 0) {
                renderCategorySection('جميع المنتجات', allVisible);
            } else {
                container.innerHTML = '<div style="text-align:center; padding:50px; color:#666;">لا توجد منتجات</div>';
            }
        } else {
            level1Cats.forEach(function(mainCat) {
                console.log('📁 عرض القسم:', mainCat.name);
                var mainSection = document.createElement('div'); 
                mainSection.style.marginBottom = '40px';
                mainSection.innerHTML = '<div class="section-header" style="margin-bottom:20px;"><h2 class="section-title" style="font-size:24px; border-right:5px solid var(--primary-color); padding-right:15px;"> ' + mainCat.name + '</h2></div>';
                container.appendChild(mainSection);
                displaySubCategoriesWithProducts(mainCat.name, container);
            });
        }
    } else {
        var allCats = getAllSubCategories(currentCategory);
        var categoryProducts = allProducts.filter(function(p) { return allCats.includes(p.category) && p.displayLocation !== 'hidden'; });
        console.log(' قسم محدد:', currentCategory, '| المنتجات:', categoryProducts.length);
        
        if (categoryProducts.length > 0) {
            displaySubCategoriesWithProducts(currentCategory, container);
        } else {
            container.innerHTML = '<div style="text-align:center; padding:50px; color:#666;">لا توجد منتجات في هذا القسم</div>';
        }
    }
}

function displaySubCategoriesWithProducts(parentName, container) {
    console.log('📂 عرض فرع:', parentName);
    var subs = allCategories.filter(function(c) { return c.parentCategory === parentName; });
    var directProducts = allProducts.filter(function(p) { return p.category === parentName && p.displayLocation !== 'hidden'; });
    
    if (directProducts.length > 0) {
        console.log('  -', directProducts.length, 'منتج مباشر');
        var section = document.createElement('div'); 
        section.style.marginBottom = '30px';
        section.innerHTML = '<div class="section-header" style="margin-bottom:15px;"><h3 class="section-title" style="font-size:20px; color:#666;"> منتجات ' + parentName + '</h3></div><div class="products-scroll" style="padding:15px 10px;">' + directProducts.map(function(p) { return createProductCard(p); }).join('') + '</div>';
        container.appendChild(section);
    }
    
    subs.forEach(function(subCat) {
        var subSubs = allCategories.filter(function(c) { return c.parentCategory === subCat.name; });
        var subProducts = allProducts.filter(function(p) { return p.category === subCat.name && p.displayLocation !== 'hidden'; });
        
        if (subProducts.length > 0 || subSubs.length > 0) {
            console.log('  - فرع:', subCat.name, '(' + subProducts.length, 'منتج)');
            var subSection = document.createElement('div'); 
            subSection.style.marginBottom = '30px'; 
            subSection.style.paddingRight = '20px'; 
            subSection.style.borderRight = '3px solid var(--accent-color)';
            subSection.innerHTML = '<div class="section-header" style="margin-bottom:15px;"><h3 class="section-title" style="font-size:22px;">📂 ' + subCat.name + '</h3></div>';
            container.appendChild(subSection);
            
            if (subProducts.length > 0) {
                var productsSection = document.createElement('div'); 
                productsSection.style.marginBottom = '20px';
                productsSection.innerHTML = '<div class="products-scroll" style="padding:15px 10px;">' + subProducts.map(function(p) { return createProductCard(p); }).join('') + '</div>';
                container.appendChild(productsSection);
            }
            
            subSubs.forEach(function(subSubCat) {
                var subSubProducts = allProducts.filter(function(p) { return p.category === subSubCat.name && p.displayLocation !== 'hidden'; });
                if (subSubProducts.length > 0) {
                    console.log('    - فرع فرعي:', subSubCat.name, '(' + subSubProducts.length, 'منتج)');
                    var subSubSection = document.createElement('div'); 
                    subSubSection.style.marginBottom = '20px'; 
                    subSubSection.style.paddingRight = '40px';
                    subSubSection.innerHTML = '<div class="section-header" style="margin-bottom:10px;"><h4 class="section-title" style="font-size:18px; color:#888;">📄 ' + subSubCat.name + '</h4></div><div class="products-scroll" style="padding:10px;">' + subSubProducts.map(function(p) { return createProductCard(p); }).join('') + '</div>';
                    container.appendChild(subSubSection);
                }
            });
        }
    });
}

function renderCategorySection(categoryName, products) {
    var container = document.getElementById('productsByCategory'); 
    if (!container || products.length === 0) return;
    var section = document.createElement('div'); 
    section.style.marginBottom = '40px';
    section.innerHTML = '<div class="section-header"><h2 class="section-title">' + categoryName + '</h2><div class="nav-arrows"><button class="nav-arrow" onclick="scrollSection(\'' + categoryName + '\', \'right\')">›</button><button class="nav-arrow" onclick="scrollSection(\'' + categoryName + '\', \'left\')">‹</button></div></div><div class="products-scroll" id="section-' + categoryName.replace(/\s+/g, '-') + '">' + products.map(function(product) { return createProductCard(product); }).join('') + '</div>';
    container.appendChild(section);
}

// ============ بطاقة المنتج ============
function createProductCard(product, showSalesBadge) {
    showSalesBadge = showSalesBadge || false;
    var discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
    var inWishlist = wishlist.includes(product.id);
    var inCompare = compareList.includes(product.id);
    
    var badges = '';
    if (product.isNew) 
        badges += '<div style="position:absolute; top:10px; right:10px; background:#28a745; color:white; padding:5px 12px; border-radius:15px; font-size:12px; font-weight:bold; z-index:10;"> جديد</div>';
    if (product.isSale && product.discountPercent) {
        var endDate = product.saleEndDate ? new Date(product.saleEndDate) : null;
        if (!(endDate && endDate < new Date())) 
            badges += '<div style="position:absolute; top:50px; right:10px; background:#dc3545; color:white; padding:3px 8px; border-radius:10px; font-size:11px; font-weight:bold; z-index:9;">خصم ' + product.discountPercent + '%</div>';
    }
    if (showSalesBadge && product.salesCount > 50) 
        badges += '<div style="position:absolute; bottom:10px; right:10px; background:var(--primary-color); color:white; padding:5px 12px; border-radius:15px; font-size:11px; font-weight:bold; z-index:10;">🏆 الأكثر مبيعاً</div>';
    
    // ✅ أيقونات المفضلة والمقارنة - القلب فقط يتلون (بدون خلفية)
    var heartSvg;
    if (inWishlist) {
        heartSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#e91e63" stroke="#e91e63" stroke-width="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
    } else {
        heartSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
    }
    
    // ✅ أيقونة المقارنة - ميزان واضح
    var compareSvg;
    if (inCompare) {
        compareSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#2196F3" stroke="#2196F3" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
    } else {
        compareSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
    }
    
    var actionButtons = '<div style="position:absolute; top:10px; left:10px; display:flex; flex-direction:column; gap:8px; z-index:15;">' +
        '<button class="wishlist-btn-' + product.id + ' ' + (inWishlist ? 'active' : '') + '" onclick="event.stopPropagation(); toggleWishlistItem(\'' + product.id + '\')" style="width:38px; height:38px; border-radius:50%; border:2px solid #e0e0e0; background:white; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:0.3s; box-shadow:0 2px 8px rgba(0,0,0,0.1);" title="المفضلة">' + heartSvg + '</button>' +
        '<button class="compare-btn-' + product.id + ' ' + (inCompare ? 'active' : '') + '" onclick="event.stopPropagation(); toggleCompareItem(\'' + product.id + '\')" style="width:38px; height:38px; border-radius:50%; border:2px solid #e0e0e0; background:white; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:0.3s; box-shadow:0 2px 8px rgba(0,0,0,0.1);" title="مقارنة">' + compareSvg + '</button>' +
    '</div>';
    
    var colorsHtml = '';
    if (product.hasColors && product.colors) {
        var colorsArray = product.colors.split(',').map(function(c) { return c.trim(); });
        var colorValues = { 'أحمر': '#E74C3C', 'أسود': '#2C3E50', 'أبيض': '#ECF0F1', 'أزرق': '#3498DB', 'أخضر': '#27AE60', 'ذهبي': '#F39C12', 'فضي': '#BDC3C7', 'وردي': '#E91E63', 'بنفسجي': '#9B59B6' };
        colorsHtml = '<div class="color-options">';
        colorsArray.forEach(function(color, index) { 
            var bgColor = colorValues[color] || '#999'; 
            colorsHtml += '<button class="color-btn color-btn-' + product.id + ' ' + (index === 0 ? 'selected' : '') + '" style="background:' + bgColor + '" data-color="' + color + '" onclick="event.stopPropagation(); selectColor(\'' + product.id + '\', \'' + color + '\', this)" title="' + color + '"></button>'; 
        });
        colorsHtml += '</div>';
    }
    
    var colorLabel = '';
    if (product.hasColors && product.colors && product.colors.trim() !== '') {
        var firstColor = product.colors.split(',')[0].trim();
        colorLabel = '<small style="color:#666; display:block; margin-bottom:5px;">اللون: ' + firstColor + '</small>';
    }
    
    var oldPriceHtml = product.oldPrice ? '<div class="old-price">' + curr + product.oldPrice + '</div>' : '';
    
    return '<div class="product-card" onclick="window.location.href=\'product.html?id=' + product.id + '\'" style="cursor:pointer; position:relative;">' + actionButtons + badges + '<img src="' + product.image + '" class="product-image" onerror="this.src=\'https://via.placeholder.com/200?text=No+Image\'" style="height:var(--product-image-height, 200px);"><div class="product-title">' + product.name + '</div>' + colorLabel + oldPriceHtml + '<div class="new-price" style="font-size:18px; font-weight:bold; color:var(--primary-color); display:flex; align-items:center; gap:4px;">' + curr + product.price + '</div><div class="product-options" onclick="event.stopPropagation();">' + colorsHtml + '<div class="qty-selector"><button class="qty-btn" onclick="event.stopPropagation();changeQty(\'' + product.id + '\',-1)">−</button><input type="number" id="qty-' + product.id + '" class="qty-input" value="1" min="1" max="10" readonly><button class="qty-btn" onclick="event.stopPropagation();changeQty(\'' + product.id + '\',1)">+</button></div></div><button class="add-to-cart" onclick="event.stopPropagation();addToCart(\'' + product.id + '\',event)">أضف للسلة</button></div>';
}

window.scrollSection = function(cn, d) { 
    var c = document.getElementById('section-' + cn.replace(/\s+/g,'-')); 
    if (c) c.scrollBy({ left: d === 'left' ? -300 : 300, behavior: 'smooth' }); 
};

// ============ بدء التشغيل ============
console.log('✅ بدء التشغيل...');
updateWishlistCount(); 
updateCompareCount();

async function initStore() {
    try {
        console.log('⏳ بدء تهيئة المتجر...');
        
        await loadStoreSettings();
        console.log('✅ 1. تم تحميل الإعدادات');
        
        updateCurrencySymbols();
        updateCartCount(); 
        loadBannersSystem(); 
        
        await loadCategories();
        console.log('✅ 2. تم تحميل الأقسام:', allCategories.length);
        
        await loadProducts();
        console.log('✅ 3. تم تحميل المنتجات:', allProducts.length);
        
        checkWelcomeModal(); 
        showLiveNotification();
        
        console.log('🎉 اكتمل تحميل المتجر بنجاح!');
    } catch (err) {
        console.error('❌ خطأ في بدء التشغيل:', err);
    }
}

initStore();

// ==========================================
// دالة تنسيق تاريخ انتهاء البطاقة تلقائياً
// ==========================================
function formatCardDate(input) {
    // إزالة كل شيء ما عدا الأرقام
    let value = input.value.replace(/[^0-9]/g, '');
    
    // تحديد الطول الأقصى لـ 4 أرقام
    if (value.length > 4) {
        value = value.substring(0, 4);
    }
    
    // إضافة الشرطة بعد الشهر
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
    }
    
    input.value = value;
}
