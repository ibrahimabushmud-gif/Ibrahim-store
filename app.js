import { db, collection, getDocs } from './firebase-config.js';
import { auth, signOut, onAuthStateChanged } from './firebase-config.js';

console.log('🚀 بدء تحميل المتجر...');

const ADMIN_EMAIL = 'ibrahimabushmud@gmail.com';

let allProducts = [];
let allCategories = [];
let currentCategory = 'all';
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// أيقونة العملة
const curr = '<img src="https://upload.wikimedia.org/wikipedia/commons/e/ee/UAE_Dirham_Symbol.svg" style="height:16px; vertical-align:middle; margin-left:4px;">';
const currLarge = '<img src="https://upload.wikimedia.org/wikipedia/commons/e/ee/UAE_Dirham_Symbol.svg" style="height:20px; vertical-align:middle; margin-left:3px;">';

// ============ 1. التحقق من تسجيل الدخول ============
onAuthStateChanged(auth, (user) => {
    const userMenuEl = document.getElementById('userMenu');
    if (userMenuEl) {
        if (user) {
            if (user.email === ADMIN_EMAIL) {
                userMenuEl.innerHTML = `
                    <a href="admin.html" style="color:var(--primary-color); text-decoration:none; font-weight:bold; margin-left:10px;">⚙️ الإدارة</a>
                    <button onclick="doLogout()" style="background:none; border:none; color:var(--danger-color); cursor:pointer; font-family:'Tajawal'; font-weight:bold;">خروج</button>
                `;
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

// ============ 2. إدارة السلة ============
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const el = document.getElementById('cartCount');
    if (el) el.textContent = count;
    localStorage.setItem('cart', JSON.stringify(cart));
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
    if (drawer) {
        drawer.classList.toggle('open');
        renderCartDrawer();
    }
};

function renderCartDrawer() {
    const content = document.getElementById('cartContent');
    const totalEl = document.getElementById('cartTotal');
    if (!content) return;

    if (cart.length === 0) {
        content.innerHTML = `<div class="empty-cart"><div class="icon">🛒</div><h3>السلة فارغة</h3><p>أضف منتجات للبدء</p></div>`;
        if (totalEl) totalEl.innerHTML = currLarge + '0';
        return;
    }

    let html = '';
    let total = 0;
    cart.forEach((item, index) => {
        total += item.price * item.quantity;
        html += `
            <div class="cart-item">
                <img src="${item.image}" onerror="this.src='https://via.placeholder.com/80'">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span class="color-tag">${item.color}</span>
                    <div class="price">${curr}${item.price}</div>
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

    content.innerHTML = html;
    if (totalEl) totalEl.innerHTML = currLarge + total.toFixed(2);
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
    else {
        cart.push({ id: cartItemId, productId, name: product.name, price: product.price, image: product.image, color: selectedColor, quantity });
    }

    updateCartCount();
    const toast = document.createElement('div');
    toast.style.cssText = `position: fixed; top: 100px; left: 50%; transform: translateX(-50%); background: #27AE60; color: white; padding: 15px 30px; border-radius: 25px; z-index: 1000; font-weight: bold; box-shadow: 0 4px 15px rgba(0,0,0,0.2); font-family: 'Tajawal';`;
    toast.textContent = `✅ تمت إضافة ${product.name} للسلة`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
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

// ============ 3. نظام البنرات والسلايدر الجديد ============
let carouselImages = [];
let currentSlide = 0;
let carouselInterval;

async function loadBannersSystem() {
    try {
        const snapshot = await getDocs(collection(db, "banners"));
        const topBannerEl = document.getElementById('topBanner');
        const topBannerImg = document.getElementById('topBannerImg');
        const carouselContainer = document.getElementById('carouselContainer');
        const carouselSlides = document.getElementById('carouselSlides');
        const carouselDots = document.getElementById('carouselDots');
        
        carouselImages = [];
        let topBannerUrl = '';
        
        snapshot.forEach((doc) => {
            const banner = doc.data();
            if (banner.isActive) {
                if (banner.type === 'top') {
                    topBannerUrl = banner.imageUrl;
                } else {
                    carouselImages.push({ id: doc.id, url: banner.imageUrl, link: banner.link || '#' });
                }
            }
        });
        
        if (topBannerEl && topBannerImg && topBannerUrl) {
            topBannerImg.src = topBannerUrl;
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
    } catch (error) {
        console.error('خطأ في تحميل البنرات:', error);
    }
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
    dots.forEach((dot, index) => {
        dot.style.background = index === currentSlide ? 'var(--primary-color)' : 'rgba(0,0,0,0.3)';
    });
}

const carouselContainerEl = document.getElementById('carouselContainer');
if (carouselContainerEl) {
    carouselContainerEl.addEventListener('mouseenter', () => { if (carouselInterval) clearInterval(carouselInterval); });
    carouselContainerEl.addEventListener('mouseleave', () => { startCarousel(); });
}

// ============ 4. إدارة المنتجات والأقسام ============
async function loadCategories() {
    const sidebar = document.getElementById('sidebarCategories');
    if (!sidebar) return;
    try {
        const snapshot = await getDocs(collection(db, "categories"));
        allCategories = [];
        snapshot.forEach((doc) => allCategories.push({ id: doc.id, ...doc.data() }));

        sidebar.innerHTML = '<div class="category-item active" data-category="all" onclick="filterCategory(\'all\')">🏠 الكل</div>';
        allCategories.forEach(cat => {
            sidebar.innerHTML += `<div class="category-item" data-category="${cat.name}" onclick="filterCategory('${cat.name}')">${cat.name}</div>`;
        });
    } catch (error) { console.error('خطأ في تحميل التصنيفات:', error); }
}

window.filterCategory = function(category) {
    currentCategory = category;
    document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
    const target = document.querySelector(`[data-category="${category}"]`);
    if (target) target.classList.add('active');
    renderProductsByCategory();
    toggleCategories();
};

async function loadProducts() {
    try {
        const snapshot = await getDocs(collection(db, "products"));
        allProducts = [];
        snapshot.forEach((doc) => allProducts.push({ id: doc.id, ...doc.data() }));
        renderProductsByCategory();
    } catch (error) {
        console.error('❌ خطأ في تحميل المنتجات:', error);
    }
}

function renderProductsByCategory() {
    const container = document.getElementById('productsByCategory');
    if (!container) return;
    container.innerHTML = '';

    if (currentCategory !== 'all') {
        renderCategorySection(currentCategory, allProducts.filter(p => p.category === currentCategory));
    } else {
        if (allCategories.length === 0) {
            renderCategorySection('all', allProducts);
        } else {
            allCategories.forEach(cat => {
                const prods = allProducts.filter(p => p.category === cat.name);
                if (prods.length > 0) renderCategorySection(cat.name, prods);
            });
            const noCat = allProducts.filter(p => !p.category || p.category === '');
            if (noCat.length > 0) renderCategorySection('منتجات أخرى', noCat);
        }
    }
}

function renderCategorySection(categoryName, products) {
    const container = document.getElementById('productsByCategory');
    if (!container || products.length === 0) return;

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
    container.appendChild(section);
}

function createProductCard(product) {
    const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
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

    return `
        <div class="product-card" onclick="window.location.href='product.html?id=${product.id}'" style="cursor:pointer;">
            ${discount > 0 ? `<div class="discount-badge">خصم ${discount}%</div>` : ''}
            <img src="${product.image}" class="product-image" onerror="this.src='https://via.placeholder.com/200?text=No+Image'">
            <div class="product-title">${product.name}</div>
            <small style="color:var(--text-light)">${product.category || ''}</small>
            ${product.oldPrice ? `<div class="old-price">${curr}${product.oldPrice}</div>` : ''}
            <div class="new-price">${curr}${product.price}</div>
            <div class="product-options" onclick="event.stopPropagation();">
                ${colorsHtml}
                <div class="qty-selector">
                    <button class="qty-btn" onclick="event.stopPropagation(); changeQty('${product.id}', -1)">−</button>
                    <input type="number" id="qty-${product.id}" class="qty-input" value="1" min="1" max="10" readonly>
                    <button class="qty-btn" onclick="event.stopPropagation(); changeQty('${product.id}', 1)">+</button>
                </div>
            </div>
            <button class="add-to-cart" onclick="event.stopPropagation(); addToCart('${product.id}', event)">أضف للسلة</button>
        </div>
    `;
}

window.scrollSection = function(categoryName, direction) {
    const sectionId = `section-${categoryName.replace(/\s+/g, '-')}`;
    const container = document.getElementById(sectionId);
    if (container) {
        container.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
    }
};

// ============ 5. بدء التشغيل ============
console.log('✅ بدء التشغيل...');
updateCartCount();
loadBannersSystem(); // <-- هنا يتم استدعاء نظام البنرات الجديد
loadCategories();
loadProducts();
