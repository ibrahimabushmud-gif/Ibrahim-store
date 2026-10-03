import { auth, signOut, onAuthStateChanged } from './firebase-config.js';
import { db, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, setDoc } from './firebase-config.js';

const ADMIN_EMAIL = 'ibrahimabushmud@gmail.com';
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
        loadSettings();
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
};

window.toggleBannerImageSource = function() {
    const source = document.querySelector('input[name="bannerImageSource"]:checked').value;
    document.getElementById('bannerUrlInput').style.display = source === 'url' ? 'block' : 'none';
    document.getElementById('bannerUploadInput').style.display = source === 'upload' ? 'block' : 'none';
};

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

// ============ إدارة الإعدادات ============
let storeSettings = {};

async function loadSettings() {
    try {
        const snapshot = await getDocs(collection(db, "settings"));
        storeSettings = {};
        snapshot.forEach(docSnap => {
            storeSettings[docSnap.id] = docSnap.data().value;
        });
        populateSettingsForm();
    } catch (error) {
        console.log('لا توجد إعدادات محفوظة بعد');
    }
}

function populateSettingsForm() {
    document.getElementById('sPrimaryColor').value = storeSettings.primaryColor || '#D4AF37';
    document.getElementById('sStoreName').value = storeSettings.storeName || 'شرف DG';
    document.getElementById('sWhatsapp').value = storeSettings.whatsapp || '+971592152484';
    document.getElementById('sEmail').value = storeSettings.email || 'info@sharafdg.com';
    document.getElementById('sWelcomeEnabled').checked = storeSettings.welcomeEnabled !== false;
    document.getElementById('sWelcomeDiscount').value = storeSettings.welcomeDiscount || 10;
    document.getElementById('sWelcomeCode').value = storeSettings.welcomeCode || 'WELCOME10';
    document.getElementById('sFreeShipping').value = storeSettings.freeShipping || 500;
    document.getElementById('sCountdownEnabled').checked = storeSettings.countdownEnabled !== false;
    document.getElementById('sCountdownText').value = storeSettings.countdownText || 'ينتهي العرض خلال';
    document.getElementById('sNotificationsEnabled').checked = storeSettings.notificationsEnabled !== false;
    document.getElementById('sNotifInterval').value = storeSettings.notifInterval || 15;
    document.getElementById('sNotifications').value = storeSettings.notifications || 'أحمد من دبي|آيفون 18 برو\nفاطمة من أبوظبي|سامسونج S26';
    document.getElementById('sTrustBadgesEnabled').checked = storeSettings.trustBadgesEnabled !== false;
    document.getElementById('sFacebook').value = storeSettings.facebook || '';
    document.getElementById('sInstagram').value = storeSettings.instagram || '';
    document.getElementById('sTwitter').value = storeSettings.twitter || '';
    document.getElementById('sFooterDesc').value = storeSettings.footerDesc || '';
}

document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const settingsData = {
        primaryColor: document.getElementById('sPrimaryColor').value,
        storeName: document.getElementById('sStoreName').value,
        whatsapp: document.getElementById('sWhatsapp').value,
        email: document.getElementById('sEmail').value,
        welcomeEnabled: document.getElementById('sWelcomeEnabled').checked,
        welcomeDiscount: Number(document.getElementById('sWelcomeDiscount').value),
        welcomeCode: document.getElementById('sWelcomeCode').value,
        freeShipping: Number(document.getElementById('sFreeShipping').value),
        countdownEnabled: document.getElementById('sCountdownEnabled').checked,
        countdownText: document.getElementById('sCountdownText').value,
        notificationsEnabled: document.getElementById('sNotificationsEnabled').checked,
        notifInterval: Number(document.getElementById('sNotifInterval').value),
        notifications: document.getElementById('sNotifications').value,
        trustBadgesEnabled: document.getElementById('sTrustBadgesEnabled').checked,
        facebook: document.getElementById('sFacebook').value,
        instagram: document.getElementById('sInstagram').value,
        twitter: document.getElementById('sTwitter').value,
        footerDesc: document.getElementById('sFooterDesc').value,
        updatedAt: new Date()
    };
    
    try {
        for (const [key, value] of Object.entries(settingsData)) {
            await setDoc(doc(db, "settings", key), { value: value });
        }
        alert('✅ تم حفظ جميع الإعدادات بنجاح! ستظهر التغييرات في المتجر فوراً.');
    } catch (error) {
        alert('❌ حدث خطأ في الحفظ: ' + error.message);
    }
});

