import { db, collection, addDoc, getDocs, deleteDoc, doc } from './firebase-config.js';
import { auth, onAuthStateChanged } from './firebase-config.js';

console.log('✅ admin.js loaded');

onAuthStateChanged(auth, (user) => {
    console.log('User:', user);
    if (user) {
        document.getElementById('status').textContent = '✅ تم تسجيل الدخول';
        document.getElementById('content').style.display = 'block';
        loadCategories();
        loadProducts();
    } else {
        document.getElementById('status').textContent = '⚠️ يجب تسجيل الدخول - <a href="login.html">اضغط هنا</a>';
    }
});

async function loadCategories() {
    const list = document.getElementById('catList');
    const select = document.getElementById('prodCategory');
    list.innerHTML = 'جاري...';
    select.innerHTML = '<option>اختر</option>';
    
    const snapshot = await getDocs(collection(db, "categories"));
    list.innerHTML = '';
    
    snapshot.forEach((docSnap) => {
        const cat = docSnap.data();
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = cat.name;
        select.appendChild(opt);
        
        const div = document.createElement('div');
        div.innerHTML = cat.name + ' <button onclick="deleteCategory(\'' + docSnap.id + '\')">حذف</button>';
        list.appendChild(div);
    });
}

async function loadProducts() {
    const list = document.getElementById('prodList');
    list.innerHTML = 'جاري...';
    
    const snapshot = await getDocs(collection(db, "products"));
    list.innerHTML = '';
    
    snapshot.forEach((docSnap) => {
        const p = docSnap.data();
        const div = document.createElement('div');
        div.innerHTML = p.name + ' - ' + p.price + ' ر.س <button onclick="deleteProduct(\'' + docSnap.id + '\')">حذف</button>';
        list.appendChild(div);
    });
}

document.getElementById('catForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "categories"), { 
        name: document.getElementById('catName').value,
        createdAt: new Date()
    });
    alert('✅ تم');
    document.getElementById('catName').value = '';
    loadCategories();
});

document.getElementById('prodForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "products"), {
        name: document.getElementById('prodName').value,
        image: document.getElementById('prodImage').value,
        category: document.getElementById('prodCategory').value,
        price: Number(document.getElementById('prodPrice').value),
        createdAt: new Date()
    });
    alert('✅ تم');
    document.getElementById('prodForm').reset();
    loadProducts();
});

window.deleteCategory = async function(id) {
    if (!confirm('حذف؟')) return;
    await deleteDoc(doc(db, "categories", id));
    alert('✅ تم الحذف');
    loadCategories();
};

window.deleteProduct = async function(id) {
    if (!confirm('حذف؟')) return;
    await deleteDoc(doc(db, "products", id));
    alert('✅ تم الحذف');
    loadProducts();
};
