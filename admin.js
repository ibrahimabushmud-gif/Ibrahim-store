import { db, collection, addDoc, getDocs, deleteDoc, doc } from './firebase-config.js';
const productForm = document.getElementById('productForm');
const adminProductsList = document.getElementById('adminProductsList');

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newProduct = {
        name: document.getElementById('pName').value,
        image: document.getElementById('pImage').value,
        price: Number(document.getElementById('pPrice').value),
        oldPrice: document.getElementById('pOldPrice').value ? Number(document.getElementById('pOldPrice').value) : null,
        createdAt: new Date()
    };
    try {
        await addDoc(collection(db, "products"), newProduct);
        alert('✅ تم إضافة المنتج بنجاح!');
        productForm.reset();
        loadAdminProducts();
    } catch (error) {
        console.error("خطأ في الإضافة:", error);
        alert('حدث خطأ أثناء الحفظ.');
    }
});

async function loadAdminProducts() {
    adminProductsList.innerHTML = 'جاري التحميل...';
    const querySnapshot = await getDocs(collection(db, "products"));
    if (querySnapshot.empty) {
        adminProductsList.innerHTML = '<p>لا توجد منتجات.</p>';
        return;
    }
    adminProductsList.innerHTML = '';
    querySnapshot.forEach((document) => {
        const product = document.data();
        const item = document.createElement('div');
        item.className = 'product-item';
        item.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="${product.image}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
                <div><strong>${product.name}</strong><br><small>${product.price} ر.س</small></div>
            </div>
            <button class="btn-delete" data-id="${document.id}">حذف</button>
        `;
        adminProductsList.appendChild(item);
    });
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if(confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
                await deleteDoc(doc(db, "products", id));
                loadAdminProducts();
            }
        });
    });
}
loadAdminProducts();
