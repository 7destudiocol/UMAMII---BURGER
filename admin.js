// ============================================================
// UMAMI BURGER — ADMIN DASHBOARD JS
// ============================================================
const SUPABASE_URL = 'https://gvdvgjredmqojtsogrkn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2ZHZnanJlZG1xb2p0c29ncmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzA0MDYsImV4cCI6MjA4Nzk0NjQwNn0.LFBqn7gz1HWSnULa3uC9N_MHg1BiUFoUzG_MF_BtntA';

// ---- Global State ----
let _supabase = null;
let currentFilter = 'day';
let cart = {};           // { productName: { qty, price } }
let currentSalesCat = 'all';
let currentDashCat  = 'all';
let currentProdCat  = 'all';
let salesSearchQuery = '';
let _productsCache  = [];

// ============================================================
// INIT
// ============================================================
function initSupabase() {
    _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

function checkAdminPassword() {
    const pass = document.getElementById('admin-pass').value;
    const err  = document.getElementById('login-error');
    if (pass === 'GORDO123') {
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.remove('hidden');
        initDashboard();
    } else {
        err.innerText = 'Contraseña incorrecta.';
        err.style.color = 'var(--error)';
    }
}

async function initDashboard() {
    initSupabase();
    await syncMenuWithDB();
    loadStats();
    initSalesCart();
}

// ============================================================
// NAVIGATION
// ============================================================
function showTab(tabId, el) {
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    if (el) el.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    loadTabData(tabId);
}

async function loadTabData(tabId) {
    if (!_supabase) return;
    switch (tabId) {
        case 'sales':    await loadSales();    break;
        case 'expenses': await loadExpenses(); break;
        case 'products': await loadProducts(); break;
        case 'stats':    await loadStats();    break;
    }
}

// ============================================================
// DASHBOARD — STATS
// ============================================================
async function loadStats() {
    if (!_supabase) return;
    const startDate = getDateRange();

    const [{ data: sales }, { data: others }, { data: expenses }] = await Promise.all([
        _supabase.from('umamii_sales').select('*, products:umamii_products(name)').gte('sale_date', startDate),
        _supabase.from('umamii_other_income').select('*').gte('income_date', startDate),
        _supabase.from('umamii_expenses').select('*').gte('expense_date', startDate)
    ]);

    const totalSales    = sales   ? sales.reduce((a, s) => a + parseFloat(s.total_price), 0) : 0;
    const totalOthers   = others  ? others.reduce((a, o) => a + parseFloat(o.amount), 0) : 0;
    const totalExpenses = expenses? expenses.reduce((a, e) => a + parseFloat(e.amount), 0) : 0;
    const totalIncome   = totalSales + totalOthers;
    const totalOrders   = sales ? sales.length : 0;

    document.getElementById('total-income-val').innerText  = `$${totalIncome.toLocaleString()}`;
    document.getElementById('total-expenses-val').innerText = `$${totalExpenses.toLocaleString()}`;
    document.getElementById('cash-flow-val').innerText     = `$${(totalIncome - totalExpenses).toLocaleString()}`;
    document.getElementById('total-orders-val').innerText  = totalOrders;

    loadMonthlyFlow();
    loadTopProducts();
}

// ============================================================
// DASHBOARD — MONTHLY FLOW
// ============================================================
async function loadMonthlyFlow() {
    const { data: monthlyData } = await _supabase.from('umamii_monthly_cash_flow').select('*');
    if (!monthlyData) return;
    renderMainChart(monthlyData);
    renderMonthlyTable(monthlyData);
}

function renderMainChart(data) {
    const ctx = document.getElementById('mainFlowChart').getContext('2d');
    if (window.mainChart) window.mainChart.destroy();

    const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const labels = data.map(d => months[new Date(d.month).getUTCMonth()]);
    let cumulative = 0;
    const netAccumulated = data.map(d => { cumulative += parseFloat(d.cash_flow); return cumulative; });

    window.mainChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Ingresos',   data: data.map(d => d.income),   backgroundColor: 'rgba(46,213,115,0.6)', borderRadius: 8 },
                { label: 'Gastos',     data: data.map(d => d.expenses), backgroundColor: 'rgba(255,71,87,0.5)',  borderRadius: 8 },
                { label: 'Acumulado',  data: netAccumulated, type: 'line', borderColor: '#ffcc00', borderWidth: 3, fill: false, tension: 0.4, pointRadius: 5, pointBackgroundColor: '#ffcc00' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } },
                x: { grid: { display: false }, ticks: { color: '#888' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderMonthlyTable(data) {
    const tbody = document.querySelector('#monthly-summary-table tbody');
    const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    let cumulative = 0;
    tbody.innerHTML = data.map(d => {
        cumulative += parseFloat(d.cash_flow);
        const net = parseFloat(d.cash_flow);
        return `<tr>
            <td><b>${months[new Date(d.month).getUTCMonth()]}</b></td>
            <td class="success">$${parseFloat(d.income).toLocaleString()}</td>
            <td class="error">$${parseFloat(d.expenses).toLocaleString()}</td>
            <td class="${net >= 0 ? 'success' : 'error'}">$${net.toLocaleString()}</td>
            <td class="primary"><b>$${cumulative.toLocaleString()}</b></td>
            <td>
                <button class="action-btn detail-btn" onclick="openMonthDetail('${d.month}', '${months[new Date(d.month).getUTCMonth()]}')">
                    <i class="fas fa-eye"></i> Ver / Eliminar
                </button>
            </td>
        </tr>`;
    }).join('');
}

// ============================================================
// DASHBOARD — MONTH DETAIL MODAL (delete sales/expenses)
// ============================================================
async function openMonthDetail(monthStr, monthName) {
    const modal   = document.getElementById('month-detail-modal');
    const content = document.getElementById('month-detail-content');
    document.getElementById('month-detail-title').innerText = `${monthName} — Ventas y Gastos`;
    content.innerHTML = '<p style="color:#888;padding:1rem"><i class="fas fa-spinner fa-spin"></i> Cargando...</p>';
    modal.classList.remove('hidden');

    const monthStart = new Date(monthStr); monthStart.setUTCDate(1);
    const monthEnd = new Date(monthStr);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1); monthEnd.setUTCDate(1);

    const [{ data: sales }, { data: expenses }] = await Promise.all([
        _supabase.from('umamii_sales').select('*, products:umamii_products(name)')
            .gte('sale_date', monthStart.toISOString()).lt('sale_date', monthEnd.toISOString())
            .order('sale_date', { ascending: false }),
        _supabase.from('umamii_expenses').select('*')
            .gte('expense_date', monthStart.toISOString()).lt('expense_date', monthEnd.toISOString())
            .order('expense_date', { ascending: false })
    ]);

    const salesRows = (sales || []).map(s => `
        <tr>
            <td>${new Date(s.sale_date).toLocaleDateString()}</td>
            <td>${s.products?.name || 'Varios'}</td>
            <td>${s.quantity}</td>
            <td class="success">$${parseFloat(s.total_price).toLocaleString()}</td>
            <td><button class="delete-btn" onclick="deleteSale('${s.id}', '${monthStr}', '${monthName}')"><i class="fas fa-trash"></i></button></td>
        </tr>`).join('') || '<tr><td colspan="5" style="color:#888;text-align:center">Sin ventas</td></tr>';

    const expenseRows = (expenses || []).map(e => `
        <tr>
            <td>${new Date(e.expense_date).toLocaleDateString()}</td>
            <td>${e.description}</td>
            <td>${e.category}</td>
            <td class="error">$${parseFloat(e.amount).toLocaleString()}</td>
            <td><button class="delete-btn" onclick="deleteExpenseFromModal('${e.id}', '${monthStr}', '${monthName}')"><i class="fas fa-trash"></i></button></td>
        </tr>`).join('') || '<tr><td colspan="5" style="color:#888;text-align:center">Sin gastos</td></tr>';

    content.innerHTML = `
        <div class="detail-section">
            <h4 class="detail-label success-label"><i class="fas fa-arrow-up"></i> Ventas del mes</h4>
            <div class="scroll-table">
                <table>
                    <thead><tr><th>Fecha</th><th>Producto</th><th>Cant.</th><th>Total</th><th></th></tr></thead>
                    <tbody>${salesRows}</tbody>
                </table>
            </div>
        </div>
        <div class="detail-section mt-2">
            <h4 class="detail-label error-label"><i class="fas fa-arrow-down"></i> Gastos del mes</h4>
            <div class="scroll-table">
                <table>
                    <thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Monto</th><th></th></tr></thead>
                    <tbody>${expenseRows}</tbody>
                </table>
            </div>
        </div>`;
}

function closeMonthDetail() {
    document.getElementById('month-detail-modal').classList.add('hidden');
    loadMonthlyFlow();
}

async function deleteSale(id, monthStr, monthName) {
    if (!confirm('¿Eliminar esta venta?')) return;
    await _supabase.from('umamii_sales').delete().eq('id', id);
    openMonthDetail(monthStr, monthName);
    loadStats();
}

async function deleteExpenseFromModal(id, monthStr, monthName) {
    if (!confirm('¿Eliminar este gasto?')) return;
    await _supabase.from('umamii_expenses').delete().eq('id', id);
    openMonthDetail(monthStr, monthName);
    loadStats();
}

// ============================================================
// DASHBOARD — TOP PRODUCTS (Donut + Podium)
// ============================================================
async function loadTopProducts() {
    const { data: sales } = await _supabase
        .from('umamii_sales')
        .select('quantity, products:umamii_products(name)');

    if (!sales || sales.length === 0) {
        renderDonutChart([]);
        renderPodium([]);
        return;
    }

    // Aggregate by product name
    const map = {};
    sales.forEach(s => {
        const name = s.products?.name || 'Desconocido';
        map[name] = (map[name] || 0) + parseInt(s.quantity, 10);
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);

    renderDonutChart(sorted.slice(0, 8));
    renderPodium(sorted.slice(0, 3));
}

const CHART_COLORS = [
    '#ffcc00','#ff6b35','#2ecc71','#00d2ff','#a855f7',
    '#ec4899','#f97316','#06b6d4'
];

function renderDonutChart(data) {
    const ctx = document.getElementById('productsDonutChart').getContext('2d');
    if (window.donutChart) window.donutChart.destroy();

    if (!data.length) {
        document.getElementById('donut-legend').innerHTML = '<p style="color:#888;font-size:0.8rem;text-align:center">Sin datos aún</p>';
        return;
    }

    const labels = data.map(d => d[0]);
    const values = data.map(d => d[1]);

    window.donutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{ data: values, backgroundColor: CHART_COLORS, borderWidth: 2, borderColor: '#1a1a1a' }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: { legend: { display: false }, tooltip: { callbacks: {
                label: ctx => ` ${ctx.label}: ${ctx.parsed} uds.`
            }}}
        }
    });

    // Custom legend
    document.getElementById('donut-legend').innerHTML = data.map((d, i) => `
        <div class="donut-legend-item">
            <span class="donut-dot" style="background:${CHART_COLORS[i]}"></span>
            <span>${d[0]}</span>
            <b>${d[1]}</b>
        </div>`).join('');
}

