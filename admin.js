import { db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from './firebase-config.js';
import { auth, onAuthStateChanged } from './firebase-config.js';

const ADMIN_EMAIL = 'ibrahimabushmud@gmail.com';

onAuthStateChanged(auth, (user) => {
    if (user) {
        if (user.email !== ADMIN_EMAIL) {
            document.getElementById('loginMsg').innerHTML = `<h2>🚫 وصول مرفوض</h2><p>عذراً، هذه الصفحة للمدير فقط</p><a href="index.html" class="btn" style="display:inline-block; width:auto; margin-top:20px;">العودة للمتجر</a>`;
            document.getElementById('loginMsg').style.display = 'block';
            document.getElementById('adminContent').style.display = 'none';
            return;
        }
        document.getElementById('loginMsg').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        loadCategories();
        loadProducts();
        loadBanners();
        loadOrders();
    } else {
        document.getElementById('loginMsg').style.display = 'block';
        document.getElementById('adminContent').style.display = 'none';
    }
});

// إظهار/إخفاء حقل الألوان
document.getElementById('pHasColors').addEventListener('change', function() {
    document.getElementById('colorsInputGroup').style.display = this.checked ? 'block' : 'none';
});

async function loadCategories() {
    const select = document.getElementById('pCategory');
    const list = document.getElementById('categoriesList');
    const count = document.getElementById('catCount');
    select.innerHTML = '<option value="">-- اختر القسم --</option>';
    list.innerHTML = 'جاري التحميل...';
    const snapshot = await getDocs(collection(db, "categories"));
    count.textContent = snapshot.size;
    list.innerHTML = '';
    if (snapshot.empty) { list.innerHTML = '<p style="text-align:center;color:#999;">لا توجد أقسام</p>'; return; }
    snapshot.forEach((docSnap) => {
        const cat = docSnap.data();
        const opt = document.createElement('option'); opt.value = cat.name; opt.textContent = cat.name; select.appendChild(opt);
        const div = document.createElement('div'); div.className = 'item-row';
        div.innerHTML = `<strong>${cat.name}</strong><button class="btn-delete" onclick="deleteCategory('${docSnap.id}')">حذف</button>`;
        list.appendChild(div);
    });
}

async function loadProducts() {
    const list = document.getElementById('productsList');
    const count = document.getElementById('prodCount');
    list.innerHTML = 'جاري التحميل...';
    const snapshot = await getDocs(collection(db, "products"));
    count.textContent = snapshot.size;
    list.innerHTML = '';
    if (snapshot.empty) { list.innerHTML = '<p style="text-align:center;color:#999;">لا توجد منتجات</p>'; return; }
    snapshot.forEach((docSnap) => {
        const p = docSnap.data();
        const div = document.createElement('div'); div.className = 'item-row';
        div.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
                <img src="${p.image}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;" onerror="this.src='https://via.placeholder.com/50'">
                <div><strong>${p.name}</strong><br><small style="color:#666;">${p.category || 'بدون قسم'} • ${p.price} ر.س ${p.hasColors ? '• ألوان: ' + p.colors : ''}</small></div>
            </div>
            <div>
                <button class="btn-edit" onclick="editProduct('${docSnap.id}', '${p.name}', '${p.image}', '${p.category}', ${p.price}, ${p.oldPrice || 'null'}, ${p.hasColors || false}, '${p.colors || ''}')">تعديل</button>
                <button class="btn-delete" onclick="deleteProduct('${docSnap.id}')">حذف</button>
            </div>`;
        list.appendChild(div);
    });
}

document.getElementById('categoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "categories"), { name: document.getElementById('cName').value.trim(), createdAt: new Date() });
    alert('✅ تم إضافة القسم'); document.getElementById('cName').value = ''; await loadCategories();
});

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('editId').value;
    const data = {
        name: document.getElementById('pName').value.trim(),
        image: document.getElementById('pImage').value.trim(),
        category: document.getElementById('pCategory').value,
        price: Number(document.getElementById('pPrice').value),
        oldPrice: document.getElementById('pOldPrice').value ? Number(document.getElementById('pOldPrice').value) : null,
        hasColors: document.getElementById('pHasColors').checked,
        colors: document.getElementById('pHasColors').checked ? document.getElementById('pColors').value.trim() : '',
        updatedAt: new Date()
    };
    if (!data.name || !data.image || !data.category || !data.price) { alert('⚠️ الرجاء ملء جميع الحقول المطلوبة'); return; }
    
    if (editId) { await updateDoc(doc(db, "products", editId), data); alert('✅ تم التحديث'); cancelEdit(); } 
    else { data.createdAt = new Date(); await addDoc(collection(db, "products"), data); alert('✅ تم الإضافة'); document.getElementById('productForm').reset(); document.getElementById('colorsInputGroup').style.display = 'none'; }
    await loadProducts();
});

window.deleteCategory = async function(id) { if(confirm('حذف؟')) { await deleteDoc(doc(db, "categories", id)); await loadCategories(); } };
window.deleteProduct = async function(id) { if(confirm('حذف؟')) { await deleteDoc(doc(db, "products", id)); await loadProducts(); } };

window.editProduct = function(id, name, image, category, price, oldPrice, hasColors, colors) {
    document.getElementById('editId').value = id;
    document.getElementById('pName').value = name;
    document.getElementById('pImage').value = image;
    document.getElementById('pCategory').value = category;
    document.getElementById('pPrice').value = price;
    document.getElementById('pOldPrice').value = oldPrice === 'null' ? '' : oldPrice;
    document.getElementById('pHasColors').checked = hasColors;
    document.getElementById('pColors').value = colors;
    document.getElementById('colorsInputGroup').style.display = hasColors ? 'block' : 'none';
    document.getElementById('formTitle').textContent = '✏️ تعديل المنتج';
    document.getElementById('submitBtn').textContent = 'حفظ التعديلات';
    document.getElementById('cancelBtn').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
window.cancelEdit = function() {
    document.getElementById('editId').value = '';
    document.getElementById('formTitle').textContent = 'إضافة منتج جديد';
    document.getElementById('submitBtn').textContent = 'حفظ المنتج';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('productForm').reset();
    document.getElementById('colorsInputGroup').style.display = 'none';
};

// ============ إدارة البنرات ============
async function loadBanners() {
    const list = document.getElementById('bannersList');
    list.innerHTML = 'جاري التحميل...';
    const snapshot = await getDocs(collection(db, "banners"));
    list.innerHTML = '';
    if (snapshot.empty) { list.innerHTML = '<p style="text-align:center;color:#999;">لا توجد بنرات</p>'; return; }
    snapshot.forEach((docSnap) => {
        const b = docSnap.data();
        const div = document.createElement('div'); div.className = 'item-row';
        div.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
                <img src="${b.imageUrl}" class="banner-preview" onerror="this.src='https://via.placeholder.com/100x50'">
                <div><strong>بنر</strong><br><small>${b.isActive ? '🟢 مفعل' : '🔴 معطل'}</small></div>
            </div>
            <button class="btn-delete" onclick="deleteBanner('${docSnap.id}')">حذف</button>`;
        list.appendChild(div);
    });
}

document.getElementById('bannerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "banners"), {
        imageUrl: document.getElementById('bImageUrl').value.trim(),
        isActive: document.getElementById('bIsActive').checked,
        createdAt: new Date()
    });
    alert('✅ تم إضافة البنر'); document.getElementById('bannerForm').reset(); document.getElementById('bIsActive').checked = true;
    await loadBanners();
});

