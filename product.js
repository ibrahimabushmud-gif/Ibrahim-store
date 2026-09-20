import { db, doc, getDoc } from './firebase-config.js';

const productDetail = document.getElementById('productDetail');
const cartCountEl = document.getElementById('cartCount');

let cart = JSON.parse(localStorage.getItem('cart')) || [];

// تحديث عداد السلة
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountEl) {
        cartCountEl.textContent = count;
    }
}

// الحصول على معرف المنتج من URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

console.log('🔍 معرف المنتج من URL:', productId);

// دالة تحميل المنتج
async function loadProduct() {
    // التحقق من وجود العنصر
    if (!productDetail) {
        console.error('❌ عنصر productDetail غير موجود');
        return;
    }

    // التحقق من وجود معرف المنتج
    if (!productId) {
        console.error('❌ لا يوجد معرف منتج في URL');
        productDetail.innerHTML = `
            <div class="error-box">
                <h2>⚠️ المنتج غير موجود</h2>
                <p>لم يتم تحديد المنتج</p>
                <a href="index.html">← العودة للمتجر</a>
            </div>
        `;
        return;
    }

    try {
        console.log(' جاري جلب المنتج من Firebase...');
        console.log('📍 Collection: products, ID:', productId);
        
        const productRef = doc(db, "products", productId);
        const docSnap = await getDoc(productRef);
        
        console.log('📄 نتيجة الاستعلام:', docSnap.exists() ? 'موجود' : 'غير موجود');
        
        if (!docSnap.exists()) {
            console.error('❌ المنتج غير موجود في قاعدة البيانات');
            productDetail.innerHTML = `
                <div class="error-box">
                    <h2>⚠️ المنتج غير موجود</h2>
                    <p>هذا المنتج غير متوفر حالياً</p>
                    <a href="index.html">← العودة للمتجر</a>
                </div>
            `;
            return;
        }

        const product = docSnap.data();
        console.log('✅ تم تحميل المنتج:', product);
        console.log('📦 اسم المنتج:', product.name);
        console.log(' السعر:', product.price);
        
        // حساب نسبة الخصم
        const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

        // بناء خيارات الألوان
        let colorsHtml = '';
        if (product.hasColors && product.colors) {
            const colorsArray = product.colors.split(',').map(c => c.trim());
            const colorValues = {
                'أحمر': '#E74C3C', 'أسود': '#2C3E50', 'أبيض': '#ECF0F1',
                'أزرق': '#3498DB', 'أخضر': '#27AE60', 'ذهبي': '#F39C12',
                'فضي': '#BDC3C7', 'وردي': '#E91E63', 'بنفسجي': '#9B59B6'
            };
            colorsHtml = '<div class="color-options-detail">';
            colorsHtml += '<h4>🎨 اختر اللون:</h4>';
            colorsArray.forEach((color, index) => {
                const bgColor = colorValues[color] || '#999';
                const isSelected = index === 0 ? 'selected' : '';
                colorsHtml += `<button class="color-btn-detail ${isSelected}" 
                    style="background:${bgColor}" 
                    data-color="${color}" 
                    onclick="selectDetailColor('${color}', this)" 
                    title="${color}"></button>`;
            });
            colorsHtml += '</div>';
        }

        // عرض المنتج
        productDetail.innerHTML = `
            <img src="${product.image}" class="product-detail-image" onerror="this.src='https://via.placeholder.com/500?text=No+Image'">
            
            <h1 class="product-detail-title">${product.name}</h1>
            
            <div class="product-detail-price">
                ${product.oldPrice ? `<span class="old">${product.oldPrice} ر.س</span>` : ''}
                <span>${product.price} ر.س</span>
                ${discount > 0 ? `<span class="discount-badge-large">خصم ${discount}%</span>` : ''}
            </div>

            ${colorsHtml}

            <div class="qty-detail">
                <span>الكمية:</span>
                <button class="qty-btn" onclick="changeDetailQty(-1)">−</button>
                <input type="number" id="detailQty" class="qty-input" value="1" min="1" max="10" readonly>
                <button class="qty-btn" onclick="changeDetailQty(1)">+</button>
            </div>

            <div class="product-features">
                <div class="feature-item">
                    <div class="feature-icon">🚚</div>
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
                <h3>📋 المواصفات</h3>
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

            <button class="add-to-cart-large" onclick="addToCartFromDetail()">
                🛒 أضف إلى السلة
            </button>
        `;
        
        console.log('✅ تم عرض المنتج بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في تحميل المنتج:', error);
        console.error('تفاصيل الخطأ:', error.message);
        console.error('كود الخطأ:', error.code);
        
        productDetail.innerHTML = `
            <div class="error-box">
                <h2>❌ حدث خطأ</h2>
                <p style="color:var(--danger-color);">${error.message}</p>
                <p>تأكد من اتصالك بالإنترنت</p>
                <a href="index.html">← العودة للمتجر</a>
            </div>
        `;
    }
}

// تغيير الكمية
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

// اختيار اللون
window.selectDetailColor = function(color, btn) {
    document.querySelectorAll('.color-btn-detail').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    console.log('🎨 تم اختيار اللون:', color);
};

// إضافة للسلة
window.addToCartFromDetail = function() {
    const qtyInput = document.getElementById('detailQty');
    const qty = parseInt(qtyInput?.value) || 1;
    
    let selectedColor = 'افتراضي';
    const colorBtns = document.querySelectorAll('.color-btn-detail');
    colorBtns.forEach(btn => {
        if (btn.classList.contains('selected')) {
            selectedColor = btn.getAttribute('data-color');
        }
    });

    // الحصول على بيانات المنتج من الـ DOM
    const titleEl = document.querySelector('.product-detail-title');
    const priceEl = document.querySelector('.product-detail-price span:not(.old):not(.discount-badge-large)');
    const imageEl = document.querySelector('.product-detail-image');
    
    if (!titleEl || !priceEl || !imageEl) {
        alert('⚠️ لم يتم العثور على بيانات المنتج');
        return;
    }
    
    const name = titleEl.textContent;
    const priceText = priceEl.textContent.replace(/[^\d.]/g, '');
    const price = parseFloat(priceText);
    const image = imageEl.src;

    const cartItemId = `${productId}_${selectedColor}`;
    const existing = cart.find(item => item.id === cartItemId);
    
    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({ 
            id: cartItemId, 
            productId: productId,
            name: name, 
            price: price, 
            image: image, 
            color: selectedColor, 
            quantity: qty 
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    alert(`✅ تمت إضافة ${name} للسلة\nاللون: ${selectedColor}\nالكمية: ${qty}`);
    window.location.href = 'cart.html';
};

// تشغيل الدوال
console.log(' صفحة المنتج تم تحميلها');
updateCartCount();
loadProduct();