function renderPodium(top3) {
    const container = document.getElementById('podium-container');
    if (!top3.length) {
        container.innerHTML = '<div class="podium-loading">Sin datos de ventas aún</div>';
        return;
    }

    // Rearrange: 2nd, 1st, 3rd
    const order = [top3[1], top3[0], top3[2]].filter(Boolean);
    const ranks = top3.length >= 2 ? [2, 1, 3] : [1];
    const colors = ['#b0b0b0', '#ffcc00', '#cd7f32'];
    const colorIdx = top3.length >= 2 ? [0, 1, 2] : [1];
    const heights = ['130px', '180px', '100px'];
    const medals  = ['🥈', '🥇', '🥉'];

    const maxQty = top3[0]?.[1] || 1;

    container.innerHTML = `
        <div class="podium-wrapper">
            ${order.map((item, i) => {
                const rank = ranks[i];
                const col  = colors[colorIdx[i]];
                const h    = heights[colorIdx[i]];
                const imgFile = menuData.products.find(p => p.name === item[0])?.image;
                const imgSrc = imgFile ? `assets/img/${imgFile}` : `assets/img/Logo (2).webp`;
                return `
                <div class="podium-place rank-${rank}">
                    <div class="podium-product-img-wrap">
                        <img src="${imgSrc}" class="podium-product-img" onerror="this.src='assets/img/Logo (2).webp'" alt="${item[0]}">
                    </div>
                    <div class="podium-name">${item[0]}</div>
                    <div class="podium-qty">${item[1]} uds.</div>
                    <div class="podium-bar" style="height:${h};background:${col};">
                        <span class="podium-medal">${medals[colorIdx[i]]}</span>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
}

