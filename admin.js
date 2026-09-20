import { db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from './firebase-config.js';
import { auth, onAuthStateChanged } from './firebase-config.js';

console.log('✅ admin.js تم تحميله بنجاح');

// ============ التحقق من تسجيل الدخول ============
onAuthStateChanged(auth, (user) => {
    console.log('حالة المستخدم:', user ? 'مسجل دخول' : 'غير مسجل');
    if (user) {
        document.getElementById('loginMessage').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        loadAllData();
    } else {
        document.getElementById('loginMessage').style.display = 'block';
        document.getElementById('adminContent').style.display = 'none';
    }
});

// ============ تحميل جميع البيانات ============
async function loadAllData() {
    console.log('🔄 بدء تحميل البيانات...');
    await loadCategories();
    await loadProducts();
    await loadOrders();
}

// ============ إدارة الأقسام ============
async function loadCategories() {
    console.log('📁 تحميل الأقسام...');
    const categorySelect = document.getElementById('pCategory');
    const adminCategoriesList = document.getElementById('adminCategoriesList');
    const categoriesCount = document.getElementById('categoriesCount');
    
    categorySelect.innerHTML = '<option value="">-- اختر القسم --</option>';
    adminCategoriesList.innerHTML = '<p class="empty-msg">جاري التحميل...</p>';
    
    try {
        const snapshot = await getDocs(collection(db, "categories"));
        console.log('عدد الأقسام:', snapshot.size);
        categoriesCount.textContent = snapshot.size;
        
        if (snapshot.empty) {
            adminCategoriesList.innerHTML = '<p class="empty-msg">لا توجد أقسام. أضف قسماً أولاً.</p>';
            return;
        }
        
        adminCategoriesList.innerHTML = '';
        snapshot.forEach((document) => {
            const cat = document.data();
            console.log('قسم:', cat.name);
            
            // إضافة للقائمة المنسدلة
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            categorySelect.appendChild(option);
            
            // إضافة للقائمة
            const item = document.createElement('div');
            item.className = 'item-row';
            item.innerHTML = `
                <strong>${cat.name}</strong>
                <button class="btn-delete" data-type="category" data-id="${document.id}">حذف</button>
            `;
            adminCategoriesList.appendChild(item);
        });
    } catch (error) {
        console.error('❌ خطأ في تحميل الأقسام:', error);
        adminCategoriesList.innerHTML = '<p style="color:red;">خطأ: ' + error.message + '</p>';
    }
}

// إضافة قسم جديد
document.getElementById('categoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('cName').value.trim();
    
    if (!name) {
        alert('⚠️ الرجاء إدخال اسم القسم');
        return;
    }
    
    try {
        await addDoc(collection(db, "categories"), { name, createdAt: new Date() });
        alert('✅ تم إضافة القسم بنجاح!');
        document.getElementById('cName').value = '';
        await loadCategories();
    } catch (error) {
        alert('حدث خطأ: ' + error.message);
    }
});

