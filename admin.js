import { db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from './firebase-config.js';
import { auth, onAuthStateChanged } from './firebase-config.js';

console.log('✅ admin.js loaded');

// ============ التحقق من أن المستخدم مدير ============
const ADMIN_EMAIL = 'ibrahimabushmud@gmail.com'; // بريد المدير

onAuthStateChanged(auth, (user) => {
    if (user) {
        // التحقق من أن البريد هو بريد المدير
        if (user.email !== ADMIN_EMAIL) {
            document.getElementById('loginMsg').innerHTML = `
                <h2>🚫 وصول مرفوض</h2>
                <p>عذراً، هذه الصفحة للمدير فقط</p>
                <a href="index.html" class="btn" style="display:inline-block; width:auto; margin-top:20px;">العودة للمتجر</a>
            `;
            document.getElementById('loginMsg').style.display = 'block';
            document.getElementById('adminContent').style.display = 'none';
            return;
        }
        
        document.getElementById('loginMsg').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        loadCategories();
        loadProducts();
        loadOrders();
    } else {
        document.getElementById('loginMsg').style.display = 'block';
        document.getElementById('adminContent').style.display = 'none';
    }
});

// ============ تحميل الأقسام ============
async function loadCategories() {
    const select = document.getElementById('pCategory');
    const list = document.getElementById('categoriesList');
    const count = document.getElementById('catCount');
    
    select.innerHTML = '<option value="">-- اختر القسم --</option>';
    list.innerHTML = 'جاري التحميل...';
    
    const snapshot = await getDocs(collection(db, "categories"));
    count.textContent = snapshot.size;
    list.innerHTML = '';
    
    if (snapshot.empty) {
        list.innerHTML = '<p style="text-align:center;color:#999;">لا توجد أقسام</p>';
        return;
    }
    
    snapshot.forEach((docSnap) => {
        const cat = docSnap.data();
        
        // إضافة للقائمة المنسدلة
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = cat.name;
        select.appendChild(opt);
        
        // إضافة للقائمة
        const div = document.createElement('div');
        div.className = 'item-row';
        div.innerHTML = `
            <strong>${cat.name}</strong>
            <button class="btn-delete" onclick="deleteCategory('${docSnap.id}')">حذف</button>
        `;
        list.appendChild(div);
    });
}

// ============ تحميل المنتجات ============
async function loadProducts() {
    const list = document.getElementById('productsList');
    const count = document.getElementById('prodCount');
    
    list.innerHTML = 'جاري التحميل...';
    
    const snapshot = await getDocs(collection(db, "products"));
    count.textContent = snapshot.size;
    list.innerHTML = '';
    
    if (snapshot.empty) {
        list.innerHTML = '<p style="text-align:center;color:#999;">لا توجد منتجات</p>';
        return;
    }
    
    snapshot.forEach((docSnap) => {
        const p = docSnap.data();
        const div = document.createElement('div');
        div.className = 'item-row';
        div.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
                <img src="${p.image}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;" onerror="this.src='https://via.placeholder.com/50'">
                <div>
                    <strong>${p.name}</strong><br>
                    <small style="color:#666;">${p.category || 'بدون قسم'} • ${p.price} ر.س</small>
                </div>
            </div>
            <div>
                <button class="btn-edit" onclick="editProduct('${docSnap.id}', '${p.name}', '${p.image}', '${p.category}', ${p.price}, ${p.oldPrice || 'null'})">تعديل</button>
                <button class="btn-delete" onclick="deleteProduct('${docSnap.id}')">حذف</button>
            </div>
        `;
        list.appendChild(div);
    });
}

// ============ إضافة/تعديل قسم ============
document.getElementById('categoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('cName').value.trim();
    
    if (!name) {
        alert('⚠️ الرجاء إدخال اسم القسم');
        return;
    }
    
    await addDoc(collection(db, "categories"), { name, createdAt: new Date() });
    alert('✅ تم إضافة القسم بنجاح!');
    document.getElementById('cName').value = '';
    await loadCategories();
});

// ============ إضافة/تعديل منتج ============
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const editId = document.getElementById('editId').value;
    const data = {
        name: document.getElementById('pName').value.trim(),
        image: document.getElementById('pImage').value.trim(),
        category: document.getElementById('pCategory').value,
        price: Number(document.getElementById('pPrice').value),
        oldPrice: document.getElementById('pOldPrice').value ? Number(document.getElementById('pOldPrice').value) : null,
        updatedAt: new Date()
    };
    
    if (!data.name || !data.image || !data.category || !data.price) {
        alert('⚠️ الرجاء ملء جميع الحقول المطلوبة');
        return;
    }
    
    if (editId) {
        await updateDoc(doc(db, "products", editId), data);
        alert('✅ تم تحديث المنتج بنجاح!');
        cancelEdit();
    } else {
        data.createdAt = new Date();
        await addDoc(collection(db, "products"), data);
        alert('✅ تم إضافة المنتج بنجاح!');
        document.getElementById('productForm').reset();
    }
    
    await loadProducts();
});

// ============ حذف قسم ============
window.deleteCategory = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
    await deleteDoc(doc(db, "categories", id));
    alert('✅ تم الحذف بنجاح');
    await loadCategories();
};

// ============ حذف منتج ============
window.deleteProduct = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    await deleteDoc(doc(db, "products", id));
    alert('✅ تم الحذف بنجاح');
    await loadProducts();
};

// ============ تعديل منتج ============
window.editProduct = function(id, name, image, category, price, oldPrice) {
    document.getElementById('editId').value = id;
    document.getElementById('pName').value = name;
    document.getElementById('pImage').value = image;
    document.getElementById('pCategory').value = category;
    document.getElementById('pPrice').value = price;
    document.getElementById('pOldPrice').value = oldPrice === 'null' ? '' : oldPrice;
    
    document.getElementById('formTitle').textContent = '️ تعديل المنتج';
    document.getElementById('submitBtn').textContent = 'حفظ التعديلات';
    document.getElementById('cancelBtn').style.display = 'block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ============ إلغاء التعديل ============
window.cancelEdit = function() {
    document.getElementById('editId').value = '';
    document.getElementById('formTitle').textContent = 'إضافة منتج جديد';
    document.getElementById('submitBtn').textContent = 'حفظ المنتج';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('productForm').reset();
};

// ============ تحميل الطلبات ============
async function loadOrders() {
    const list = document.getElementById('ordersList');
    const count = document.getElementById('ordersCount');
    
    list.innerHTML = '<p style="text-align:center;">جاري التحميل...</p>';
    
    try {
        const snapshot = await getDocs(collection(db, "orders"));
        count.textContent = snapshot.size;
        list.innerHTML = '';
        
        if (snapshot.empty) {
            list.innerHTML = '<p style="text-align:center;color:#999;">لا توجد طلبات حالياً</p>';
            return;
        }
        
        // ترتيب الطلبات من الأحدث للأقدم
        const orders = [];
        snapshot.forEach((docSnap) => {
            orders.push({ id: docSnap.id, ...docSnap.data() });
        });
        orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        orders.forEach((order) => {
            const date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('ar') : 'غير محدد';
            
            let itemsHtml = '';
            if (order.items && order.items.length > 0) {
                itemsHtml = order.items.map(item => `
                    <div style="padding:8px; background:#f9f9f9; margin:5px 0; border-radius:4px;">
                        ${item.name} × ${item.quantity} = <strong>${(item.price * item.quantity).toFixed(2)} ر.س</strong>
                    </div>
                `).join('');
            }
            
            const paymentText = {
                'cash': '💵 الدفع عند الاستلام',
                'card': '💳 بطاقة ائتمان',
                'transfer': '🏦 تحويل بنكي'
            }[order.paymentMethod] || order.paymentMethod;
            
            const statusText = {
                'pending': '🟡 قيد المعالجة',
                'confirmed': '🟢 تم التأكيد',
                'shipped': ' تم الشحن',
                'delivered': '✅ تم التسليم',
                'cancelled': '🔴 ملغى'
            }[order.status] || order.status;
            
            const div = document.createElement('div');
            div.className = 'item-row';
            div.style.flexDirection = 'column';
            div.style.alignItems = 'flex-start';
            div.innerHTML = `
                <div style="width:100%; display:flex; justify-content:space-between; margin-bottom:15px; padding-bottom:10px; border-bottom:2px solid #eee;">
                    <strong style="font-size:16px;">طلب #${order.id.slice(0, 8).toUpperCase()}</strong>
                    <span style="color:#666;">${date}</span>
                </div>
                
                <div style="width:100%; margin-bottom:10px;">
                    <div style="margin-bottom:8px;"><strong>👤 العميل:</strong> ${order.customerName} | 📞 ${order.phone}</div>
                    <div style="margin-bottom:8px;"><strong>📍 العنوان:</strong> ${order.city} - ${order.address}</div>
                    <div style="margin-bottom:8px;"><strong>💳 الدفع:</strong> ${paymentText}</div>
                    <div style="margin-bottom:8px;"><strong>📦 الحالة:</strong> ${statusText}</div>
                </div>
                
                <div style="width:100%; background:#f9f9f9; padding:10px; border-radius:6px; margin-bottom:10px;">
                    <strong>المنتجات:</strong>
                    ${itemsHtml}
                </div>
                
                <div style="width:100%; text-align:left; font-size:20px; font-weight:bold; color:#e63946;">
                    المجموع: ${order.total?.toFixed(2) || 0} ر.س
                </div>
                
                <div style="width:100%; margin-top:10px; display:flex; gap:10px;">
                    <select onchange="updateOrderStatus('${order.id}', this.value)" style="padding:8px; border-radius:4px; border:1px solid #ddd;">
                        <option value="">تغيير الحالة</option>
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>🟡 قيد المعالجة</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>🟢 تم التأكيد</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>🔵 تم الشحن</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>✅ تم التسليم</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>🔴 ملغى</option>
                    </select>
                    <button onclick="deleteOrder('${order.id}')" class="btn-delete">حذف الطلب</button>
                </div>
            `;
            list.appendChild(div);
        });
    } catch (error) {
        console.error('خطأ في تحميل الطلبات:', error);
        list.innerHTML = `<p style="color:red;">خطأ: ${error.message}</p>`;
    }
}

// ============ تحديث حالة الطلب ============
window.updateOrderStatus = async function(orderId, newStatus) {
    if (!newStatus) return;
    
    try {
        await updateDoc(doc(db, "orders", orderId), { status: newStatus });
        alert('✅ تم تحديث حالة الطلب');
        await loadOrders();
    } catch (error) {
        alert('خطأ: ' + error.message);
    }
};

// ============ حذف طلب ============
window.deleteOrder = async function(orderId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    
    try {
        await deleteDoc(doc(db, "orders", orderId));
        alert('✅ تم حذف الطلب');
        await loadOrders();
    } catch (error) {
        alert('خطأ: ' + error.message);
    }
};

// ============ التبديل بين التبويبات ============
window.switchTab = function(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(tab + '-tab').classList.add('active');
    
    if (tab === 'products') loadProducts();
    if (tab === 'categories') loadCategories();
    if (tab === 'orders') loadOrders();
};
