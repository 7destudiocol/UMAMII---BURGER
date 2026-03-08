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
        { category: "hamburguesas", name: "CHEESE BLEND", price: 20000, description: "Pan brioche, Salsa de la casa, vegetales frescos, Carne de res, cebolla caramelizada, doble queso tipo cheddar, queso blanco y Tocineta.", image: "HAMBURGUESA CHESSE BLEND.webp" },
        { category: "hamburguesas", name: "GAUCHA", price: 21000, description: "Pan brioche, Salsa de la casa, Vegetales frescos, Carne de res, doble queso, chimichurri, chorizo y pimientos asados.", image: "HAMBURGUESA GAUCHA.webp" },
        { category: "hamburguesas", name: "PULLED KING", price: 26000, description: "Pan brioche, salsa BBQ de la casa, Vegetales frescos, Carne de res, pulled pork, aros de cebolla. (Basado en la imagen suelta).", image: "HAMBURGUESA PULLED KING.webp" }, // Asumiendo este nombre basado en la foto y estructura
        { category: "hamburguesas", name: "TRIFASICA", price: 28000, description: "Pan brioche, Salsa de la casa, Carne de res, pechuga de pollo, lomo de cerdo, vegetales frescos, queso, tocineta. (Basado en la imagen suelta).", image: "HAMBURGUESA TRIFASICA.webp" }, // Asumiendo este nombre basado en la foto y estructura
        
        // PERROS
        { category: "perros", name: "TRADII", price: 14000, description: "Pan brioche, salsa de la casa, salchicha, ripio, doble queso y tocineta." },
        { category: "perros", name: "CHIKEN", price: 20000, description: "Pan brioche, salsa de la casa, salchicha, ripio, doble queso, tocineta, pollo desmechado en salsa.", image: "PERRO CHIKEN.webp" },
        { category: "perros", name: "CRIOLLO", price: 21000, description: "Pan brioche, salsa de la casa, salchicha, ripio, doble queso, tocineta, maicitos, chorizo, ahogado y carne mechada en salsa." },
        { category: "perros", name: "CHIKEN (ALOHA O CHAMPI)", price: 21000, description: "Pan brioche, salsa de la casa, salchicha, ripio, doble queso, tocineta, pollo desmechado en salsa, mermelada de piña o champiñones." },
        { category: "perros", name: "ORALE", price: 21000, description: "Pan brioche, salsa de la casa, salchicha, ripio, doble queso tipo chédar, tocineta, carne de res con jalapeños y maicitos.", image: "PERRO ORALE.webp" },

        // SANDWICHES
        { category: "sandwiches", name: "PULLED PORK", price: 20000, description: "Pan brioche, doble jamón, coleslaw, pulled pork en salsa de la casa, doble queso y cebollitas encurtidas.", image: "SANDWISH - PULLED PORK.webp" },
        { category: "sandwiches", name: "CHIKEN", price: 20000, description: "Pan brioche, doble jamón, doble queso, pollo desmechado en salsa, vegetales frescos y chimichurri." },
        { category: "sandwiches", name: "CRIOLLO", price: 22000, description: "Pan brioche, doble jamón, doble queso, vegetales frescos, carne mechada, chorizo, maicitos y ahogado." },
        { category: "sandwiches", name: "CHAMPI ( ALOHA O CHIKEN )", price: 21000, description: "Pan brioche, pollo en salsa bechamel con champiñones o mermelada de piña, doble jamón, doble queso y vegetales frescos." },

        // SALCHIPAPAS
        { category: "salchipapas", name: "TRADII CON POLLO", price: 20000, description: "Papas, salchicha, salsa BBQ, Salsa de queso chédar, Queso blanco, Queso chédar y Tocineta, Pollo en salsa." },
        { category: "salchipapas", name: "LA MONTAÑERA", price: 25000, description: "Papas, salchicha, salsa BBQ, Salsa de queso chédar, Queso blanco, Tocineta, Res en salsas, Maicitos, Chorizo y huevo frito." },
        { category: "salchipapas", name: "PORKY", price: 24000, description: "Papas, salchicha, salsa BBQ, Salsa de queso chédar, Queso chédar y Tocineta, Cerdo en salsas, cebollitas encurtidas." },
        { category: "salchipapas", name: "MIXTA", price: 26000, description: "Papas, salchicha, salsa BBQ, Salsa de queso chédar, Queso blanco, Queso chédar, Tocineta, maicitos con pollo y carne con choriz en salsas." },
        { category: "salchipapas", name: "TEX-MEX", price: 25000, description: "Papas, salchicha, salsa BBQ, Salsa de queso chédar, Queso blanco, Queso chédar, Tocineta, Carne de burger con jalapeños maicitos y salsas." },

        // ADICIONES
        { category: "adiciones", name: "QUESO BLANCO", price: 2000 },
        { category: "adiciones", name: "QUES TIPO CHEDDAR", price: 3000 },
        { category: "adiciones", name: "PORCION DE PAPAS", price: 5000 },
        { category: "adiciones", name: "TOCINETA", price: 3000 },
        { category: "adiciones", name: "CEBOLLA CARAMELIZADA", price: 1000 },
        { category: "adiciones", name: "MERMELADA DE PIÑA", price: 3000 },
        { category: "adiciones", name: "HUEVO FRITO", price: 2000 },
        { category: "adiciones", name: "CHORIZO", price: 3000 },
        { category: "adiciones", name: "ADICION DE PROTEINA (RES, POLLO O CERDO)", price: 6000 },
        { category: "adiciones", name: "CHAMPIÑONES", price: 3000 },
        { category: "adiciones", name: "AROS DE CEBOLLA", price: 4000 },

        // BEBIDAS
        { category: "bebidas", name: "COCA-COLA", price: 4000 },
        { category: "bebidas", name: "CUATRO", price: 4000 },
        { category: "bebidas", name: "HIT LITRO", price: 8000 },
        { category: "bebidas", name: "CERVEZA POKER", price: 4000 },
        { category: "bebidas", name: "CERVEZA CLUB DORADA", price: 5000 },
        { category: "bebidas", name: "AGUA", price: 3000 }
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

