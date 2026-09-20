import { db, collection, getDocs, doc, getDoc } from './firebase-config.js';

const productDetail = document.getElementById('productDetail');
const cartCountEl = document.getElementById('cartCount');

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountEl) {
        cartCountEl.textContent = count;
    }
}

// الحصول على معرف المنتج من URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

console.log(' معرف المنتج:', productId);

async function loadProduct() {
    if (!productDetail) {
        console.error('❌ لم يتم العثور على عنصر productDetail');
        return;
    }

    if (!productId) {
        productDetail.innerHTML = '<h2 style="text-align:center; color:var(--danger-color);">المنتج غير موجود</h2><p style="text-align:center;"><a href="index.html" style="color:var(--primary-color);">العودة للمتجر</a></p>';
        return;
    }

    try {
        console.log('🔄 جاري تحميل المنتج من Firebase...');
        const docSnap = await getDoc(doc(db, "products", productId));
        
        if (!docSnap.exists()) {
            console.error('❌ المنتج غير موجود في قاعدة البيانات');
            productDetail.innerHTML = '<h2 style="text-align:center; color:var(--danger-color);">المنتج غير موجود</h2><p style="text-align:center;"><a href="index.html" style="color:var(--primary-color);">العودة للمتجر</a></p>';
            return;
        }

        const product = docSnap.data();
        console.log('✅ تم تحميل المنتج:', product.name);
        
        const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

        let colorsHtml = '';
        if (product.hasColors && product.colors) {
            const colorsArray = product.colors.split(',').map(c => c.trim());
            const colorValues = {
                'أحمر': '#E74C3C', 'أسود': '#2C3E50', 'أبيض': '#ECF0F1',
                'أزرق': '#3498DB', 'أخضر': '#27AE60', 'ذهبي': '#F39C12',
                'فضي': '#BDC3C7', 'وردي': '#E91E63', 'بنفسجي': '#9B59B6'
            };
            colorsHtml = '<div class="color-options" style="margin:20px 0;">';
            colorsHtml += '<h4 style="margin-bottom:10px;">اختر اللون:</h4>';
            colorsArray.forEach((color, index) => {
                const bgColor = colorValues[color] || '#999';
                const isSelected = index === 0 ? 'selected' : '';
                colorsHtml += `<button class="color-btn color-btn-detail ${isSelected}" 
                    style="background:${bgColor}; width:40px; height:40px; cursor:pointer;" 
                    data-color="${color}" 
                    onclick="selectDetailColor('${color}', this)" 
                    title="${color}"></button>`;
            });
            colorsHtml += '</div>';
        }

        productDetail.innerHTML = `
            <img src="${product.image}" class="product-detail-image" onerror="this.src='https://via.placeholder.com/500'">
            
            <h1 class="product-detail-title">${product.name}</h1>
            
            <div class="product-detail-price">
                ${product.oldPrice ? `<span class="old">${product.oldPrice} ر.س</span>` : ''}
                ${product.price} ر.س
                ${discount > 0 ? `<span style="background:var(--danger-color); color:white; padding:5px 15px; border-radius:20px; font-size:14px; margin-right:10px;">خصم ${discount}%</span>` : ''}
            </div>

            ${colorsHtml}

            <div class="qty-selector" style="background:var(--accent-color); padding:15px; border-radius:25px; display:inline-flex; align-items:center; gap:15px; margin:20px 0;">
                <span style="font-weight:bold;">الكمية:</span>
                <button class="qty-btn" onclick="changeDetailQty(-1)" style="width:35px; height:35px; cursor:pointer;">−</button>
                <input type="number" id="detailQty" class="qty-input" value="1" min="1" max="10" readonly style="width:50px; font-size:18px; text-align:center;">
                <button class="qty-btn" onclick="changeDetailQty(1)" style="width:35px; height:35px; cursor:pointer;">+</button>
            </div>

            <div class="product-features">
                <div class="feature-item">
                    <div class="feature-icon"></div>
                    <div class="feature-text">توصيل مجاني خلال 24 ساعة</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🛡️</div>
                    <div class="feature-text">ضمان لمدة عامين</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">💳</div>
                    <div class="feature-text">إمكانية التقسيط</div>
                </div>
            </div>

            <div class="specs-box">
                <h3>المواصفات</h3>
                <div class="spec-row">
                    <span class="spec-label">القسم</span>
                    <span class="spec-value">${product.category || 'غير محدد'}</span>
                </div>
                <div class="spec-row">
                    <span class="spec-label">السعر</span>
                    <span class="spec-value">${product.price} ر.س</span>
                </div>
                ${product.oldPrice ? `
                <div class="spec-row">
                    <span class="spec-label">السعر قبل الخصم</span>
                    <span class="spec-value">${product.oldPrice} ر.س</span>
                </div>` : ''}
            </div>

            <button class="add-to-cart-large" onclick="addToCartFromDetail('${product.id}', '${product.name}', ${product.price}, '${product.image}')" style="cursor:pointer;">
                 أضف إلى السلة
            </button>
        `;
    } catch (error) {
        console.error('❌ خطأ في تحميل المنتج:', error);
        productDetail.innerHTML = `
            <h2 style="text-align:center; color:var(--danger-color);">حدث خطأ في تحميل المنتج</h2>
            <p style="text-align:center; color:var(--text-light);">${error.message}</p>
            <p style="text-align:center;"><a href="index.html" style="color:var(--primary-color);">العودة للمتجر</a></p>
        `;
    }
}

window.changeDetailQty = function(delta) {
    const input = document.getElementById('detailQty');
    if (input) {
        let val = parseInt(input.value) || 1;
        val += delta;
        if (val < 1) val = 1;
        if (val > 10) val = 10;
        input.value = val;
    }
};

window.selectDetailColor = function(color, btn) {
    document.querySelectorAll('.color-btn-detail').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
};

window.addToCartFromDetail = function(id, name, price, image) {
    const qtyInput = document.getElementById('detailQty');
    const qty = parseInt(qtyInput?.value) || 1;
    
    let selectedColor = 'افتراضي';
    const colorBtns = document.querySelectorAll('.color-btn-detail');
    colorBtns.forEach(btn => {
        if (btn.classList.contains('selected')) {
            selectedColor = btn.getAttribute('data-color');
        }
    });

    const cartItemId = `${id}_${selectedColor}`;
    const existing = cart.find(item => item.id === cartItemId);
    
    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({ 
            id: cartItemId, 
            productId: id, 
            name: name, 
            price: price, 
            image: image, 
            color: selectedColor, 
            quantity: qty 
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    alert('✅ تمت إضافة المنتج للسلة');
    window.location.href = 'cart.html';
};

// تشغيل الدوال عند تحميل الصفحة
console.log(' صفحة المنتج تم تحميلها');
updateCartCount();
loadProduct();
