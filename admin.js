import { auth, signOut, onAuthStateChanged } from './firebase-config.js';
import { db, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from './firebase-config.js';

const ADMIN_EMAIL = 'ibrahimabushmud@gmail.com';

// 1. التحقق من صلاحية المدير
onAuthStateChanged(auth, (user) => {
    if (!user || user.email !== ADMIN_EMAIL) {
        document.getElementById('loginMsg').style.display = 'block';
        document.getElementById('adminContent').style.display = 'none';
    } else {
        document.getElementById('loginMsg').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        loadCategories();
        loadProducts();
        loadBanners();
        loadOrders();
    }
});

// 2. تبديل التبويبات
window.switchTab = function(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
};

// 3. إدارة الأقسام
async function loadCategories() {
    const select = document.getElementById('pCategory');
    const list = document.getElementById('categoriesList');
    select.innerHTML = '<option value="">-- اختر القسم --</option>';
    list.innerHTML = 'جاري التحميل...';

    const snapshot = await getDocs(collection(db, "categories"));
    document.getElementById('catCount').textContent = snapshot.size;
    
    let html = '';
    snapshot.forEach(docSnap => {
        const cat = docSnap.data();
        select.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
        html += `
            <div class="item-row">
                <span>${cat.name}</span>
                <button class="btn-delete" onclick="deleteCategory('${docSnap.id}')">حذف</button>
            </div>`;
    });
    list.innerHTML = html || '<p>لا توجد أقسام</p>';
}

document.getElementById('categoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('cName').value.trim();
    await addDoc(collection(db, "categories"), { name });
    document.getElementById('cName').value = '';
    loadCategories();
});

window.deleteCategory = async (id) => {
    if(confirm('حذف هذا القسم؟')) {
        await deleteDoc(doc(db, "categories", id));
        loadCategories();
    }
};

// 4. إدارة المنتجات
document.getElementById('pHasColors').addEventListener('change', (e) => {
    document.getElementById('colorsInputGroup').style.display = e.target.checked ? 'block' : 'none';
});

async function loadProducts() {
    const list = document.getElementById('productsList');
    list.innerHTML = 'جاري التحميل...';
    const snapshot = await getDocs(collection(db, "products"));
    document.getElementById('prodCount').textContent = snapshot.size;
    
    let html = '';
    snapshot.forEach(docSnap => {
        const p = docSnap.data();
        html += `
            <div class="item-row">
                <img src="${p.image}" class="banner-preview" style="width:50px; height:50px;">
                <div style="flex:1;">
                    <strong>${p.name}</strong><br>
                    <small>${p.price} د.إ | ${p.category}</small>
                </div>
                <div>
                    <button class="btn-edit" onclick="editProduct('${docSnap.id}', '${p.name}', '${p.image}', '${p.category}', ${p.price}, ${p.oldPrice || 0}, ${p.hasColors}, '${p.colors || ''}')">تعديل</button>
                    <button class="btn-delete" onclick="deleteProduct('${docSnap.id}')">حذف</button>
                </div>
            </div>`;
    });
    list.innerHTML = html || '<p>لا توجد منتجات</p>';
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('editId').value;
    const productData = {
        name: document.getElementById('pName').value,
        image: document.getElementById('pImage').value,
        category: document.getElementById('pCategory').value,
        price: Number(document.getElementById('pPrice').value),
        oldPrice: Number(document.getElementById('pOldPrice').value) || null,
        hasColors: document.getElementById('pHasColors').checked,
        colors: document.getElementById('pColors').value
    };

    if (editId) {
        await updateDoc(doc(db, "products", editId), productData);
        cancelEdit();
    } else {
        await addDoc(collection(db, "products"), productData);
        e.target.reset();
        document.getElementById('colorsInputGroup').style.display = 'none';
    }
    loadProducts();
});

window.editProduct = (id, name, image, category, price, oldPrice, hasColors, colors) => {
    document.getElementById('editId').value = id;
    document.getElementById('pName').value = name;
    document.getElementById('pImage').value = image;
    document.getElementById('pCategory').value = category;
    document.getElementById('pPrice').value = price;
    document.getElementById('pOldPrice').value = oldPrice;
    document.getElementById('pHasColors').checked = hasColors;
    document.getElementById('pColors').value = colors;
    document.getElementById('colorsInputGroup').style.display = hasColors ? 'block' : 'none';
    
    document.getElementById('formTitle').textContent = 'تعديل المنتج';
    document.getElementById('submitBtn').textContent = 'تحديث المنتج';
    document.getElementById('cancelBtn').style.display = 'block';
};