window.deleteBanner = async function(id) { if(confirm('حذف البنر؟')) { await deleteDoc(doc(db, "banners", id)); await loadBanners(); } };

// ============ إدارة الطلبات (مختصرة للتركيز على الجديد) ============
async function loadOrders() {
    const list = document.getElementById('ordersList');
    const count = document.getElementById('ordersCount');
    list.innerHTML = 'جاري التحميل...';
    const snapshot = await getDocs(collection(db, "orders"));
    count.textContent = snapshot.size;
    list.innerHTML = '';
    if (snapshot.empty) { list.innerHTML = '<p style="text-align:center;color:#999;">لا توجد طلبات</p>'; return; }
    snapshot.forEach((docSnap) => {
        const o = docSnap.data();
        const div = document.createElement('div'); div.className = 'item-row'; div.style.flexDirection = 'column'; div.style.alignItems = 'flex-start';
        let itemsHtml = (o.items || []).map(i => `<div>${i.name} × ${i.quantity} = ${(i.price * i.quantity).toFixed(2)} ر.س (لون: ${i.color || 'افتراضي'})</div>`).join('');
        div.innerHTML = `<strong>طلب #${docSnap.id.slice(0,8)}</strong><div>${o.customerName} - ${o.phone}</div><div style="margin:10px 0; background:#f9f9f9; padding:10px; width:100%; border-radius:4px;">${itemsHtml}</div><strong style="color:#e63946;">المجموع: ${o.total?.toFixed(2)} ر.س</strong>`;
        list.appendChild(div);
    });
}

window.switchTab = function(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(tab + '-tab').classList.add('active');
    if (tab === 'products') loadProducts();
    if (tab === 'categories') loadCategories();
    if (tab === 'banners') loadBanners();
    if (tab === 'orders') loadOrders();
};