// ============================================================
// DASHBOARD — PRODUCTS CATALOG
// ============================================================
function renderDashCatFilters() {
    const wrap = document.getElementById('dash-cat-filters');
    wrap.innerHTML = `<button class="cat-filter-btn active" onclick="filterDashProducts('all', this)">Todos</button>` +
        menuData.categories.map(c =>
            `<button class="cat-filter-btn" onclick="filterDashProducts('${c.id}', this)">${c.name}</button>`
        ).join('');
}

function filterDashProducts(catId, btn) {
    currentDashCat = catId;
    document.querySelectorAll('#dash-cat-filters .cat-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderDashboardProducts(catId);
}

function renderDashboardProducts(catId) {
    const grid = document.getElementById('dashboard-products-grid');
    const list = catId === 'all' ? menuData.products : menuData.products.filter(p => p.category === catId);
    grid.innerHTML = list.map(p => {
        const catName = menuData.categories.find(c => c.id === p.category)?.name || '';
        const imgSrc  = p.image ? `assets/img/${p.image}` : `assets/img/Logo (2).webp`;
        return `
        <div class="product-mini-card">
            <img src="${imgSrc}" class="product-mini-img" onerror="this.src='assets/img/Logo (2).webp'" alt="${p.name}">
            <div class="product-mini-info">
                <span class="product-mini-cat">${catName}</span>
                <h4>${p.name}</h4>
                <p class="product-mini-price">$${p.price.toLocaleString()}</p>
            </div>
        </div>`;
    }).join('');
}

// ============================================================
// SALES CART
// ============================================================
function initSalesCart() {
    initSupabase();
    cart = {};
    renderSalesCatFilters();
    renderSalesGrid('all');
}

function renderSalesCatFilters() {
    const wrap = document.getElementById('sales-cat-filters');
    if (!wrap) return;
    wrap.innerHTML = `<button class="cat-filter-btn active" onclick="filterSalesCart('all', this)">Todos</button>` +
        menuData.categories.map(c =>
            `<button class="cat-filter-btn" onclick="filterSalesCart('${c.id}', this)">${c.name}</button>`
        ).join('');
}

function filterSalesCart(catId, btn) {
    currentSalesCat = catId;
    document.querySelectorAll('#sales-cat-filters .cat-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderSalesGrid(catId);
}

function filterSalesBySearch(query) {
    salesSearchQuery = query.toLowerCase();
    renderSalesGrid(currentSalesCat);
}

function renderSalesGrid(catId) {
    const grid = document.getElementById('sales-product-grid');
    if (!grid) return;
    let list = catId === 'all' ? menuData.products : menuData.products.filter(p => p.category === catId);
    
    if (salesSearchQuery) {
        list = list.filter(p => p.name.toLowerCase().includes(salesSearchQuery));
    }

    grid.innerHTML = list.map(p => {
        const qty = cart[p.name]?.qty || 0;
        const imgSrc = p.image ? `assets/img/${p.image}` : `assets/img/Logo (2).webp`;
        return `
        <div class="pos-card ${qty > 0 ? 'pos-card-active' : ''}" id="card-${sanitizeId(p.name)}">
            <img src="${imgSrc}" class="pos-img" onerror="this.src='assets/img/Logo (2).webp'" alt="${p.name}">
            <div class="pos-info">
                <h4>${p.name}</h4>
                <p class="pos-price">$${p.price.toLocaleString()}</p>
            </div>
            <div class="pos-controls">
                <button class="qty-btn" onclick="updateCart('${p.name}', ${p.price}, -1)">−</button>
                <span id="qty-${sanitizeId(p.name)}" class="qty-val">${qty}</span>
                <button class="qty-btn qty-btn-add" onclick="updateCart('${p.name}', ${p.price}, 1)">+</button>
            </div>
        </div>`;
    }).join('');
}

function sanitizeId(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '_');
}

function updateCart(name, price, delta) {
    if (!cart[name]) cart[name] = { qty: 0, price };
    cart[name].qty = Math.max(0, cart[name].qty + delta);
    if (cart[name].qty === 0) delete cart[name];

    // Update card qty display inline
    const qtyEl = document.getElementById(`qty-${sanitizeId(name)}`);
    if (qtyEl) qtyEl.innerText = cart[name]?.qty || 0;

    // Highlight card
    const card = document.getElementById(`card-${sanitizeId(name)}`);
    if (card) card.classList.toggle('pos-card-active', (cart[name]?.qty || 0) > 0);

    renderCartSummary();
}

function renderCartSummary() {
    const list = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total-amount');
    const entries = Object.entries(cart).filter(([, v]) => v.qty > 0);

    if (!entries.length) {
        list.innerHTML = '<p class="cart-empty-msg">Sin productos aún</p>';
        totalEl.innerText = '$0';
        return;
    }

    let total = 0;
    list.innerHTML = entries.map(([name, v]) => {
        const subtotal = v.price * v.qty;
        total += subtotal;
        return `
        <div class="cart-item-row">
            <div class="cart-item-info">
                <span class="cart-item-name">${name}</span>
                <span class="cart-item-qty">×${v.qty}</span>
            </div>
            <div class="cart-item-right">
                <span class="cart-item-sub">$${subtotal.toLocaleString()}</span>
                <button class="cart-remove-btn" onclick="updateCart('${name}', ${v.price}, -${v.qty})">×</button>
            </div>
        </div>`;
    }).join('');
    totalEl.innerText = `$${total.toLocaleString()}`;
}

function clearCart() {
    cart = {};
    renderSalesGrid(currentSalesCat);
    renderCartSummary();
}

async function submitCartSale() {
    const entries = Object.entries(cart).filter(([, v]) => v.qty > 0);
    if (!entries.length) { alert('Agrega productos al pedido'); return; }

    const salesInsert = [];
    for (const [name, v] of entries) {
        const { data: dbProd } = await _supabase.from('umamii_products').select('id').eq('name', name).single();
        if (dbProd) {
            salesInsert.push({ product_id: dbProd.id, quantity: v.qty, total_price: v.price * v.qty, notes: 'Venta Carrito' });
        }
    }

    if (salesInsert.length === 0) { alert('No se encontraron productos en la BD'); return; }
    const { error } = await _supabase.from('umamii_sales').insert(salesInsert);
    if (error) { alert('Error al guardar: ' + error.message); return; }

    alert(`✅ Venta registrada — ${salesInsert.length} producto(s)`);
    clearCart();
    loadSales();
    loadStats();
}

// ============================================================
// SALES TABLE
// ============================================================
async function loadSales() {
    const { data } = await _supabase
        .from('umamii_sales')
        .select('*, products:umamii_products(name)')
        .order('sale_date', { ascending: false });
    const tbody = document.querySelector('#sales-table tbody');
    tbody.innerHTML = data?.map(s => `
        <tr>
            <td>${new Date(s.sale_date).toLocaleDateString()}</td>
            <td>${s.products?.name || 'Varios'}</td>
            <td>${s.quantity}</td>
            <td class="success">$${parseFloat(s.total_price).toLocaleString()}</td>
            <td>${s.notes || ''}</td>
            <td><button class="delete-btn" onclick="deleteSaleRow('${s.id}')"><i class="fas fa-trash"></i></button></td>
        </tr>`).join('') || '<tr><td colspan="6" style="color:#888;text-align:center;padding:2rem">Sin ventas registradas</td></tr>';
}

async function deleteSaleRow(id) {
    if (!confirm('¿Eliminar esta venta?')) return;
    await _supabase.from('umamii_sales').delete().eq('id', id);
    loadSales();
    loadStats();
}

// ============================================================
// EXPENSES TABLE
// ============================================================
async function loadExpenses() {
    const { data } = await _supabase
        .from('umamii_expenses')
        .select('*')
        .order('expense_date', { ascending: false });
    const tbody = document.querySelector('#expenses-table tbody');
    tbody.innerHTML = data?.map(e => `
        <tr>
            <td>${new Date(e.expense_date).toLocaleDateString()}</td>
            <td>${e.description}</td>
            <td>${e.category}</td>
            <td class="error">$${parseFloat(e.amount).toLocaleString()}</td>
            <td><button class="delete-btn" onclick="deleteExpenseRow('${e.id}')"><i class="fas fa-trash"></i></button></td>
        </tr>`).join('') || '<tr><td colspan="5" style="color:#888;text-align:center;padding:2rem">Sin gastos registrados</td></tr>';
}

async function deleteExpenseRow(id) {
    if (!confirm('¿Eliminar este gasto?')) return;
    await _supabase.from('umamii_expenses').delete().eq('id', id);
    loadExpenses();
    loadStats();
}

// ============================================================
// PRODUCTS TABLE + VISUAL GRID
// ============================================================
// COP currency formatter
const formatCOP = (price) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);

