import { db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from './firebase-config.js';
import { auth, onAuthStateChanged } from './firebase-config.js';

console.log('✅ admin.js loaded');

// التحقق من تسجيل الدخول
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('loginMsg').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        loadCategories();
        loadProducts();
    } else {
        document.getElementById('loginMsg').style.display = 'block';
        document.getElementById('adminContent').style.display = 'none';
    }
});

// تحميل الأقسام
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

// تحميل المنتجات
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

// إضافة/تعديل قسم
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

// إضافة/تعديل منتج
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
        alert('️ الرجاء ملء جميع الحقول المطلوبة');
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

// حذف قسم
window.deleteCategory = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
    await deleteDoc(doc(db, "categories", id));
    alert('✅ تم الحذف بنجاح');
    await loadCategories();
};

// حذف منتج
window.deleteProduct = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    await deleteDoc(doc(db, "products", id));
    alert('✅ تم الحذف بنجاح');
    await loadProducts();
};

// تعديل منتج
window.editProduct = function(id, name, image, category, price, oldPrice) {
    document.getElementById('editId').value = id;
    document.getElementById('pName').value = name;
    document.getElementById('pImage').value = image;
    document.getElementById('pCategory').value = category;
    document.getElementById('pPrice').value = price;
    document.getElementById('pOldPrice').value = oldPrice === 'null' ? '' : oldPrice;
    
    document.getElementById('formTitle').textContent = '✏️ تعديل المنتج';
    document.getElementById('submitBtn').textContent = 'حفظ التعديلات';
    document.getElementById('cancelBtn').style.display = 'block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// إلغاء التعديل
window.cancelEdit = function() {
    document.getElementById('editId').value = '';
    document.getElementById('formTitle').textContent = 'إضافة منتج جديد';
    document.getElementById('submitBtn').textContent = 'حفظ المنتج';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('productForm').reset();
};

// التبديل بين التبويبات
window.switchTab = function(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(tab + '-tab').classList.add('active');
    
    if (tab === 'products') loadProducts();
    if (tab === 'categories') loadCategories();
};