window.cancelEdit = () => {
    document.getElementById('productForm').reset();
    document.getElementById('editId').value = '';
    document.getElementById('formTitle').textContent = 'إضافة منتج جديد';
    document.getElementById('submitBtn').textContent = 'حفظ المنتج';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('colorsInputGroup').style.display = 'none';
};

window.deleteProduct = async (id) => {
    if(confirm('حذف هذا المنتج؟')) {
        await deleteDoc(doc(db, "products", id));
        loadProducts();
    }
};

// 5. إدارة البنرات (النظام الجديد)
async function loadBanners() {
    const list = document.getElementById('bannersList');
    list.innerHTML = 'جاري التحميل...';
    const snapshot = await getDocs(collection(db, "banners"));
    
    let html = '';
    snapshot.forEach(docSnap => {
        const b = docSnap.data();
        const typeText = b.type === 'top' ? '📌 الشريط العلوي الثابت' : '🎠 شريط الصور المتحرك';
        const statusClass = b.isActive ? '' : 'inactive';
        const statusText = b.isActive ? 'مفعل' : 'معطل';
        
        html += `
            <div class="item-row">
                <img src="${b.imageUrl}" class="banner-preview" onerror="this.src='https://via.placeholder.com/120x60?text=No+Image'">
                <div class="banner-info">
                    <strong>${typeText}</strong>
                    <small>الرابط: ${b.link || 'لا يوجد'}</small>
                    <small style="color: ${b.isActive ? 'green' : 'red'}">الحالة: ${statusText}</small>
                </div>
                <div>
                    <button class="btn-toggle ${statusClass}" onclick="toggleBanner('${docSnap.id}', ${b.isActive})">
                        ${b.isActive ? 'تعطيل' : 'تفعيل'}
                    </button>
                    <button class="btn-delete" onclick="deleteBanner('${docSnap.id}')">حذف</button>
                </div>
            </div>`;
    });
    list.innerHTML = html || '<p>لا توجد بنرات</p>';
}

document.getElementById('bannerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "banners"), {
        type: document.getElementById('bType').value,
        imageUrl: document.getElementById('bImageUrl').value,
        link: document.getElementById('bLink').value || null,
        isActive: document.getElementById('bIsActive').checked,
        createdAt: new Date()
    });
    e.target.reset();
    document.getElementById('bIsActive').checked = true;
    loadBanners();
});

window.toggleBanner = async (id, currentStatus) => {
    await updateDoc(doc(db, "banners", id), { isActive: !currentStatus });
    loadBanners();
};

window.deleteBanner = async (id) => {
    if(confirm('حذف هذا البنر؟')) {
        await deleteDoc(doc(db, "banners", id));
        loadBanners();
    }
};

// 6. إدارة الطلبات
async function loadOrders() {
    const list = document.getElementById('ordersList');
    list.innerHTML = 'جاري التحميل...';
    const snapshot = await getDocs(collection(db, "orders"));
    document.getElementById('ordersCount').textContent = snapshot.size;
    
    let html = '';
    snapshot.forEach(docSnap => {
        const o = docSnap.data();
        const date = o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('ar-AE') : 'غير محدد';
        html += `
            <div class="item-row" style="flex-direction:column; align-items:flex-start;">
                <div style="width:100%; display:flex; justify-content:space-between; margin-bottom:10px;">
                    <strong>طلب #${o.orderId}</strong>
                    <span style="color:#666;">${date}</span>
                </div>
                <div style="width:100%; font-size:14px; color:#555;">
                    <p>👤 ${o.customerName} | 📱 ${o.phone}</p>
                    <p>💰 المجموع: ${o.total} د.إ | 💳 الدفع: ${o.paymentMethod === 'installment' ? 'تقسيط' : o.paymentMethod}</p>
                    <p>📦 المنتجات: ${o.items.map(i => i.name).join(', ')}</p>
                </div>
            </div>`;
    });
    list.innerHTML = html || '<p>لا توجد طلبات</p>';
}