async function loadProducts() {
    const { data } = await _supabase
        .from('umamii_products')
        .select('*')
        .order('category', { ascending: true });

    // Normalize categories to lowercase to avoid duplicates
    _productsCache = (data || []).map(p => ({ ...p, category: (p.category || '').toLowerCase() }));

    // Table
    const tbody = document.querySelector('#products-table tbody');
    tbody.innerHTML = _productsCache.map(p => {
        const imgSrc = p.image ? `assets/img/${p.image}` : `assets/img/Logo (2).webp`;
        return `
        <tr>
            <td><img src="${imgSrc}" class="product-table-img" onerror="this.src='assets/img/Logo (2).webp'" alt="${p.name}"></td>
            <td><b>${p.name}</b></td>
            <td>${p.category}</td>
            <td class="primary">${formatCOP(p.price)}</td>
            <td style="display:flex;gap:0.5rem">
                <button class="action-btn detail-btn" onclick="openEditProductModal('${p.id}','${p.name.replace(/'/g,"\\'")}',${ p.price},'${p.category}','${p.image||''}','${(p.description||'').replace(/'/g,"\\'").replace(/\n/g,' ')}')"><i class="fas fa-pen"></i> Editar</button>
                <button class="delete-btn" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="5" style="color:#888;text-align:center;padding:2rem">Sin productos</td></tr>';

    // Visual grid
    renderProductsCatFilters();
    renderProductsVisualGrid(currentProdCat);
}

// Visual catalog in products tab
const CAT_DISPLAY = {
    hamburguesas: 'Hamburguesas', perros: 'Perros', sandwiches: 'Sándwiches',
    salchipapas: 'Salchipapas', adiciones: 'Adiciones', bebidas: 'Bebidas'
};
const catLabel = (id) => CAT_DISPLAY[id] || id.charAt(0).toUpperCase() + id.slice(1);

function renderProductsCatFilters() {
    const wrap = document.getElementById('products-cat-filters');
    if (!wrap) return;
    const cats = [...new Set(_productsCache.map(p => p.category))].sort();
    wrap.innerHTML = `<button class="cat-filter-btn active" onclick="filterProductsGrid('all',this)">Todos</button>` +
        cats.map(c =>
            `<button class="cat-filter-btn" onclick="filterProductsGrid('${c}',this)">${catLabel(c)}</button>`
        ).join('');
}

function filterProductsGrid(catId, btn) {
    currentProdCat = catId;
    document.querySelectorAll('#products-cat-filters .cat-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderProductsVisualGrid(catId);
}

function renderProductsVisualGrid(catId) {
    const grid = document.getElementById('products-visual-grid');
    if (!grid) return;
    const list = catId === 'all' ? _productsCache : _productsCache.filter(p => p.category === catId);
    grid.innerHTML = list.map(p => {
        const imgSrc = p.image ? `assets/img/${p.image}` : `assets/img/Logo (2).webp`;
        const nameSafe = p.name.replace(/'/g, "\\'");
        const imgSafe  = (p.image || '').replace(/'/g, "\\'");
        const descSafe = (p.description || '').replace(/'/g, "\\'").replace(/\n/g, ' ');
        return `
        <div class="product-mini-card product-mini-editable">
            <img src="${imgSrc}" class="product-mini-img" onerror="this.src='assets/img/Logo (2).webp'" alt="${p.name}">
            <div class="product-mini-info">
                <span class="product-mini-cat">${p.category}</span>
                <h4>${p.name}</h4>
                <p class="product-mini-price">${formatCOP(p.price)}</p>
            </div>
            <div class="product-mini-actions">
                <button class="edit-price-btn" onclick="openEditProductModal('${p.id}','${nameSafe}',${p.price},'${p.category}','${imgSafe}','${descSafe}')">
                    <i class="fas fa-pen"></i> Editar precio
                </button>
            </div>
        </div>`;
    }).join('');
}

function openEditProductModal(id, name, price, category, image, description) {
    document.getElementById('modal-title').innerText = 'Editar Producto';
    const fields = document.getElementById('dynamic-fields');
    document.getElementById('modal-container').classList.remove('hidden');
    const cats = [...new Set(_productsCache.map(p => p.category))].sort();
    fields.innerHTML = `
        <input type="hidden" id="prod-edit-id" value="${id}">
        <input type="text" id="prod-name" value="${name}" placeholder="Nombre del producto" required>
        <select id="prod-cat" required>
            ${cats.map(c => `<option value="${c}" ${c === category ? 'selected' : ''}>${catLabel(c)}</option>`).join('')}
        </select>
        <input type="number" id="prod-price" value="${price}" placeholder="Precio" required>
        <input type="text" id="prod-img" value="${image}" placeholder="Nombre de imagen (opcional)">
        <textarea id="prod-desc" placeholder="Descripción de ingredientes" style="width:100%;margin-top:1rem;padding:1rem;border-radius:10px;background:var(--glass-bg);color:white;border:1px solid var(--glass-border);min-height:80px;">${description}</textarea>`;
}

async function deleteProduct(id) {
    if (confirm('¿Eliminar producto?')) {
        await _supabase.from('umamii_products').delete().eq('id', id);
        loadProducts();
    }
}

// ============================================================
// MODALS
// ============================================================
async function openModal(type) {
    const fields = document.getElementById('dynamic-fields');
    document.getElementById('modal-container').classList.remove('hidden');
    if (type === 'expense') {
        document.getElementById('modal-title').innerText = 'Registrar Gasto';
        fields.innerHTML = `
            <input type="text" id="exp-desc" placeholder="Descripción" required>
            <select id="exp-cat" required>
                <option value="Insumos">Insumos</option>
                <option value="Servicios">Servicios Públicos</option>
                <option value="Arriendo">Arriendo</option>
                <option value="Personal">Personal</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Otros">Otros</option>
            </select>
            <input type="number" id="exp-amount" placeholder="Monto" required>`;
    } else if (type === 'income') {
        document.getElementById('modal-title').innerText = 'Registrar Otro Ingreso';
        fields.innerHTML = `
            <input type="text" id="inc-desc" placeholder="Descripción" required>
            <input type="number" id="inc-amount" placeholder="Monto" required>`;
    } else if (type === 'product') {
        document.getElementById('modal-title').innerText = 'Nuevo Producto';
        const catOptions = [
            { id: 'hamburguesas', name: 'Hamburguesas' },
            { id: 'perros',       name: 'Perros' },
            { id: 'sandwiches',   name: 'Sándwiches' },
            { id: 'salchipapas',  name: 'Salchipapas' },
            { id: 'adiciones',    name: 'Adiciones' },
            { id: 'bebidas',      name: 'Bebidas' },
        ];
        fields.innerHTML = `
            <input type="text" id="prod-name" placeholder="Nombre del producto" required>
            <select id="prod-cat" required>
                ${catOptions.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
            <input type="number" id="prod-price" placeholder="Precio" required>
            <input type="text" id="prod-img" placeholder="Nombre de imagen (ej: HAMBURGUESA TRADI.webp)">
            <textarea id="prod-desc" placeholder="Descripción de ingredientes" style="width:100%; margin-top:1rem; padding:1rem; border-radius:10px; background:var(--glass-bg); color:white; border:1px solid var(--glass-border); min-height:100px;"></textarea>`;
    }
}

document.getElementById('admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('modal-title').innerText;
    if (title.includes('Gasto')) {
        await _supabase.from('umamii_expenses').insert([{
            description: document.getElementById('exp-desc').value,
            category: document.getElementById('exp-cat').value,
            amount: parseFloat(document.getElementById('exp-amount').value)
        }]);
        loadExpenses();
    } else if (title.includes('Ingreso')) {
        await _supabase.from('umamii_other_income').insert([{
            description: document.getElementById('inc-desc').value,
            amount: parseFloat(document.getElementById('inc-amount').value)
        }]);
    } else if (title.includes('Producto')) {
        const editId = document.getElementById('prod-edit-id')?.value;
        const prodData = {
            name:        document.getElementById('prod-name').value,
            category:    document.getElementById('prod-cat').value,
            price:       parseFloat(document.getElementById('prod-price').value),
            image:       document.getElementById('prod-img').value || null,
            description: document.getElementById('prod-desc').value || null
        };
        if (editId) {
            await _supabase.from('umamii_products').update(prodData).eq('id', editId);
        } else {
            await _supabase.from('umamii_products').insert([prodData]);
        }
        loadProducts();
    }
    closeModal();
    loadStats();
});

function closeModal() { document.getElementById('modal-container').classList.add('hidden'); }

// ============================================================
// SYNC MENU → DB  (now includes image column)
// ============================================================
async function syncMenuWithDB() {
    // Upsert all menu products (including images) each login
    const upsertData = menuData.products.map(p => ({
        name: p.name,
        price: p.price,
        category: (p.category || 'general').toLowerCase(),
        image: p.image || null
    }));
    // Insert only new ones (avoid overwriting custom DB entries)
    const { data: existing } = await _supabase.from('umamii_products').select('name, image');
    const existingNames = new Set(existing?.map(p => p.name) || []);
    const newProducts = upsertData.filter(p => !existingNames.has(p.name));
    if (newProducts.length > 0) {
        await _supabase.from('umamii_products').insert(newProducts);
    }
    // Update image for products that have no image yet
    const noImageProducts = (existing || []).filter(p => !p.image);
    for (const ep of noImageProducts) {
        const menuItem = menuData.products.find(p => p.name === ep.name);
        if (menuItem?.image) {
            await _supabase.from('umamii_products').update({ image: menuItem.image }).eq('name', ep.name);
        }
    }
}

// ============================================================
// EXPORT CSV
// ============================================================
async function exportDataToCSV() {
    const { data: sales }    = await _supabase.from('umamii_sales').select('*, products:umamii_products(name)').order('sale_date', { ascending: false });
    const { data: expenses } = await _supabase.from('umamii_expenses').select('*').order('expense_date', { ascending: false });

    let csv = 'VENTAS\nFecha,Producto,Cantidad,Total,Notas\n';
    (sales || []).forEach(s => {
        csv += `${new Date(s.sale_date).toLocaleDateString()},${s.products?.name || 'Varios'},${s.quantity},$${s.total_price},${s.notes || ''}\n`;
    });
    csv += '\nGASTOS\nFecha,Descripción,Categoría,Monto\n';
    (expenses || []).forEach(e => {
        csv += `${new Date(e.expense_date).toLocaleDateString()},${e.description},${e.category},$${e.amount}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'umami_reporte.csv'; a.click();
}

// ============================================================
// HELPERS
// ============================================================
function getDateRange() {
    let s = new Date(); s.setHours(0, 0, 0, 0);
    if (currentFilter === 'week')  s.setHours(-24 * ((s.getDay() || 7) - 1));
    else if (currentFilter === 'month') s.setDate(1);
    else if (currentFilter === 'year')  { s.setMonth(0); s.setDate(1); }
    return s.toISOString();
}

function setFilter(f) {
    currentFilter = f;
    document.querySelectorAll('.filter-btn').forEach(b => {
        const map = { day: 'hoy', week: 'semana', month: 'mes', year: 'año' };
        b.classList.toggle('active', b.innerText.toLowerCase() === map[f]);
    });
    loadStats();
}

function logout() { window.location.reload(); }