// ============ إدارة الأقسام ============
let allCategories = [];

async function loadCategories() {
    const select = document.getElementById('pCategory');
    const list = document.getElementById('categoriesList');
    select.innerHTML = '<option value="">-- اختر القسم --</option>';
    list.innerHTML = 'جاري التحميل...';

    const snapshot = await getDocs(collection(db, "categories"));
    allCategories = [];
    snapshot.forEach(docSnap => {
        allCategories.push({ id: docSnap.id, ...docSnap.data(), level: docSnap.data().level || 1, order: docSnap.data().order || 100 });
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
    if (level === 1) parentSelect.disabled = true;
    else if (level === 2) {
        allCategories.filter(c => c.level === 1).forEach(cat => {
            parentSelect.innerHTML += `<option value="${cat.name}">${cat.name} (المستوى 1)</option>`;
        });
        parentSelect.disabled = false;
    } else if (level === 3) {
        allCategories.filter(c => c.level === 2).forEach(cat => {
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
            html += `<div class="tree-item tree-level-1"><div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;"><div style="flex:1;"><span class="badge-order">ترتيب: ${mainCat.order}</span><span class="level-badge level-1">مستوى 1</span><strong style="font-size:18px;">📁 ${mainCat.name}</strong></div><div class="order-controls"><button class="btn-move" onclick="changeCategoryOrder('${mainCat.id}', -1)">⬆️</button><button class="btn-move" onclick="changeCategoryOrder('${mainCat.id}', 1)">️</button><button class="btn-delete" onclick="deleteCategory('${mainCat.id}')">حذف</button></div></div></div>`;
            allCategories.filter(c => c.level === 2 && c.parentCategory === mainCat.name).forEach(subCat => {
                html += `<div class="tree-item tree-level-2"><div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;"><div style="flex:1;"><span class="badge-order">ترتيب: ${subCat.order}</span><span class="level-badge level-2">مستوى 2</span><strong style="font-size:16px;">📂 ${subCat.name}</strong><small style="display:block; color:#666;">فرع من: ${subCat.parentCategory}</small></div><div class="order-controls"><button class="btn-move" onclick="changeCategoryOrder('${subCat.id}', -1)">⬆️</button><button class="btn-move" onclick="changeCategoryOrder('${subCat.id}', 1)">️</button><button class="btn-delete" onclick="deleteCategory('${subCat.id}')">حذف</button></div></div></div>`;
                allCategories.filter(c => c.level === 3 && c.parentCategory === subCat.name).forEach(subSubCat => {
                    html += `<div class="tree-item tree-level-3"><div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;"><div style="flex:1;"><span class="badge-order">ترتيب: ${subSubCat.order}</span><span class="level-badge level-3">مستوى 3</span><strong style="font-size:14px;"> ${subSubCat.name}</strong><small style="display:block; color:#999;">فرع من: ${subSubCat.parentCategory}</small></div><div class="order-controls"><button class="btn-move" onclick="changeCategoryOrder('${subSubCat.id}', -1)">⬆️</button><button class="btn-move" onclick="changeCategoryOrder('${subSubCat.id}', 1)">⬇️</button><button class="btn-delete" onclick="deleteCategory('${subSubCat.id}')">حذف</button></div></div></div>`;
                });
            });
        });
    }
    list.innerHTML = html;
}

window.changeCategoryOrder = async function(id, delta) {
    const cat = allCategories.find(c => c.id === id);
    if (cat) {
        await updateDoc(doc(db, "categories", id), { order: Math.max(1, cat.order + delta) });
        loadCategories();
    }
};

document.getElementById('categoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const level = parseInt(document.getElementById('catLevel').value);
    const parentCategory = document.getElementById('parentCategory').value;
    const name = document.getElementById('catName').value.trim();
    const order = parseInt(document.getElementById('catOrder').value) || 100;
    if (level > 1 && !parentCategory) { alert('⚠️ الرجاء اختيار القسم الأب'); return; }
    await addDoc(collection(db, "categories"), { name, level, parentCategory: parentCategory || null, order, createdAt: new Date() });
    document.getElementById('catName').value = '';
    document.getElementById('parentCategory').value = '';
    loadCategories();
});

window.deleteCategory = async (id) => {
    if(confirm('حذف هذا القسم؟')) {
        const cat = allCategories.find(c => c.id === id);
        if (cat) {
            for (const sub of allCategories.filter(c => c.parentCategory === cat.name)) {
                for (const subSub of allCategories.filter(c => c.parentCategory === sub.name)) {
                    await deleteDoc(doc(db, "categories", subSub.id));
                }
                await deleteDoc(doc(db, "categories", sub.id));
            }
        }
        await deleteDoc(doc(db, "categories", id));
        loadCategories();
    }
};

// ============ إدارة المنتجات ============
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
    snapshot.forEach(docSnap => products.push({ id: docSnap.id, ...docSnap.data() }));
    products.sort((a, b) => (a.order || 100) - (b.order || 100));
    
    let html = '';
    products.forEach(p => {
        const badges = [];
        if (p.isNew) badges.push('<span class="badge-new">جديد</span>');
        if (p.isSale && p.discountPercent) badges.push(`<span class="badge-sale">خصم ${p.discountPercent}%</span>`);
        html += `<div class="item-row"><img src="${p.image}" class="banner-preview" style="width:50px; height:50px;"><div style="flex:1;"><strong>${badges.join(' ')}${p.name}</strong><br><small>${p.price} د.إ | ${p.category} | ترتيب: ${p.order || 100}</small></div><div class="order-controls"><button class="btn-move" onclick="changeProductOrder('${p.id}', -1)">⬆️</button><button class="btn-move" onclick="changeProductOrder('${p.id}', 1)">⬇️</button><button class="btn-edit" onclick="editProduct('${p.id}', '${p.name}', '${p.image}', '${p.category}', ${p.price}, ${p.oldPrice || 0}, ${p.hasColors}, '${p.colors || ''}', ${p.order || 100}, '${p.displayLocation || 'all'}', ${p.isNew || false}, ${p.isSale || false}, ${p.discountPercent || 0}, '${p.saleEndDate || ''}')">تعديل</button><button class="btn-delete" onclick="deleteProduct('${p.id}')">حذف</button></div></div>`;
    });
    list.innerHTML = html || '<p>لا توجد منتجات</p>';
}

