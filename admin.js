import { auth, signOut, onAuthStateChanged } from './firebase-config.js';
import { db, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from './firebase-config.js';

const ADMIN_EMAIL = 'ibrahimabushmud@gmail.com';

// متغيرات الصور المرفوعة
let uploadedProductImage = '';
let uploadedBannerImage = '';

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

// 3. تبديل مصدر الصورة
window.toggleImageSource = function() {
    const source = document.querySelector('input[name="imageSource"]:checked').value;
    document.getElementById('urlInput').style.display = source === 'url' ? 'block' : 'none';
    document.getElementById('uploadInput').style.display = source === 'upload' ? 'block' : 'none';
    if (source === 'url') {
        document.getElementById('pImage').required = true;
        document.getElementById('pImageFile').required = false;
    } else {
        document.getElementById('pImage').required = false;
        document.getElementById('pImageFile').required = true;
    }
};

window.toggleBannerImageSource = function() {
    const source = document.querySelector('input[name="bannerImageSource"]:checked').value;
    document.getElementById('bannerUrlInput').style.display = source === 'url' ? 'block' : 'none';
    document.getElementById('bannerUploadInput').style.display = source === 'upload' ? 'block' : 'none';
    if (source === 'url') {
        document.getElementById('bImageUrl').required = true;
        document.getElementById('bImageFile').required = false;
    } else {
        document.getElementById('bImageUrl').required = false;
        document.getElementById('bImageFile').required = true;
    }
};

// 4. معاينة الصورة قبل الرفع
window.previewImage = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('imagePreview').style.display = 'block';
            uploadedProductImage = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.previewBannerImage = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('bannerImagePreview').src = e.target.result;
            document.getElementById('bannerImagePreview').style.display = 'block';
            uploadedBannerImage = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
};

// 5. إدارة الأقسام الهرمية
let allCategories = [];

async function loadCategories() {
    const select = document.getElementById('pCategory');
    const list = document.getElementById('categoriesList');
    
    select.innerHTML = '<option value="">-- اختر القسم --</option>';
    list.innerHTML = 'جاري التحميل...';

    const snapshot = await getDocs(collection(db, "categories"));
    allCategories = [];
    
    snapshot.forEach(docSnap => {
        allCategories.push({ 
            id: docSnap.id, 
            ...docSnap.data(),
            level: docSnap.data().level || 1,
            order: docSnap.data().order || 100
        });
    });

    allCategories.sort((a, b) => a.order - b.order);

    allCategories.forEach(cat => {
        const indent = '  '.repeat(cat.level - 1);
        const levelLabel = cat.level === 1 ? '(رئيسي)' : cat.level === 2 ? '(فرعي)' : '(فرعي من الفرعي)';
        select.innerHTML += `<option value="${cat.name}">${indent}${cat.name} ${levelLabel}</option>`;
    });

    displayCategoryTree();
    updateParentSelect();
}

window.updateParentSelect = function() {
    const level = parseInt(document.getElementById('catLevel').value);
    const parentSelect = document.getElementById('parentCategory');
    
    parentSelect.innerHTML = '<option value="">-- لا يوجد (قسم رئيسي) --</option>';
    
    if (level === 1) {
        parentSelect.disabled = true;
    } else if (level === 2) {
        const level1Cats = allCategories.filter(c => c.level === 1);
        level1Cats.forEach(cat => {
            parentSelect.innerHTML += `<option value="${cat.name}">${cat.name} (المستوى 1)</option>`;
        });
        parentSelect.disabled = false;
    } else if (level === 3) {
        const level2Cats = allCategories.filter(c => c.level === 2);
        level2Cats.forEach(cat => {
            parentSelect.innerHTML += `<option value="${cat.name}">${cat.name} (المستوى 2)</option>`;
        });
        parentSelect.disabled = false;
    }
};

