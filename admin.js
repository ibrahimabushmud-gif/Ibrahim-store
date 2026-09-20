import { db, collection, addDoc, getDocs, deleteDoc, doc } from './firebase-config.js';
import { auth, onAuthStateChanged } from './firebase-config.js';

console.log('✅ admin.js loaded');

// التحقق من الدخول
onAuthStateChanged(auth, (user) => {
    console.log('User:', user);
    if (user) {
        document.getElementById('loginMsg').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        loadData();
    } else {
        document.getElementById('loginMsg').style.display = 'block';
        document.getElementById('adminContent').style.display = 'none';
    }
});

// تحميل البيانات
async function loadData() {
    await loadCategories();
    await loadProducts();
}

// تحميل الأقسام
async function loadCategories() {
    const select = document.getElementById('pCategory');
    const list = document.getElementById('categoriesList');
    select.innerHTML = '<option value="">اختر</option>';
    list.innerHTML = 'جاري التحميل...';
    
    const snapshot = await getDocs(collection(db, "categories"));
    list.innerHTML = '';
    
    if (snapshot.empty) {
        list.innerHTML = '<p>لا توجد أقسام</p>';
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
        div.className = 'item';
        div.innerHTML = `<strong>${cat.name}</strong><button class="btn btn-danger" onclick="deleteItem('categories', '${docSnap.id}')">حذف</button>`;
        list.appendChild(div);
    });
}

// تحميل المنتجات
async function loadProducts() {
    const list = document.getElementById('productsList');
    list.innerHTML = 'جاري التحميل...';
    
    const snapshot = await getDocs(collection(db, "products"));
    list.innerHTML = '';
    
    if (snapshot.empty) {
        list.innerHTML = '<p>لا توجد منتجات</p>';
        return;
    }
    
    snapshot.forEach((docSnap) => {
        const p = docSnap.data();
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
                <img src="${p.image}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;">
                <div><strong>${p.name}</strong><br><small>${p.category} - ${p.price} ر.س</small></div>
            </div>
            <button class="btn btn-danger" onclick="deleteItem('products', '${docSnap.id}')">حذف</button>
        `;
        list.appendChild(div);
    });
}

// إضافة قسم
document.getElementById('categoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('cName').value;
    await addDoc(collection(db, "categories"), { name, createdAt: new Date() });
    alert('✅ تم الإضافة');
    document.getElementById('cName').value = '';
    await loadCategories();
});

// إضافة منتج
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('pName').value,
        image: document.getElementById('pImage').value,
        category: document.getElementById('pCategory').value,
        price: Number(document.getElementById('pPrice').value),
        oldPrice: document.getElementById('pOldPrice').value ? Number(document.getElementById('pOldPrice').value) : null,
        createdAt: new Date()
    };
    await addDoc(collection(db, "products"), data);
    alert('✅ تم الإضافة');
    document.getElementById('productForm').reset();
    await loadProducts();
});

// حذف
window.deleteItem = async function(collectionName, id) {
    if (!confirm('حذف؟')) return;
    await deleteDoc(doc(db, collectionName, id));
    alert('✅ تم الحذف');
    if (collectionName === 'categories') await loadCategories();
    else await loadProducts();
};

// التبديل بين التبويبات
window.switchTab = function(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(tab + '-tab').classList.add('active');
};