window.changeProductOrder = async function(id, delta) {
    const snapshot = await getDocs(collection(db, "products"));
    let products = [];
    snapshot.forEach(docSnap => products.push({ id: docSnap.id, ...docSnap.data() }));
    const product = products.find(p => p.id === id);
    if (product) {
        await updateDoc(doc(db, "products", id), { order: Math.max(1, (product.order || 100) + delta) });
        loadProducts();
    }
};

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('editId').value;
    const imageSource = document.querySelector('input[name="imageSource"]:checked').value;
    let imageUrl = imageSource === 'url' ? document.getElementById('pImage').value : uploadedProductImage;
    if (!imageUrl) { alert('⚠️ الرجاء إضافة صورة المنتج'); return; }
    
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

// ============ إدارة البنرات ============
async function loadBanners() {
    const list = document.getElementById('bannersList');
    list.innerHTML = 'جاري التحميل...';
    const snapshot = await getDocs(collection(db, "banners"));
    let banners = [];
    snapshot.forEach(docSnap => banners.push({ id: docSnap.id, ...docSnap.data() }));
    banners.sort((a, b) => (a.order || 100) - (b.order || 100));
    
    let html = '';
    banners.forEach(b => {
        const typeText = b.type === 'top' ? '📌 الشريط العلوي' : '🎠 شريط متحرك';
        const statusClass = b.isActive ? '' : 'inactive';
        html += `<div class="item-row"><img src="${b.imageUrl}" class="banner-preview"><div class="banner-info"><strong>${typeText}</strong><small>الرابط: ${b.link || 'لا يوجد'} | ترتيب: ${b.order || 100}</small><small style="color: ${b.isActive ? 'green' : 'red'}">الحالة: ${b.isActive ? 'مفعل' : 'معطل'}</small></div><div class="order-controls"><button class="btn-move" onclick="changeBannerOrder('${b.id}', -1)">⬆️</button><button class="btn-move" onclick="changeBannerOrder('${b.id}', 1)">⬇️</button><button class="btn-toggle ${statusClass}" onclick="toggleBanner('${b.id}', ${b.isActive})">${b.isActive ? 'تعطيل' : 'تفعيل'}</button><button class="btn-delete" onclick="deleteBanner('${b.id}')">حذف</button></div></div>`;
    });
    list.innerHTML = html || '<p>لا توجد بنرات</p>';
}

