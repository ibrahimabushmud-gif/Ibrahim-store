import { db, doc, getDoc } from './firebase-config.js';

const productDetail = document.getElementById('productDetail');
const cartCountEl = document.getElementById('cartCount');

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountEl) {
        cartCountEl.textContent = count;
    }
}

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

console.log('🔍 معرف المنتج:', productId);

async function loadProduct() {
    if (!productDetail) return;

    if (!productId) {
        productDetail.innerHTML = `
            <div class="error-box">
                <h2>⚠️ المنتج غير موجود</h2>
                <a href="index.html">← العودة للمتجر</a>
            </div>
        `;
        return;
    }

    try {
        const productRef = doc(db, "products", productId);
        const docSnap = await getDoc(productRef);
        
        if (!docSnap.exists()) {
            productDetail.innerHTML = `
                <div class="error-box">
                    <h2>⚠️ المنتج غير موجود</h2>
                    <a href="index.html">← العودة للمتجر</a>
                </div>
            `;
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

            <div style="display:flex; gap:15px; margin-top:25px; flex-wrap:wrap;">
                <button class="add-to-cart-large" onclick="addToCartFromDetail()" style="flex:1; min-width:200px;">
                    🛒 أضف إلى السلة
                </button>
                <button class="continue-shopping-btn" onclick="window.location.href='index.html'" style="flex:1; min-width:200px; background:white; color:var(--primary-color); border:2px solid var(--primary-color); padding:20px; border-radius:30px; font-size:20px; font-weight:700; cursor:pointer; font-family:'Tajawal'; transition:0.3s;">
                    ← إكمال التسوق
                </button>
            </div>
        `;
        
        console.log('✅ تم عرض المنتج بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ:', error);
        productDetail.innerHTML = `
            <div class="error-box">
                <h2>❌ حدث خطأ</h2>
                <p>${error.message}</p>
                <a href="index.html">← العودة للمتجر</a>
            </div>
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

    const titleEl = document.querySelector('.product-detail-title');
    const priceEl = document.querySelector('.product-detail-price span:not(.old):not(.discount-badge-large)');
    const imageEl = document.querySelector('.product-detail-image');
    
    if (!titleEl || !priceEl || !imageEl) {
        alert('️ لم يتم العثور على بيانات المنتج');
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
    
    // إشعار صغير فقط
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 100px; left: 50%; transform: translateX(-50%);
        background: #27AE60; color: white; padding: 15px 30px;
        border-radius: 25px; z-index: 1000; font-weight: bold;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2); font-family: 'Tajawal';
    `;
    toast.textContent = `✅ تمت إضافة ${name} للسلة`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
};

const style = document.createElement('style');
style.textContent = `
    .continue-shopping-btn:hover {
        background: var(--primary-color) !important;
        color: white !important;
    }
`;
document.head.appendChild(style);

updateCartCount();
loadProduct();