// State
let currentCategory = 'hamburguesas';

// UI Interactivity - Modal
closeModalBtn.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Initialize Application
function initApp() {
    renderCategories();
    renderProducts(currentCategory);
    
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
    // Si ya viene formateado en el JSON (ej. "$18.000") lo devolvemos,
    // si es un número, lo formateamos.
    if (typeof price === 'string') return price;
    return `$${new Intl.NumberFormat('es-CO').format(price)}`;
}

// Render Products
function renderProducts(categoryId) {
    menuGrid.innerHTML = '';
    
    // Filter products
    const filteredProducts = menuData.products.filter(p => p.category === categoryId);
    
    if (filteredProducts.length === 0) {
        menuGrid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: var(--text-secondary);">Aún no hay productos en esta categoría.</p>';
        return;
    }
    
    // Render
    filteredProducts.forEach((product, index) => {
        const card = document.createElement('article');
        card.className = 'product-card animate-fade-in';
        card.style.animationDelay = `${index * 0.1}s`;
        
        // Manejar imágenes si no existen
        const imgSrc = product.image ? `assets/img/${product.image}` : `assets/img/Logo (2).webp`;
        // Clases utilitarias dependiendo de si es logo o foto de producto real para ajustar el padding
        const imgClass = product.image ? 'product-image' : 'product-image placeholder-img';
        
        // Escapar comillas dobles o comillas simples si las hubiera en el texto para el onclick
        const safeName = product.name.replace(/'/g, "\\'");
        const safeDesc = product.description ? product.description.replace(/'/g, "\\'") : '';

        const safePrice = formatColPesos(product.price);
        card.innerHTML = `
            <div class="product-image-container" onclick="openModal('${imgSrc}', '${safeName}', '${safeDesc}', '${safePrice}')">
                <img src="${imgSrc}" alt="${product.name}" class="${imgClass}" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-header">
                    <h3 class="product-title">${product.name}</h3>
                    <span class="product-price">${safePrice}</span>
                </div>
                ${product.description ? `<p class="product-desc">${product.description}</p>` : ''}
            </div>
        `;
        
        menuGrid.appendChild(card);
    });
}

function openModal(imgSrc, name, desc, price) {
    modal.style.display = "block";
    modalImg.src = imgSrc;
    captionText.innerHTML = name;
    
    // Asignar precio
    const priceElement = document.getElementById('modal-price');
    if (priceElement) {
        if (price) {
            priceElement.innerHTML = price;
            priceElement.style.display = "block";
        } else {
            priceElement.style.display = "none";
        }
    }
    
    // Asignar descripción dividida en viñetas
    const descElement = document.getElementById('modal-desc');
    descElement.innerHTML = ""; // Limpiar viñetas anteriores
    
    if(desc) {
        // Separamos por coma y también por " y " para obtener los ingredientes
        const ingredients = desc.split(/,\s*|\s+y\s+/i)
                                .map(i => i.trim().replace(/\.$/, ''))
                                .filter(i => i.length > 0);
        
        ingredients.forEach((ing, index) => {
            const li = document.createElement('li');
            li.textContent = ing.charAt(0).toUpperCase() + ing.slice(1); // Capitalizar la primera letra
            li.style.animationDelay = `${index * 0.15}s`; // Retardo escalonado para mostrarlos uno a uno
            descElement.appendChild(li);
        });
        
        descElement.style.display = "flex";
    } else {
        descElement.style.display = "none";
    }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', initApp);
