/**
 * UMAMI Burger - Logic and Data
 */

// Data base simulada con la información extraída del menú y las imágenes
const menuData = {
    categories: [
        { id: "hamburguesas", name: "Hamburguesas" },
        { id: "perros", name: "Perros" },
        { id: "sandwiches", name: "Sándwiches" },
        { id: "salchipapas", name: "Salchipapas" },
        { id: "adiciones", name: "Adiciones" },
        { id: "bebidas", name: "Bebidas" }
    ],
    products: [
        // HAMBURGUESAS
        { category: "hamburguesas", name: "TRADII", price: 18000, description: "Pan brioche, salsa de la casa, BBQ, Vegetales frescos, Carne de res, Cebolla caramelizada, Doble queso y Tocineta.", image: "HAMBURGUESA TRADI.webp" },
        { category: "hamburguesas", name: "ALOHA", price: 20000, description: "Pan brioche, Salsa de la casa, BBQ, Vegetales frescos, Carne de res, Mermelada de Piña-Tocineta, Doble queso.", image: "HAMBURGUESA ALOHA.webp" },
        { category: "hamburguesas", name: "DOBLE", price: 22000, description: "Pan brioche, salsa de la casa, BBQ, vegetales frescos, doble carne, cebolla caramelizada, Doble queso y Tocineta." },
        { category: "hamburguesas", name: "CHEESE BLEND", price: 20000, description: "Pan brioche, Salsa de la casa, vegetales frescos, Carne de res, cebolla caramelizada, doble queso tipo cheddar, queso blanco y Tocineta.", image: "HAMBURGUESA CHEESE BLEND.webp" },
        { category: "hamburguesas", name: "GAUCHA", price: 21000, description: "Pan brioche, Salsa de la casa, Vegetales frescos, Carne de res, doble queso, chimichurri, chorizo y pimientos asados.", image: "HAMBURGUESA GAUCHA.webp" },
        { category: "hamburguesas", name: "PULLED KING", price: 26000, description: "Pan brioche, salsa BBQ de la casa, Vegetales frescos, Carne de res, pulled pork, aros de cebolla. (Basado en la imagen suelta).", image: "HAMBURGUESA PULLED KING.webp" }, // Asumiendo este nombre basado en la foto y estructura
        { category: "hamburguesas", name: "TRIFASICA", price: 28000, description: "Pan brioche, Salsa de la casa, Carne de res, pechuga de pollo, lomo de cerdo, vegetales frescos, queso, tocineta. (Basado en la imagen suelta).", image: "HAMBURGUESA TRIFASICA.webp" }, // Asumiendo este nombre basado en la foto y estructura
        
        // PERROS
        { category: "perros", name: "TRADII", price: 14000, description: "Pan brioche, salsa de la casa, salchicha, ripio, doble queso y tocineta." },
        { category: "perros", name: "CHICKEN", price: 20000, description: "Pan brioche, salsa de la casa, salchicha, ripio, doble queso, tocineta, pollo desmechado en salsa.", image: "PERRO CHICKEN.webp" },
        { category: "perros", name: "CRIOLLO", price: 21000, description: "Pan brioche, salsa de la casa, salchicha, ripio, doble queso, tocineta, maicitos, chorizo, ahogado y carne mechada en salsa." },
        { category: "perros", name: "CHICKEN (ALOHA O CHAMPI)", price: 21000, description: "Pan brioche, salsa de la casa, salchicha, ripio, doble queso, tocineta, pollo desmechado en salsa, mermelada de piña o champiñones." },
        { category: "perros", name: "ORALE", price: 21000, description: "Pan brioche, salsa de la casa, salchicha, ripio, doble queso tipo cheddar, tocineta, carne de res con jalapeños y maicitos.", image: "PERRO ORALE.webp", spicy: true },

        // SANDWICHES
        { category: "sandwiches", name: "PULLED PORK", price: 20000, description: "Pan brioche, doble jamón, coleslaw, pulled pork en salsa de la casa, doble queso y cebollitas encurtidas.", image: "SANDWICH - PULLED PORK.webp" },
        { category: "sandwiches", name: "CHICKEN", price: 20000, description: "Pan brioche, doble jamón, doble queso, pollo desmechado en salsa, vegetales frescos y chimichurri." },
        { category: "sandwiches", name: "CRIOLLO", price: 22000, description: "Pan brioche, doble jamón, doble queso, vegetales frescos, carne mechada, chorizo, maicitos y ahogado." },
        { category: "sandwiches", name: "CHAMPI ( ALOHA O CHICKEN )", price: 21000, description: "Pan brioche, pollo en salsa bechamel con champiñones o mermelada de piña, doble jamón, doble queso y vegetales frescos." },

        // SALCHIPAPAS
        { category: "salchipapas", name: "TRADII CON POLLO", price: 20000, description: "Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso blanco, Queso cheddar y Tocineta, Pollo en salsa." },
        { category: "salchipapas", name: "LA MONTAÑERA", price: 25000, description: "Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso blanco, Tocineta, Res en salsas, Maicitos, Chorizo y huevo frito." },
        { category: "salchipapas", name: "PORKY", price: 24000, description: "Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso cheddar y Tocineta, Cerdo en salsas, cebollitas encurtidas." },
        { category: "salchipapas", name: "MIXTA", price: 26000, description: "Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso blanco, Queso cheddar, Tocineta, maicitos con pollo y carne con chorizo en salsas." },
        { category: "salchipapas", name: "TEX-MEX", price: 25000, description: "Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso blanco, Queso cheddar, Tocineta, Carne de burger con jalapeños maicitos y salsas.", spicy: true },

        // ADICIONES
        { category: "adiciones", name: "QUESO BLANCO", price: 2000, image: "QUESO_BLANCO_USER.webp" },
        { category: "adiciones", name: "QUESO TIPO CHEDDAR", price: 3000, image: "QUESO_CHEDDAR_USER.webp" },
        { category: "adiciones", name: "PORCIÓN DE PAPAS", price: 5000, image: "ADICION_PORCION_PAPAS.webp" },
        { category: "adiciones", name: "TOCINETA", price: 3000, image: "TOCINETA.webp" },
        { category: "adiciones", name: "CEBOLLA CARAMELIZADA", price: 1000, image: "CEBOLLA_CARAMELIZADA.webp" },
        { category: "adiciones", name: "MERMELADA DE PIÑA", price: 3000, image: "MERMELADA_PIÑA.webp" },
        { category: "adiciones", name: "HUEVO FRITO", price: 2000, image: "HUEVO_FRITO.webp" },
        { category: "adiciones", name: "CHORIZO", price: 3000, image: "CHORIZO.webp" },
        { category: "adiciones", name: "ADICIÓN DE PROTEÍNA (RES, POLLO O CERDO)", price: 6000 },
        { category: "adiciones", name: "CHAMPIÑONES", price: 3000, image: "CHAMPIÑONES.webp" },
        { category: "adiciones", name: "AROS DE CEBOLLA", price: 4000, image: "AROS_DE_CEBOLLA.webp" },

        // BEBIDAS
        { category: "bebidas", name: "COCA-COLA", price: 4000, image: "COCA_COLA.webp" },
        { category: "bebidas", name: "CUATRO", price: 4000, image: "QUATRO.webp" },
        { category: "bebidas", name: "HIT LITRO", price: 8000, image: "HIT.webp" },
        { category: "bebidas", name: "CERVEZA POKER", price: 4000, image: "POKER.webp" },
        { category: "bebidas", name: "CERVEZA CLUB DORADA", price: 5000, image: "CLUB_COLOMBIA.webp" },
        { category: "bebidas", name: "AGUA", price: 3000, image: "AGUA.webp" }
    ]
};

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
}

