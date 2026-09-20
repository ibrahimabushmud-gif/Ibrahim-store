import { db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from './firebase-config.js';
import { auth, onAuthStateChanged } from './firebase-config.js';

const productForm = document.getElementById('productForm');
const categoryForm = document.getElementById('categoryForm');
const adminProductsList = document.getElementById('adminProductsList');
const adminCategoriesList = document.getElementById('adminCategoriesList');
const categorySelect = document.getElementById('pCategory');

let categoriesCache = [];

// التحقق من تسجيل الدخول
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('loginMessage').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        loadCategories();
        loadProducts();
        loadOrders();
    } else {
        document.getElementById('loginMessage').style.display = 'block';
        document.getElementById('adminContent').style.display = 'none';
    }
});

// ============ إدارة الأقسام ============

categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('cName').value.trim();
    
    if (!name) {
        alert('⚠️ الرجاء إدخال اسم القسم');
        return;
    }
    
    try {
        await addDoc(collection(db, "categories"), { 
            name: name,
            createdAt: new Date() 
        });
        alert('✅ تم إضافة القسم بنجاح!');
        document.getElementById('cName').value = '';
        await loadCategories(); // إعادة تحميل الأقسام
    } catch (error) {
        alert('حدث خطأ: ' + error.message);
        console.error('Error adding category:', error);
    }
});

async function loadCategories() {
    try {
        const snapshot = await getDocs(collection(db, "categories"));
        categoriesCache = [];
        
        // تحديث القائمة المنسدلة
        categorySelect.innerHTML = '<option value="">-- اختر القسم --</option>';
        adminCategoriesList.innerHTML = '';
        
        if (snapshot.empty) {
            adminCategoriesList.innerHTML = '<p style="color:#999; text-align:center;">لا توجد أقسام. أضف قسماً أولاً من تبويب "الأقسام".</p>';
            console.log('No categories found');
            return;
        }
        
        console.log('Loading categories...');
        snapshot.forEach((document) => {
            const cat = document.data();
            categoriesCache.push({ id: document.id, ...cat });
            
            // إضافة للقائمة المنسدلة
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            categorySelect.appendChild(option);
            
            // إضافة للقائمة مع زر الحذف
            const item = document.createElement('div');
            item.className = 'item-row';
            item.innerHTML = `
                <strong>${cat.name}</strong>
                <button class="btn-delete" data-type="category" data-id="${document.id}">حذف</button>
            `;
            adminCategoriesList.appendChild(item);
        });
        
        console.log('Categories loaded:', categoriesCache.length);
    } catch (error) {
        console.error('Error loading categories:', error);
        adminCategoriesList.innerHTML = '<p style="color:red;">خطأ في تحميل الأقسام</p>';
    }
}

// ============ إدارة المنتجات ============

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const editId = document.getElementById('editProductId').value;
    const name = document.getElementById('pName').value.trim();
    const image = document.getElementById('pImage').value.trim();
    const category = document.getElementById('pCategory').value;
    const price = document.getElementById('pPrice').value;
    const oldPrice = document.getElementById('pOldPrice').value;
    
    // التحقق من البيانات
    if (!name || !image || !category || !price) {
        alert('⚠️ الرجاء ملء جميع الحقول المطلوبة');
        return;
    }
    
    const productData = {
        name: name,
        image: image,
        category: category,
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : null,
        updatedAt: new Date()
    };
    
    try {
        if (editId) {
            await updateDoc(doc(db, "products", editId), productData);
            alert('✅ تم تحديث المنتج بنجاح!');
            cancelEdit();
        } else {
            productData.createdAt = new Date();
            await addDoc(collection(db, "products"), productData);
            alert('✅ تم إضافة المنتج بنجاح!');
            productForm.reset();
        }
        await loadProducts(); // إعادة تحميل المنتجات
    } catch (error) {
        alert('حدث خطأ: ' + error.message);
        console.error('Error saving product:', error);
    }
});

