import { db, collection, addDoc, getDocs, deleteDoc, doc } from './firebase-config.js';
import { auth, onAuthStateChanged } from './firebase-config.js';

console.log('✅ JavaScript loaded');

// التحقق من تسجيل الدخول
onAuthStateChanged(auth, (user) => {
    console.log('User status:', user ? 'logged in' : 'not logged in');
    
    if (user) {
        document.getElementById('status').textContent = 'مرحباً! تم تسجيل الدخول';
        document.getElementById('content').style.display = 'block';
        loadCategories();
        loadProducts();
    } else {
        document.getElementById('status').textContent = '️ يجب تسجيل الدخول أولاً. اذهب إلى صفحة login.html';
    }
});

// تحميل الأقسام
async function loadCategories() {
    console.log('Loading categories...');
    const list = document.getElementById('catList');
    const select = document.getElementById('prodCategory');
    
    list.innerHTML = 'جاري التحميل...';
    select.innerHTML = '<option value="">اختر القسم</option>';
    
    try {
        const snapshot = await getDocs(collection(db, "categories"));
        console.log('Categories count:', snapshot.size);
        
        if (snapshot.empty) {
            list.innerHTML = '<p>لا توجد أقسام</p>';
            return;
        }
        
        list.innerHTML = '';
        snapshot.forEach((docSnap) => {
            const cat = docSnap.data();
            console.log('Category:', cat.name);
            
            // إضافة للقائمة المنسدلة
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            select.appendChild(option);
            
            // إضافة للقائمة
            const div = document.createElement('div');
            div.innerHTML = `${cat.name} <button onclick="deleteCategory('${docSnap.id}')">حذف</button>`;
            list.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
        list.innerHTML = `<p style="color:red;">خطأ: ${error.message}</p>`;
    }
}

// تحميل المنتجات
async function loadProducts() {
    console.log('Loading products...');
    const list = document.getElementById('prodList');
    list.innerHTML = 'جاري التحميل...';
    
    try {
        const snapshot = await getDocs(collection(db, "products"));
        console.log('Products count:', snapshot.size);
        
        if (snapshot.empty) {
            list.innerHTML = '<p>لا توجد منتجات</p>';
            return;
        }
        
        list.innerHTML = '';
        snapshot.forEach((docSnap) => {
            const prod = docSnap.data();
            console.log('Product:', prod.name);
            
            const div = document.createElement('div');
            div.innerHTML = `${prod.name} - ${prod.price} ر.س <button onclick="deleteProduct('${docSnap.id}')">حذف</button>`;
            list.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading products:', error);
        list.innerHTML = `<p style="color:red;">خطأ: ${error.message}</p>`;
    }
}

// إضافة قسم
document.getElementById('catForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('catName').value;
    
    try {
        await addDoc(collection(db, "categories"), { name, createdAt: new Date() });
        alert('✅ تم إضافة القسم');
        document.getElementById('catName').value = '';
        loadCategories();
    } catch (error) {
        alert('خطأ: ' + error.message);
    }
});

// إضافة منتج
document.getElementById('prodForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        name: document.getElementById('prodName').value,
        image: document.getElementById('prodImage').value,
        category: document.getElementById('prodCategory').value,
        price: Number(document.getElementById('prodPrice').value),
        createdAt: new Date()
    };
    
    try {
        await addDoc(collection(db, "products"), data);
        alert('✅ تم إضافة المنتج');
        document.getElementById('prodForm').reset();
        loadProducts();
    } catch (error) {
        alert('خطأ: ' + error.message);
    }
});

// حذف قسم
window.deleteCategory = async function(id) {
    if (!confirm('حذف القسم؟')) return;
    try {
        await deleteDoc(doc(db, "categories", id));
        alert('✅ تم الحذف');
        loadCategories();
    } catch (error) {
        alert('خطأ: ' + error.message);
    }
};

// حذف منتج
window.deleteProduct = async function(id) {
    if (!confirm('حذف المنتج؟')) return;
    try {
        await deleteDoc(doc(db, "products", id));
        alert('✅ تم الحذف');
        loadProducts();
    } catch (error) {
        alert('خطأ: ' + error.message);
    }
};