// UI Interactivity - Cart
cartIcon.addEventListener('click', () => {
    cartSidebar.classList.add('active');
});

closeCartBtn.addEventListener('click', () => {
    cartSidebar.classList.remove('active');
});

// Initialize Application
function initApp() {
    renderCategories();
    renderProducts(currentCategory);
    updateCartUI();
    
    // Simular un tiempo de carga para mostrar el loader de hamburguesa
    setTimeout(() => {
        loaderWrapper.style.opacity = '0';
        setTimeout(() => {
            loaderWrapper.style.visibility = 'hidden';
        }, 500);
    }, 1500); // 1.5s de carga ficticia
}

// Render Categories
function renderCategories() {
    categoryList.innerHTML = '';
    
    menuData.categories.forEach(category => {
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
    
    const filteredProducts = menuData.products.filter(p => p.category === categoryId);
    
    if (filteredProducts.length === 0) {
        menuGrid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: var(--text-secondary);">Aún no hay productos en esta categoría.</p>';
        return;
    }
    
    filteredProducts.forEach((product, index) => {
        const card = document.createElement('article');
        card.className = 'product-card animate-fade-in';
        card.style.animationDelay = `${index * 0.1}s`;
        
        const imgSrc = product.image ? `assets/img/${product.image}` : `assets/img/Logo (2).webp`;
        const imgClass = product.image ? 'product-image' : 'product-image placeholder-img';
        
        const safeName = product.name.replace(/'/g, "\\'");
        const safeDesc = product.description ? product.description.replace(/'/g, "\\'") : '';
        const safePrice = formatColPesos(product.price);

        card.innerHTML = `
            <div class="product-image-container" onclick="openModal('${imgSrc}', '${safeName}', '${safeDesc}', '${safePrice}', ${product.spicy || false})">
                <img src="${imgSrc}" alt="${product.name}" class="${imgClass}" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-header">
                    <h3 class="product-title">${product.name}${product.spicy ? ' 🌶️' : ''}</h3>
                    <span class="product-price">${safePrice}</span>
                </div>
                ${product.description ? `<p class="product-desc">${product.description}</p>` : ''}
                <button class="add-to-cart-btn" onclick="addToCart('${safeName}')">
                    <i class="fas fa-plus"></i> AGREGAR AL CARRITO
                </button>
            </div>
        `;
        
        menuGrid.appendChild(card);
    });
}

// Shopping Cart Functions
function addToCart(productName) {
    const product = menuData.products.find(p => p.name === productName);
    if (!product) return;

    const existingItem = cart.find(item => item.name === productName);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: product.name,
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

function removeFromCart(productName) {
    const itemIndex = cart.findIndex(item => item.name === productName);
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

function deleteFromCart(productName) {
    cart = cart.filter(item => item.name !== productName);
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
        
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <img src="${imgSrc}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-details">
                <h4 class="cart-item-name">${item.name}</h4>
                <div class="cart-item-price">${formatColPesos(item.price)}</div>
                <div class="cart-item-controls">
                    <button onclick="removeFromCart('${item.name.replace(/'/g, "\\'")}')"><i class="fas fa-minus"></i></button>
                    <span>${item.quantity}</span>
                    <button onclick="addToCart('${item.name.replace(/'/g, "\\'")}')"><i class="fas fa-plus"></i></button>
                    <button style="margin-left: auto; color: #ff0000; border-color: rgba(255,0,0,0.3);" onclick="deleteFromCart('${item.name.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(itemEl);
    });
    
    cartTotalPrice.textContent = formatColPesos(total);
}

// WhatsApp Integration
whatsappBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        alert("¡Tu carrito está vacío! Agrega algo delicioso antes de pedir.");
        return;
    }
    
    let message = "¡Hola UMAMI! 🍔 Venía del menú virtual y quiero hacer este pedido:\n\n";
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        message += `• *${item.quantity}x* ${item.name} - ${formatColPesos(itemTotal)}\n`;
    });
    
    message += `\n*TOTAL: ${formatColPesos(total)}*`;
    message += "\n\n¿Me confirman para pasarles mis datos de entrega? ¡Gracias! ✨";
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/573233519428?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
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