function displayCategoryTree() {
    const list = document.getElementById('categoriesList');
    const level1Cats = allCategories.filter(c => c.level === 1);
    
    let html = '';
    
    if (level1Cats.length === 0) {
        html = '<p style="text-align:center; color:#666;">لا توجد أقسام</p>';
    } else {
        level1Cats.forEach(mainCat => {
            html += `
                <div class="tree-item tree-level-1">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                        <div style="flex:1;">
                            <span class="badge-order">ترتيب: ${mainCat.order}</span>
                            <span class="level-badge level-1">مستوى 1</span>
                            <strong style="font-size:18px;">📁 ${mainCat.name}</strong>
                        </div>
                        <div class="order-controls">
                            <button class="btn-move" onclick="changeCategoryOrder('${mainCat.id}', -1)">⬆️</button>
                            <button class="btn-move" onclick="changeCategoryOrder('${mainCat.id}', 1)">⬇️</button>
                            <button class="btn-delete" onclick="deleteCategory('${mainCat.id}')">حذف</button>
                        </div>
                    </div>
                </div>
            `;
            
            const level2Cats = allCategories.filter(c => c.level === 2 && c.parentCategory === mainCat.name);
            level2Cats.forEach(subCat => {
                html += `
                    <div class="tree-item tree-level-2">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                            <div style="flex:1;">
                                <span class="badge-order">ترتيب: ${subCat.order}</span>
                                <span class="level-badge level-2">مستوى 2</span>
                                <strong style="font-size:16px;">📂 ${subCat.name}</strong>
                                <small style="display:block; color:#666;">فرع من: ${subCat.parentCategory}</small>
                            </div>
                            <div class="order-controls">
                                <button class="btn-move" onclick="changeCategoryOrder('${subCat.id}', -1)">⬆️</button>
                                <button class="btn-move" onclick="changeCategoryOrder('${subCat.id}', 1)">⬇️</button>
                                <button class="btn-delete" onclick="deleteCategory('${subCat.id}')">حذف</button>
                            </div>
                        </div>
                    </div>
                `;
                
                const level3Cats = allCategories.filter(c => c.level === 3 && c.parentCategory === subCat.name);
                level3Cats.forEach(subSubCat => {
                    html += `
                        <div class="tree-item tree-level-3">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                                <div style="flex:1;">
                                    <span class="badge-order">ترتيب: ${subSubCat.order}</span>
                                    <span class="level-badge level-3">مستوى 3</span>
                                    <strong style="font-size:14px;">📄 ${subSubCat.name}</strong>
                                    <small style="display:block; color:#999;">فرع من: ${subSubCat.parentCategory}</small>
                                </div>
                                <div class="order-controls">
                                    <button class="btn-move" onclick="changeCategoryOrder('${subSubCat.id}', -1)">⬆️</button>
                                    <button class="btn-move" onclick="changeCategoryOrder('${subSubCat.id}', 1)">⬇️</button>
                                    <button class="btn-delete" onclick="deleteCategory('${subSubCat.id}')">حذف</button>
                                </div>
                            </div>
                        </div>
                    `;
                });
            });
        });
    }
    
    list.innerHTML = html;
}

window.changeCategoryOrder = async function(id, delta) {
    const cat = allCategories.find(c => c.id === id);
    if (cat) {
        const newOrder = Math.max(1, cat.order + delta);
        await updateDoc(doc(db, "categories", id), { order: newOrder });
        loadCategories();
    }
};

document.getElementById('categoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const level = parseInt(document.getElementById('catLevel').value);
    const parentCategory = document.getElementById('parentCategory').value;
    const name = document.getElementById('catName').value.trim();
    const order = parseInt(document.getElementById('catOrder').value) || 100;
    
    if (level > 1 && !parentCategory) {
        alert('⚠️ الرجاء اختيار القسم الأب للمستوى ' + level);
        return;
    }
    
    await addDoc(collection(db, "categories"), {
        name: name,
        level: level,
        parentCategory: parentCategory || null,
        order: order,
        createdAt: new Date()
    });
    
    document.getElementById('catName').value = '';
    document.getElementById('parentCategory').value = '';
    document.getElementById('catOrder').value = '100';
    loadCategories();
});

window.deleteCategory = async (id) => {
    if(confirm('حذف هذا القسم؟ (سيتم حذف الفروع التابعة أيضاً)')) {
        const cat = allCategories.find(c => c.id === id);
        
        if (cat) {
            const subCategories = allCategories.filter(c => c.parentCategory === cat.name);
            for (const sub of subCategories) {
                const subSubCategories = allCategories.filter(c => c.parentCategory === sub.name);
                for (const subSub of subSubCategories) {
                    await deleteDoc(doc(db, "categories", subSub.id));
                }
                await deleteDoc(doc(db, "categories", sub.id));
            }
        }
        
        await deleteDoc(doc(db, "categories", id));
        loadCategories();
    }
};

// 6. إدارة المنتجات
document.getElementById('pHasColors').addEventListener('change', (e) => {
    document.getElementById('colorsInputGroup').style.display = e.target.checked ? 'block' : 'none';
});