// ============ إدارة المنتجات ============
async function loadProducts() {
    console.log('📦 تحميل المنتجات...');
    const adminProductsList = document.getElementById('adminProductsList');
    const productsCount = document.getElementById('productsCount');
    
    adminProductsList.innerHTML = '<p class="empty-msg">جاري التحميل...</p>';
    
    try {
        const snapshot = await getDocs(collection(db, "products"));
        console.log('عدد المنتجات:', snapshot.size);
        productsCount.textContent = snapshot.size;
        
        if (snapshot.empty) {
            adminProductsList.innerHTML = '<p class="empty-msg">لا توجد منتجات. أضف منتجاً أولاً.</p>';
            return;
        }
        
        adminProductsList.innerHTML = '';
        snapshot.forEach((document) => {
            const product = document.data();
            console.log('منتج:', product.name);
            
            const item = document.createElement('div');
            item.className = 'item-row';
            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px; flex:1;">
                    <img src="${product.image}" style="width:50px; height:50px; object-fit:cover; border-radius:6px;" onerror="this.src='https://via.placeholder.com/50'">
                    <div>
                        <strong>${product.name}</strong><br>
                        <small style="color:#666;">${product.category || 'بدون قسم'} • ${product.price} ر.س</small>
                    </div>
                </div>
                <div>
                    <button class="btn-edit" data-id="${document.id}">تعديل</button>
                    <button class="btn-delete" data-type="product" data-id="${document.id}">حذف</button>
                </div>
            `;
            adminProductsList.appendChild(item);
        });
    } catch (error) {
        console.error('❌ خطأ في تحميل المنتجات:', error);
        adminProductsList.innerHTML = '<p style="color:red;">خطأ: ' + error.message + '</p>';
    }
}

// إضافة/تعديل منتج
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const editId = document.getElementById('editProductId').value;
    const productData = {
        name: document.getElementById('pName').value.trim(),
        image: document.getElementById('pImage').value.trim(),
        category: document.getElementById('pCategory').value,
        price: Number(document.getElementById('pPrice').value),
        oldPrice: document.getElementById('pOldPrice').value ? Number(document.getElementById('pOldPrice').value) : null,
        updatedAt: new Date()
    };
    
    if (!productData.name || !productData.image || !productData.category || !productData.price) {
        alert('⚠️ الرجاء ملء جميع الحقول المطلوبة');
        return;
    }
    
    try {
        if (editId) {
            await updateDoc(doc(db, "products", editId), productData);
            alert('✅ تم تحديث المنتج بنجاح!');
            cancelEdit();
        } else {
            productData.createdAt = new Date();
            await addDoc(collection(db, "products"), productData);
            alert('✅ تم إضافة المنتج بنجاح!');
            document.getElementById('productForm').reset();
        }
        await loadProducts();
    } catch (error) {
        alert('حدث خطأ: ' + error.message);
    }
});

// ============ إدارة الطلبات ============
async function loadOrders() {
    console.log('🛍️ تحميل الطلبات...');
    const ordersList = document.getElementById('ordersList');
    const ordersCount = document.getElementById('ordersCount');
    
    ordersList.innerHTML = '<p class="empty-msg">جاري التحميل...</p>';
    
    try {
        const snapshot = await getDocs(collection(db, "orders"));
        console.log('عدد الطلبات:', snapshot.size);
        ordersCount.textContent = snapshot.size;
        
        if (snapshot.empty) {
            ordersList.innerHTML = '<p class="empty-msg">لا توجد طلبات حالياً.</p>';
            return;
        }
        
        ordersList.innerHTML = '';
        snapshot.forEach((document) => {
            const order = document.data();
            const date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('ar') : 'غير محدد';
            
            let itemsHtml = (order.items || []).map(item => `
                <div style="padding:5px 0; border-bottom:1px solid #eee;">
                    ${item.name} × ${item.quantity} = ${(item.price * item.quantity).toFixed(2)} ر.س
                </div>
            `).join('');
            
            const paymentText = {
                'cash': '💵 عند الاستلام',
                'card': '💳 بطاقة ائتمان',
                'transfer': '🏦 تحويل بنكي'
            }[order.paymentMethod] || order.paymentMethod;
            
            const item = document.createElement('div');
            item.className = 'order-card';
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <strong>طلب #${document.id.slice(0, 8)}</strong>
                    <small>${date}</small>
                </div>
                <div><strong>العميل:</strong> ${order.customerName} - ${order.phone}</div>
                <div><strong>العنوان:</strong> ${order.city} - ${order.address}</div>
                <div><strong>الدفع:</strong> ${paymentText}</div>
                <div style="margin-top:10px;"><strong>المنتجات:</strong></div>
                ${itemsHtml}
                <div style="margin-top:10px; font-size:18px; color:var(--primary-color); font-weight:bold;">
                    المجموع: ${order.total?.toFixed(2) || 0} ر.س
                </div>
            `;
            ordersList.appendChild(item);
        });
    } catch (error) {
        console.error('❌ خطأ في تحميل الطلبات:', error);
        ordersList.innerHTML = '<p style="color:red;">خطأ: ' + error.message + '</p>';
    }
}

// ============ حذف وتعديل ============
document.addEventListener('click', async (e) => {
    // حذف
    if (e.target.classList.contains('btn-delete')) {
        const type = e.target.getAttribute('data-type');
        const id = e.target.getAttribute('data-id');
        const name = type === 'product' ? 'المنتج' : 'القسم';
        
        if (confirm(`هل أنت متأكد من حذف ${name}؟`)) {
            try {
                await deleteDoc(doc(db, type, id));
                alert('✅ تم الحذف بنجاح');
                if (type === 'product') await loadProducts();
                else await loadCategories();
            } catch (error) {
                alert('خطأ في الحذف: ' + error.message);
            }
        }
    }
    
    // تعديل
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
                    document.getElementById('productFormTitle').textContent = '✏️ تعديل المنتج';
                    document.getElementById('productSubmitBtn').textContent = 'حفظ التعديلات';
                    document.getElementById('cancelEditBtn').style.display = 'block';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        } catch (error) {
            alert('خطأ في تحميل بيانات المنتج: ' + error.message);
        }
    }
});

// ============ التبويبات ============
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        document.getElementById(tabName + '-tab').classList.add('active');
        
        // إعادة تحميل البيانات عند التبديل
        if (tabName === 'products') loadProducts();
        if (tabName === 'categories') loadCategories();
        if (tabName === 'orders') loadOrders();
    });
});

// ============ إلغاء التعديل ============
window.cancelEdit = function() {
    document.getElementById('editProductId').value = '';
    document.getElementById('productFormTitle').textContent = 'إضافة منتج جديد';
    document.getElementById('productSubmitBtn').textContent = 'حفظ المنتج';
    document.getElementById('cancelEditBtn').style.display = 'none';
    document.getElementById('productForm').reset();
};
