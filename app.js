/**
 * UMAMI Burger - Logic and Data
 */

// ── Supabase ──────────────────────────────────────────────────
const SUPABASE_URL = 'https://gvdvgjredmqojtsogrkn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2ZHZnanJlZG1xb2p0c29ncmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzA0MDYsImV4cCI6MjA4Nzk0NjQwNn0.LFBqn7gz1HWSnULa3uC9N_MHg1BiUFoUzG_MF_BtntA';
let _db = null;

function getDB() {
    if (!_db) _db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return _db;
}

// ── Product cache (loaded from Supabase) ──────────────────────
let dbProducts = [];

// Category order & display names (used for nav)
const CATEGORY_META = [
    { id: 'hamburguesas', name: 'Hamburguesas' },
    { id: 'perros',       name: 'Perros' },
    { id: 'sandwiches',   name: 'Sándwiches' },
    { id: 'salchipapas',  name: 'Salchipapas' },
    { id: 'adiciones',    name: 'Adiciones' },
    { id: 'bebidas',      name: 'Bebidas' },
];

// DOM Elements
const categoryList = document.getElementById('category-list');
const menuGrid = document.getElementById('menu-grid');
const loaderWrapper = document.getElementById('loader-wrapper');
const modal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-img');
const captionText = document.getElementById('modal-caption');
const closeModalBtn = document.getElementsByClassName('close-modal')[0];
const embersContainer = document.getElementById('embers-container');

// Cart Elements
const cartIcon = document.getElementById('cart-icon');
const cartCount = document.getElementById('cart-count');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const closeCartBtn = document.querySelector('.close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalPrice = document.getElementById('cart-total-price');
const whatsappBtn = document.getElementById('whatsapp-order-btn');

// State
let currentCategory = 'hamburguesas';
let cart = JSON.parse(localStorage.getItem('umami_cart')) || [];

// UI Interactivity - Modal
closeModalBtn.onclick = function() {
    modal.style.display = "none";
    clearEmbers();
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
        clearEmbers();
    }
    if (event.target == cartOverlay) {
        closeCart();
    }
}

// UI Interactivity - Cart
cartIcon.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);

function openCart() {
    // Calcular ancho de scrollbar para evitar salto de layout
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    
    cartSidebar.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Evitar scroll al ver el carrito
}

function closeCart() {
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
    
    // Restaurar scroll y padding después de la animación
    setTimeout(() => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }, 400);
}

// Cerrar con tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeCart();
        modal.style.display = "none";
        clearEmbers();
    }
});

// Initialize Application
async function initApp() {
    try {
        // Load products from Supabase
        const { data, error } = await getDB()
            .from('umamii_products')
            .select('*')
            .order('category')
            .order('name');

        if (error) throw error;
        dbProducts = data || [];

        // Fallback: if DB is empty use static data
        if (dbProducts.length === 0) {
            dbProducts = menuData.products;
        }

        renderCategories();
        renderProducts(currentCategory);
        updateCartUI();
    } catch (error) {
        console.warn('Supabase error, using static data:', error);
        dbProducts = menuData.products;
        renderCategories();
        renderProducts(currentCategory);
        updateCartUI();
    } finally {
        setTimeout(() => {
            if (loaderWrapper) {
                loaderWrapper.style.opacity = '0';
                setTimeout(() => {
                    loaderWrapper.style.visibility = 'hidden';
                    loaderWrapper.style.display = 'none';
                }, 500);
            }
        }, 1000);
    }
}

// Safety fallback: force-hide loader after 8s (slow network / mobile)
setTimeout(() => {
    if (typeof loaderWrapper !== 'undefined' && loaderWrapper) {
        loaderWrapper.style.opacity = '0';
        loaderWrapper.style.visibility = 'hidden';
        loaderWrapper.style.display = 'none';
    }
}, 8000);

// Render Categories
function renderCategories() {
    categoryList.innerHTML = '';

    // Build list of categories that have at least one product in DB
    const activeCatIds = new Set(dbProducts.map(p => p.category));
    const categories = CATEGORY_META.filter(c => activeCatIds.has(c.id));

    // If currentCategory has no products, reset to first available
    if (!activeCatIds.has(currentCategory) && categories.length > 0) {
        currentCategory = categories[0].id;
    }

    categories.forEach(category => {
        const li = document.createElement('li');
        li.textContent = category.name;
        li.dataset.category = category.id;
        
        if (category.id === currentCategory) {
            li.classList.add('active');
        }
        
        li.addEventListener('click', () => {
            // Update active state
            document.querySelectorAll('#category-list li').forEach(el => el.classList.remove('active'));
            li.classList.add('active');
            
            // Render new category
            currentCategory = category.id;
            renderProducts(currentCategory);
        });
        
        categoryList.appendChild(li);
    });
}