document.getElementById('pIsSale').addEventListener('change', (e) => {
    document.getElementById('saleOptionsGroup').style.display = e.target.checked ? 'block' : 'none';
});

async function loadProducts() {
    const list = document.getElementById('productsList');
    list.innerHTML = 'جاري التحميل...';
    const snapshot = await getDocs(collection(db, "products"));
    document.getElementById('prodCount').textContent = snapshot.size;
    
    let products = [];
    snapshot.forEach(docSnap => {
        products.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    products.sort((a, b) => (a.order || 100) - (b.order || 100));
    
    let html = '';
    products.forEach(p => {
        const badges = [];
        if (p.isNew) badges.push('<span class="badge-new">جديد</span>');
        if (p.isSale && p.discountPercent) badges.push(`<span class="badge-sale">خصم ${p.discountPercent}%</span>`);
        
        html += `
            <div class="item-row">
                <img src="${p.image}" class="banner-preview" style="width:50px; height:50px;">
                <div style="flex:1;">
                    <strong>${badges.join(' ')}${p.name}</strong><br>
                    <small>${p.price} د.إ | ${p.category} | ترتيب: ${p.order || 100}</small>
                </div>
                <div class="order-controls">
                    <button class="btn-move" onclick="changeProductOrder('${p.id}', -1)">⬆️</button>
                    <button class="btn-move" onclick="changeProductOrder('${p.id}', 1)">⬇️</button>
                    <button class="btn-edit" onclick="editProduct('${p.id}', '${p.name}', '${p.image}', '${p.category}', ${p.price}, ${p.oldPrice || 0}, ${p.hasColors}, '${p.colors || ''}', ${p.order || 100}, '${p.displayLocation || 'all'}', ${p.isNew || false}, ${p.isSale || false}, ${p.discountPercent || 0}, '${p.saleEndDate || ''}')">تعديل</button>
                    <button class="btn-delete" onclick="deleteProduct('${p.id}')">حذف</button>
                </div>
            </div>`;
    });
    list.innerHTML = html || '<p>لا توجد منتجات</p>';
}

window.changeProductOrder = async function(id, delta) {
    const snapshot = await getDocs(collection(db, "products"));
    let products = [];
    snapshot.forEach(docSnap => {
        products.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    const product = products.find(p => p.id === id);
    if (product) {
        const newOrder = Math.max(1, (product.order || 100) + delta);
        await updateDoc(doc(db, "products", id), { order: newOrder });
        loadProducts();
    }
};

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('editId').value;
    
    // تحديد مصدر الصورة
    const imageSource = document.querySelector('input[name="imageSource"]:checked').value;
    let imageUrl = '';
    
    if (imageSource === 'url') {
        imageUrl = document.getElementById('pImage').value;
    } else {
        imageUrl = uploadedProductImage;
        if (!imageUrl) {
            alert('⚠️ الرجاء رفع صورة المنتج');
            return;
        }
    }
    
    const productData = {
        name: document.getElementById('pName').value,
        image: imageUrl,
        category: document.getElementById('pCategory').value,
        price: Number(document.getElementById('pPrice').value),
        oldPrice: Number(document.getElementById('pOldPrice').value) || null,
        order: Number(document.getElementById('pOrder').value) || 100,
        displayLocation: document.getElementById('pDisplayLocation').value,
        isNew: document.getElementById('pIsNew').checked,
        isSale: document.getElementById('pIsSale').checked,
        discountPercent: Number(document.getElementById('pDiscountPercent').value) || 0,
        saleEndDate: document.getElementById('pSaleEndDate').value || null,
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
        document.getElementById('saleOptionsGroup').style.display = 'none';
        document.getElementById('pOrder').value = '100';
        document.getElementById('imagePreview').style.display = 'none';
        uploadedProductImage = '';
    }
    loadProducts();
});

window.editProduct = (id, name, image, category, price, oldPrice, hasColors, colors, order, displayLocation, isNew, isSale, discountPercent, saleEndDate) => {
    document.getElementById('editId').value = id;
    document.getElementById('pName').value = name;
    document.getElementById('pImage').value = image;
    document.getElementById('pCategory').value = category;
    document.getElementById('pPrice').value = price;
    document.getElementById('pOldPrice').value = oldPrice;
    document.getElementById('pOrder').value = order;
    document.getElementById('pDisplayLocation').value = displayLocation;
    document.getElementById('pIsNew').checked = isNew;
    document.getElementById('pIsSale').checked = isSale;
    document.getElementById('pDiscountPercent').value = discountPercent || '';
    document.getElementById('pSaleEndDate').value = saleEndDate || '';
    document.getElementById('pHasColors').checked = hasColors;
    document.getElementById('pColors').value = colors;
    document.getElementById('colorsInputGroup').style.display = hasColors ? 'block' : 'none';
    document.getElementById('saleOptionsGroup').style.display = isSale ? 'block' : 'none';
    
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
    document.getElementById('saleOptionsGroup').style.display = 'none';
    document.getElementById('pOrder').value = '100';
    document.getElementById('imagePreview').style.display = 'none';
    uploadedProductImage = '';
};

window.deleteProduct = async (id) => {
    if(confirm('حذف هذا المنتج؟')) {
        await deleteDoc(doc(db, "products", id));
        loadProducts();
    }
};

// 7. إدارة البنرات
async function loadBanners() {
    const list = document.getElementById('bannersList');
    list.innerHTML = 'جاري التحميل...';
    const snapshot = await getDocs(collection(db, "banners"));
    
    let banners = [];
    snapshot.forEach(docSnap => {
        banners.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    banners.sort((a, b) => (a.order || 100) - (b.order || 100));
    
    let html = '';
    banners.forEach(b => {
        const typeText = b.type === 'top' ? '📌 الشريط العلوي الثابت' : '🎠 شريط الصور المتحرك';
        const statusClass = b.isActive ? '' : 'inactive';
        const statusText = b.isActive ? 'مفعل' : 'معطل';
        
        html += `
            <div class="item-row">
                <img src="${b.imageUrl}" class="banner-preview" onerror="this.src='https://via.placeholder.com/120x60?text=No+Image'">
                <div class="banner-info">
                    <strong>${typeText}</strong>
                    <small>الرابط: ${b.link || 'لا يوجد'} | ترتيب: ${b.order || 100}</small>
                    <small style="color: ${b.isActive ? 'green' : 'red'}">الحالة: ${statusText}</small>
                </div>
                <div class="order-controls">
                    <button class="btn-move" onclick="changeBannerOrder('${b.id}', -1)">⬆️</button>
                    <button class="btn-move" onclick="changeBannerOrder('${b.id}', 1)">⬇️</button>
                    <button class="btn-toggle ${statusClass}" onclick="toggleBanner('${b.id}', ${b.isActive})">
                        ${b.isActive ? 'تعطيل' : 'تفعيل'}
                    </button>
                    <button class="btn-delete" onclick="deleteBanner('${b.id}')">حذف</button>
                </div>
            </div>`;
    });
    list.innerHTML = html || '<p>لا توجد بنرات</p>';
}

window.changeBannerOrder = async function(id, delta) {
    const snapshot = await getDocs(collection(db, "banners"));
    let banners = [];
    snapshot.forEach(docSnap => {
        banners.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    const banner = banners.find(b => b.id === id);
    if (banner) {
        const newOrder = Math.max(1, (banner.order || 100) + delta);
        await updateDoc(doc(db, "banners", id), { order: newOrder });
        loadBanners();
    }
};

document.getElementById('bannerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // تحديد مصدر صورة البنر
    const imageSource = document.querySelector('input[name="bannerImageSource"]:checked').value;
    let imageUrl = '';
    
    if (imageSource === 'url') {
        imageUrl = document.getElementById('bImageUrl').value;
    } else {
        imageUrl = uploadedBannerImage;
        if (!imageUrl) {
            alert('️ الرجاء رفع صورة البنر');
            return;
        }
    }
    
    await addDoc(collection(db, "banners"), {
        type: document.getElementById('bType').value,
        imageUrl: imageUrl,
        link: document.getElementById('bLink').value || null,
        order: Number(document.getElementById('bOrder').value) || 100,
        isActive: document.getElementById('bIsActive').checked,
        createdAt: new Date()
    });
    e.target.reset();
    document.getElementById('bIsActive').checked = true;
    document.getElementById('bOrder').value = '100';
    document.getElementById('bannerImagePreview').style.display = 'none';
    uploadedBannerImage = '';
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

// 8. إدارة الطلبات
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
                    <p> المجموع: ${o.total} د.إ | 💳 الدفع: ${o.paymentMethod === 'installment' ? 'تقسيط' : o.paymentMethod}</p>
                    <p>📦 المنتجات: ${o.items.map(i => i.name).join(', ')}</p>
                </div>
            </div>`;
    });
    list.innerHTML = html || '<p>لا توجد طلبات</p>';
}