window.changeBannerOrder = async function(id, delta) {
    const snapshot = await getDocs(collection(db, "banners"));
    let banners = [];
    snapshot.forEach(docSnap => banners.push({ id: docSnap.id, ...docSnap.data() }));
    const banner = banners.find(b => b.id === id);
    if (banner) {
        await updateDoc(doc(db, "banners", id), { order: Math.max(1, (banner.order || 100) + delta) });
        loadBanners();
    }
};

document.getElementById('bannerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const imageSource = document.querySelector('input[name="bannerImageSource"]:checked').value;
    let imageUrl = imageSource === 'url' ? document.getElementById('bImageUrl').value : uploadedBannerImage;
    if (!imageUrl) { alert('️ الرجاء إضافة صورة البنر'); return; }
    
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

// ============ إدارة الطلبات ============
async function loadOrders() {
    const list = document.getElementById('ordersList');
    list.innerHTML = 'جاري التحميل...';
    const snapshot = await getDocs(collection(db, "orders"));
    document.getElementById('ordersCount').textContent = snapshot.size;
    let html = '';
    snapshot.forEach(docSnap => {
        const o = docSnap.data();
        const date = o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('ar-AE') : 'غير محدد';
        html += `<div class="item-row" style="flex-direction:column; align-items:flex-start;"><div style="width:100%; display:flex; justify-content:space-between; margin-bottom:10px;"><strong>طلب #${o.orderId}</strong><span style="color:#666;">${date}</span></div><div style="width:100%; font-size:14px; color:#555;"><p>👤 ${o.customerName} | 📱 ${o.phone}</p><p>💰 المجموع: ${o.total} د.إ | 💳 الدفع: ${o.paymentMethod === 'installment' ? 'تقسيط' : o.paymentMethod}</p><p> المنتجات: ${o.items.map(i => i.name).join(', ')}</p></div></div>`;
    });
    list.innerHTML = html || '<p>لا توجد طلبات</p>';
}
document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        primaryColor: document.getElementById('sPrimaryColor').value,
        storeName: document.getElementById('sStoreName').value,
        whatsapp: document.getElementById('sWhatsapp').value,
        email: document.getElementById('sEmail').value,
        welcomeEnabled: document.getElementById('sWelcomeEnabled').checked,
        welcomeDiscount: Number(document.getElementById('sWelcomeDiscount').value),
        welcomeCode: document.getElementById('sWelcomeCode').value,
        freeShipping: Number(document.getElementById('sFreeShipping').value),
        countdownEnabled: document.getElementById('sCountdownEnabled').checked,
        countdownText: document.getElementById('sCountdownText').value,
        notificationsEnabled: document.getElementById('sNotificationsEnabled').checked,
        notifInterval: Number(document.getElementById('sNotifInterval').value),
        notifications: document.getElementById('sNotifications').value,
        trustBadgesEnabled: document.getElementById('sTrustBadgesEnabled').checked,
        facebook: document.getElementById('sFacebook').value,
        instagram: document.getElementById('sInstagram').value,
        twitter: document.getElementById('sTwitter').value,
        footerDesc: document.getElementById('sFooterDesc').value,
        // الإعدادات الجديدة - شعار العملة
        currencyIcon: document.getElementById('sCurrencyIcon').value,
        currencySizeProduct: Number(document.getElementById('sCurrencySizeProduct').value),
        currencySizeCart: Number(document.getElementById('sCurrencySizeCart').value),
        currencySizeLarge: Number(document.getElementById('sCurrencySizeLarge').value),
        currencyText: document.getElementById('sCurrencyText').value
    };
    
    console.log('💾 حفظ الإعدادات:', data);
    
    try {
        for (const [key, value] of Object.entries(data)) {
            await setDoc(doc(db, "settings", key), { value: value });
        }
        alert('✅ تم حفظ جميع الإعدادات بنجاح!');
    } catch (error) {
        alert('❌ حدث خطأ: ' + error.message);
        console.error(error);
    }
});