async function loadProducts() {
    try {
        const snapshot = await getDocs(collection(db, "products"));
        adminProductsList.innerHTML = '';
        
        if (snapshot.empty) {
            adminProductsList.innerHTML = '<p style="color:#999; text-align:center;">لا توجد منتجات. أضف منتجاً أولاً.</p>';
            console.log('No products found');
            return;
        }
        
        console.log('Loading products...');
        snapshot.forEach((document) => {
            const product = document.data();
            const item = document.createElement('div');
            item.className = 'item-row';
            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${product.image}" style="width:50px; height:50px; object-fit:cover; border-radius:6px;" onerror="this.src='https://via.placeholder.com/50'">
                    <div>
                        <strong>${product.name}</strong><br>
                        <small style="color:#666;">${product.category || 'بدون قسم'} • ${product.price} ر.س</small>
                    </div>
                </div>
                <div>
                    <button class="btn-edit" data-type="product" data-id="${document.id}">تعديل</button>
                    <button class="btn-delete" data-type="product" data-id="${document.id}">حذف</button>
                </div>
            `;
            adminProductsList.appendChild(item);
        });
        
        console.log('Products loaded:', snapshot.size);
    } catch (error) {
        console.error('Error loading products:', error);
        adminProductsList.innerHTML = '<p style="color:red;">خطأ في تحميل المنتجات</p>';
    }
}

// ============ إدارة الطلبات ============

async function loadOrders() {
    try {
        const snapshot = await getDocs(collection(db, "orders"));
        ordersList.innerHTML = '';
        
        if (snapshot.empty) {
            ordersList.innerHTML = '<p style="color:#999; text-align:center;">لا توجد طلبات حالياً.</p>';
            return;
        }
        
        snapshot.forEach((document) => {
            const order = document.data();
            const date = order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString('ar') : 'غير محدد';
            
            let itemsHtml = order.items.map(item => `
                <div style="padding:5px 0; border-bottom:1px solid #eee;">
                    ${item.name} × ${item.quantity} = ${(item.price * item.quantity).toFixed(2)} ر.س
                </div>
            `).join('');
            
            const item = document.createElement('div');
            item.className = 'item-row';
            item.style.flexDirection = 'column';
            item.style.alignItems = 'flex-start';
            item.innerHTML = `
                <div style="width:100%; display:flex; justify-content:space-between; margin-bottom:10px;">
                    <strong>طلب #${document.id.slice(0, 8)}</strong>
                    <small>${date}</small>
                </div>
                <div style="width:100%;">
                    <div><strong>العميل:</strong> ${order.customerName} - ${order.phone}</div>
                    <div><strong>العنوان:</strong> ${order.city} - ${order.address}</div>
                    <div><strong>الدفع:</strong> ${order.paymentMethod === 'cash' ? 'عند الاستلام' : order.paymentMethod === 'card' ? 'بطاقة' : 'تحويل'}</div>
                    <div style="margin-top:10px;"><strong>المنتجات:</strong></div>
                    ${itemsHtml}
                    <div style="margin-top:10px; font-size:18px; color:var(--primary-color); font-weight:bold;">
                        المجموع: ${order.total.toFixed(2)} ر.س
                    </div>
                </div>
            `;
            ordersList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersList.innerHTML = '<p style="color:red;">خطأ في تحميل الطلبات</p>';
    }
}

// ============ حذف وتعديل ============

document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-delete')) {
        const type = e.target.getAttribute('data-type');
        const id = e.target.getAttribute('data-id');
        const name = type === 'product' ? 'المنتج' : 'القسم';
        
        if (confirm(`هل أنت متأكد من حذف ${name}؟`)) {
            try {
                await deleteDoc(doc(db, type, id));
                if (type === 'product') await loadProducts();
                else await loadCategories();
                alert('✅ تم الحذف بنجاح');
            } catch (error) {
                alert('خطأ في الحذف: ' + error.message);
            }
        }
    }
    
    if (e.target.classList.contains('btn-edit')) {
        const id = e.target.getAttribute('data-id');
        try {
            const snapshot = await getDocs(collection(db, "products"));
            snapshot.forEach((document) => {
                if (document.id === id) {
                    const product = document.data();
                    document.getElementById('editProductId').value = id;
                    document.getElementById('pName').value = product.name;
                    document.getElementById('pImage').value = product.image;
                    document.getElementById('pCategory').value = product.category;
                    document.getElementById('pPrice').value = product.price;
                    document.getElementById('pOldPrice').value = product.oldPrice || '';
                    document.getElementById('productFormTitle').textContent = 'تعديل المنتج';
                    document.getElementById('productSubmitBtn').textContent = 'حفظ التعديلات';
                    document.getElementById('cancelEditBtn').style.display = 'block';
                    window.scrollTo(0, 0);
                }
            });
        } catch (error) {
            alert('خطأ في تحميل بيانات المنتج: ' + error.message);
        }
    }
});

window.cancelEdit = function() {
    document.getElementById('editProductId').value = '';
    document.getElementById('productFormTitle').textContent = 'إضافة منتج جديد';
    document.getElementById('productSubmitBtn').textContent = 'حفظ المنتج';
    document.getElementById('cancelEditBtn').style.display = 'none';
    productForm.reset();
};