// Formatter for currency (COP)
const formatColPesos = (price) => {
    if (typeof price === 'string') return price;
    return `$${new Intl.NumberFormat('es-CO').format(price)}`;
}

// Render Products
function renderProducts(categoryId) {
    menuGrid.innerHTML = '';

    const filteredProducts = dbProducts.filter(p => p.category === categoryId);

    if (filteredProducts.length === 0) {
        menuGrid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: var(--text-secondary);">Aún no hay productos en esta categoría.</p>';
        return;
    }
    
    filteredProducts.forEach((product, index) => {
        const card = document.createElement('article');
        const isSoldOut = !!product.sold_out;
        card.className = `product-card animate-fade-in${isSoldOut ? ' sold-out' : ''}`;
        card.style.animationDelay = `${index * 0.1}s`;
        
        const imgSrc = product.image ? `assets/img/${product.image}` : `assets/img/Logo (2).webp`;
        const imgClass = product.image ? 'product-image' : 'product-image placeholder-img';
        
        const safeName = product.name.replace(/'/g, "\\'");
        const safeDesc = product.description ? product.description.replace(/'/g, "\\'") : '';
        const safePrice = formatColPesos(product.price);

        const soldOutOverlay = isSoldOut
            ? `<div class="sold-out-overlay"><span class="sold-out-label">AGOTADO</span></div>`
            : '';

        const cartBtn = isSoldOut
            ? `<button class="add-to-cart-btn sold-out-btn" disabled>
                    <i class="fas fa-ban"></i> AGOTADO
               </button>`
            : `<button class="add-to-cart-btn" onclick="addToCart('${safeName}', '${product.category}')">
                    <i class="fas fa-plus"></i> AGREGAR AL CARRITO
               </button>`;

        card.innerHTML = `
            <div class="product-image-container" onclick="${isSoldOut ? '' : `openModal('${imgSrc}', '${safeName}', '${safeDesc}', '${safePrice}', ${product.spicy || false})`}">
                <img src="${imgSrc}" alt="${product.name}" class="${imgClass}" loading="lazy">
                ${soldOutOverlay}
            </div>
            <div class="product-info">
                <div class="product-header">
                    <h3 class="product-title">${product.name}${product.spicy ? ' 🌶️' : ''}</h3>
                    <span class="product-price">${safePrice}</span>
                </div>
                ${product.description ? `<p class="product-desc">${product.description}</p>` : ''}
                ${cartBtn}
            </div>
        `;
        
        menuGrid.appendChild(card);
    });
}

// Shopping Cart Functions
function addToCart(productName, categoryId) {
    const product = dbProducts.find(p => p.name === productName && p.category === categoryId);
    if (!product) return;

    const existingItem = cart.find(item => item.name === productName && item.category === categoryId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: product.name,
            category: product.category,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    saveCart();
    updateCartUI();
    
    // Visual feedback (shaking the cart icon)
    cartIcon.style.animation = 'none';
    setTimeout(() => {
        cartIcon.style.animation = 'bounce 0.5s ease';
    }, 10);
}

function removeFromCart(productName, categoryId) {
    const itemIndex = cart.findIndex(item => item.name === productName && item.category === categoryId);
    if (itemIndex > -1) {
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity -= 1;
        } else {
            cart.splice(itemIndex, 1);
        }
    }
    saveCart();
    updateCartUI();
}

function deleteFromCart(productName, categoryId) {
    cart = cart.filter(item => !(item.name === productName && item.category === categoryId));
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('umami_cart', JSON.stringify(cart));
}

function updateCartUI() {
    // Total items count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Clear display
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío</p>';
        cartTotalPrice.textContent = '$0';
        return;
    }
    
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const imgSrc = item.image ? `assets/img/${item.image}` : `assets/img/Logo (2).webp`;
        
        const itemCategory = item.category ? item.category.toUpperCase() : 'VARIOS';
        
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <img src="${imgSrc}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-details">
                <h4 class="cart-item-name">${item.name} <small style="display:block; font-size: 0.7rem; color: var(--primary-color); opacity: 0.8;">${itemCategory}</small></h4>
                <div class="cart-item-price">${formatColPesos(item.price)}</div>
                <div class="cart-item-controls">
                    <button onclick="removeFromCart('${item.name.replace(/'/g, "\\'")}', '${item.category || ''}')"><i class="fas fa-minus"></i></button>
                    <span>${item.quantity}</span>
                    <button onclick="addToCart('${item.name.replace(/'/g, "\\'")}', '${item.category || ''}')"><i class="fas fa-plus"></i></button>
                    <button style="margin-left: auto; color: #ff0000; border-color: rgba(255,0,0,0.3);" onclick="deleteFromCart('${item.name.replace(/'/g, "\\'")}', '${item.category || ''}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(itemEl);
    });
    
    cartTotalPrice.textContent = formatColPesos(total);
}

