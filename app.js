import { db, collection, getDocs } from './firebase-config.js';
const productsContainer = document.getElementById('products-container');
async function loadProducts() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        productsContainer.innerHTML = '';
        if (querySnapshot.empty) {
            productsContainer.innerHTML = '<p style="padding:20px">لا توجد منتجات حالياً. أضفها من لوحة التحكم.</p>';
            return;
        }
        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
            const productHTML = `
                <div class="product-card">
                    ${discount > 0 ? `<div class="discount-badge">خصم ${discount}%</div>` : ''}
                    <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/200?text=No+Image'">
                    <div class="product-title">${product.name}</div>
                    ${product.oldPrice ? `<div class="old-price">${product.oldPrice} ر.س</div>` : ''}
                    <div class="new-price">${product.price} ر.س</div>
                    <button class="add-to-cart">أضف للسلة</button>
                </div>
            `;
            productsContainer.innerHTML += productHTML;
        });
    } catch (error) {
        console.error("خطأ في جلب المنتجات:", error);
        productsContainer.innerHTML = '<p style="padding:20px; color:red">حدث خطأ في تحميل المنتجات.</p>';
    }
}
loadProducts();