// WhatsApp Integration
whatsappBtn.addEventListener('click', async () => {
    if (cart.length === 0) {
        alert("¡Tu carrito está vacío! Agrega algo delicioso antes de pedir.");
        return;
    }

    let message = "¡Hola UMAMI! 🍔 Venía del menú virtual y quiero hacer este pedido:\n\n";
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const categoryName = item.category ? item.category.toUpperCase() : '';
        message += `• *${item.quantity}x* ${categoryName} ${item.name} - ${formatColPesos(itemTotal)}\n`;
    });

    message += `\n*TOTAL: ${formatColPesos(total)}*`;

    const customerName = document.getElementById('customer-name')?.value.trim() || '';
    const customerNote = document.getElementById('customer-note')?.value.trim() || '';
    if (customerNote) message += `\n\n📍 ${customerNote}`;
    message += "\n\n¿Me confirman para pasarles mis datos de entrega? ¡Gracias! ✨";

    // Save order to Supabase (fire-and-forget — don't block WhatsApp)
    try {
        await getDB().from('umamii_orders').insert([{
            items: cart.map(i => ({
                name: i.name,
                quantity: i.quantity,
                price: i.price,
                category: i.category,
                image: i.image || null
            })),
            total,
            customer_name: customerName || null,
            customer_note: customerNote || null,
            status: 'pending'
        }]);
    } catch (e) {
        console.warn('No se pudo guardar el pedido en la BD:', e);
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/573233519428?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    // Clear customer fields after sending
    if (document.getElementById('customer-name')) document.getElementById('customer-name').value = '';
    if (document.getElementById('customer-note')) document.getElementById('customer-note').value = '';
});

function openModal(imgSrc, name, desc, price, isSpicy) {
    modal.style.display = "block";
    modalImg.src = imgSrc;
    captionText.innerHTML = isSpicy ? `${name} 🌶️` : name;
    
    if (isSpicy) {
        modal.classList.add('spicy-fire');
        generateEmbers();
    } else {
        modal.classList.remove('spicy-fire');
        clearEmbers();
    }
    
    const priceElement = document.getElementById('modal-price');
    if (priceElement) {
        priceElement.innerHTML = price || "";
        priceElement.style.display = price ? "block" : "none";
    }
    
    const descElement = document.getElementById('modal-desc');
    descElement.innerHTML = "";
    
    if(desc) {
        const ingredients = desc.split(/,\s*|\s+y\s+/i)
                                .map(i => i.trim().replace(/\.$/, ''))
                                .filter(i => i.length > 0);
        
        ingredients.forEach((ing, index) => {
            const li = document.createElement('li');
            li.textContent = ing.charAt(0).toUpperCase() + ing.slice(1);
            li.style.animationDelay = `${index * 0.15}s`;
            descElement.appendChild(li);
        });
        descElement.style.display = "flex";
    } else {
        descElement.style.display = "none";
    }
}

function generateEmbers() {
    clearEmbers(); // Asegurar que esté limpio
    const count = 20;
    
    for (let i = 0; i < count; i++) {
        const ember = document.createElement('div');
        ember.className = 'ember';
        
        // Propiedades aleatorias para naturalidad
        const size = Math.random() * 8 + 4; // Entre 4px y 12px
        const left = Math.random() * 100; // Posición horizontal
        const duration = Math.random() * 2 + 1.5; // Entre 1.5s y 3.5s
        const delay = Math.random() * 3; // Hasta 3s de retraso inicial
        const drift = (Math.random() - 0.5) * 200; // Desviación lateral
        
        ember.style.width = `${size}px`;
        ember.style.height = `${size}px`;
        ember.style.left = `${left}%`;
        ember.style.setProperty('--lateral-drift', `${drift}px`);
        ember.style.animation = `ember-rise ${duration}s ${delay}s infinite ease-out`;
        
        embersContainer.appendChild(ember);
    }
}

function clearEmbers() {
    if (embersContainer) {
        embersContainer.innerHTML = '';
    }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', initApp);
