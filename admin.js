// ============================================================
// UMAMI BURGER — ADMIN DASHBOARD JS
// ============================================================
const SUPABASE_URL = 'https://gvdvgjredmqojtsogrkn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2ZHZnanJlZG1xb2p0c29ncmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzA0MDYsImV4cCI6MjA4Nzk0NjQwNn0.LFBqn7gz1HWSnULa3uC9N_MHg1BiUFoUzG_MF_BtntA';

// ---- Global State ----
let _supabase = null;
let currentFilter = 'day';
let periodOffset    = 0;      // nav offset from current period (0 = current)
let customRangeFrom = '';     // ISO date string for custom range start
let customRangeTo   = '';     // ISO date string for custom range end
let cart = {};           // { productName: { qty, price } }
let productsSearchQuery = '';
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
    if (pass === 'Gordo1') {
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
    updateOrderBadge();
    subscribeToOrders();
}

// ============================================================
// NAVIGATION
// ============================================================
function showTab(tabId, el) {
    document.querySelectorAll('.bnav-item').forEach(btn => btn.classList.remove('active'));
    if (el) el.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    // Hide mobile cart bar when leaving the sales tab
    if (tabId !== 'sales') {
        const bar = document.getElementById('mobile-cart-bar');
        if (bar) bar.classList.add('hidden');
    } else {
        // Re-evaluate bar visibility when entering sales tab
        const entries = Object.entries(cart).filter(([, v]) => v.qty > 0);
        const total = entries.reduce((sum, [, v]) => sum + v.price * v.qty, 0);
        const count = entries.reduce((sum, [, v]) => sum + v.qty, 0);
        updateMobileCartBar(count, total);
    }
    loadTabData(tabId);
}

async function loadTabData(tabId) {
    if (!_supabase) return;
    switch (tabId) {
        case 'orders':   await loadOrders();   break;
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
    const { start, end } = getDateRange();
    updatePeriodLabel();

    const [{ data: sales }, { data: others }, { data: expenses }] = await Promise.all([
        _supabase.from('umamii_sales').select('*, products:umamii_products(name)').gte('sale_date', start).lte('sale_date', end),
        _supabase.from('umamii_other_income').select('*').gte('income_date', start).lte('income_date', end),
        _supabase.from('umamii_expenses').select('*').gte('expense_date', start).lte('expense_date', end)
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

    renderExpenseBreakdown(expenses || []);
    loadMonthlyFlow();
    loadTopProducts();
}

// ============================================================
// DASHBOARD — EXPENSE BREAKDOWN BY CATEGORY
// ============================================================
const EXPENSE_CAT_COLORS = {
    'Insumos':          '#ff6b6b',
    'Servicios':        '#feca57',
    'Arriendo':         '#ff9f43',
    'Personal':         '#48dbfb',
    'Administrativo':   '#a29bfe',
    'Otros':            '#636e72'
};

const EXPENSE_CAT_LABELS = {
    'Insumos':          'Insumos',
    'Servicios':        'Servicios Públicos',
    'Arriendo':         'Arriendo',
    'Personal':         'Personal',
    'Administrativo':   'Administrativo',
    'Otros':            'Otros'
};

function renderExpenseBreakdown(expenses) {
    const section = document.getElementById('expense-breakdown-section');
    if (!section) return;

    if (!expenses || expenses.length === 0) {
        section.classList.add('hidden');
        if (window.expenseCatChart) { window.expenseCatChart.destroy(); window.expenseCatChart = null; }
        return;
    }
    section.classList.remove('hidden');

    // Group by category
    const grouped = {};
    expenses.forEach(e => {
        const cat = e.category || 'Otros';
        if (!grouped[cat]) grouped[cat] = 0;
        grouped[cat] += parseFloat(e.amount) || 0;
    });

    const total = Object.values(grouped).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);

    // ── Donut chart ──
    const canvas = document.getElementById('expenseCatChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (window.expenseCatChart) window.expenseCatChart.destroy();
        const chartLabels = sorted.map(([cat]) => EXPENSE_CAT_LABELS[cat] || cat);
        const chartValues = sorted.map(([, amt]) => amt);
        const chartColors = sorted.map(([cat]) => EXPENSE_CAT_COLORS[cat] || '#888');

        window.expenseCatChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartLabels,
                datasets: [{
                    data: chartValues,
                    backgroundColor: chartColors,
                    borderColor: '#1a1a1a',
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => {
                                const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                                return ` $${ctx.parsed.toLocaleString()} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Center label: total
        const center = document.getElementById('expense-cat-center');
        if (center) {
            center.innerHTML = `<span class="exp-center-label">Total</span><span class="exp-center-amount">$${total.toLocaleString()}</span>`;
        }
    }

    // ── Breakdown list ──
    document.getElementById('expense-breakdown-list').innerHTML = sorted.map(([cat, amount]) => {
        const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
        const color = EXPENSE_CAT_COLORS[cat] || '#888';
        const label = EXPENSE_CAT_LABELS[cat] || cat;
        return `
        <div class="exp-breakdown-row">
            <div class="exp-breakdown-left">
                <span class="exp-breakdown-dot" style="background:${color}"></span>
                <span class="exp-breakdown-cat">${label}</span>
            </div>
            <div class="exp-breakdown-bar-wrap">
                <div class="exp-breakdown-bar" style="width:${pct}%;background:${color}80"></div>
            </div>
            <span class="exp-breakdown-pct">${pct}%</span>
            <span class="exp-breakdown-amount" style="color:${color}">$${amount.toLocaleString()}</span>
        </div>`;
    }).join('');
}

// ============================================================
// DASHBOARD — MONTHLY FLOW
// ============================================================
async function loadMonthlyFlow() {
    const { data: monthlyData } = await _supabase.from('UMAMII_monthly_cash_flow').select('*');
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

    const [{ data: sales }, { data: expenses }, { data: otherIncome }] = await Promise.all([
        _supabase.from('umamii_sales').select('*, products:umamii_products(name)')
            .gte('sale_date', monthStart.toISOString()).lt('sale_date', monthEnd.toISOString())
            .order('sale_date', { ascending: false }),
        _supabase.from('umamii_expenses').select('*')
            .gte('expense_date', monthStart.toISOString()).lt('expense_date', monthEnd.toISOString())
            .order('expense_date', { ascending: false }),
        _supabase.from('umamii_other_income').select('*')
            .gte('income_date', monthStart.toISOString()).lt('income_date', monthEnd.toISOString())
            .order('income_date', { ascending: false })
    ]);

    const salesRows = (sales || []).map(s => `
        <tr>
            <td>${new Date(s.sale_date).toLocaleDateString()}</td>
            <td>${s.products?.name || s.notes || 'Personalizado'}</td>
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

    const otherRows = (otherIncome || []).map(o => `
        <tr>
            <td>${new Date(o.income_date).toLocaleDateString()}</td>
            <td>${o.description}</td>
            <td class="success">$${parseFloat(o.amount).toLocaleString()}</td>
            <td><button class="delete-btn" onclick="deleteOtherIncomeFromModal('${o.id}', '${monthStr}', '${monthName}')"><i class="fas fa-trash"></i></button></td>
        </tr>`).join('') || '<tr><td colspan="4" style="color:#888;text-align:center">Sin otros ingresos</td></tr>';

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
            <h4 class="detail-label" style="color:var(--primary)"><i class="fas fa-plus-circle"></i> Otros ingresos del mes</h4>
            <div class="scroll-table">
                <table>
                    <thead><tr><th>Fecha</th><th>Descripción</th><th>Monto</th><th></th></tr></thead>
                    <tbody>${otherRows}</tbody>
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

async function deleteOtherIncomeFromModal(id, monthStr, monthName) {
    if (!confirm('¿Eliminar este ingreso?')) return;
    await _supabase.from('umamii_other_income').delete().eq('id', id);
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
        <div class="product-mini-card ${qty > 0 ? 'product-mini-card-active' : ''}" id="card-${sanitizeId(p.name)}">
            <img src="${imgSrc}" class="product-mini-img" onerror="this.src='assets/img/Logo (2).webp'" alt="${p.name}">
            <div class="product-mini-info">
                <span class="product-mini-cat">${catLabel(p.category)}</span>
                <h4>${p.name}</h4>
                <p class="product-mini-price">${formatCOP(p.price)}</p>
            </div>
            <div class="product-mini-actions">
                <div class="pos-controls">
                    <button class="qty-btn" onclick="updateCart('${p.name}', ${p.price}, -1)">−</button>
                    <span id="qty-${sanitizeId(p.name)}" class="qty-val">${qty}</span>
                    <button class="qty-btn qty-btn-add" onclick="updateCart('${p.name}', ${p.price}, 1)">+</button>
                </div>
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
    if (card) card.classList.toggle('product-mini-card-active', (cart[name]?.qty || 0) > 0);

    renderCartSummary();
}

function renderCartSummary() {
    const list = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total-amount');
    const entries = Object.entries(cart).filter(([, v]) => v.qty > 0);

    if (!entries.length) {
        list.innerHTML = '<p class="cart-empty-msg">Sin productos aún</p>';
        totalEl.innerText = '$0';
        updateMobileCartBar(0, 0);
        return;
    }

    let total = 0;
    list.innerHTML = entries.map(([name, v]) => {
        const displayName = v.label || name;
        const subtotal = v.price * v.qty;
        total += subtotal;
        return `
        <div class="cart-item-row">
            <div class="cart-item-info">
                <span class="cart-item-name">${displayName}</span>
                <span class="cart-item-qty">×${v.qty}</span>
            </div>
            <div class="cart-item-right">
                <span class="cart-item-sub">$${subtotal.toLocaleString()}</span>
                <button class="cart-remove-btn" onclick="updateCart('${name}', ${v.price}, -${v.qty})">×</button>
            </div>
        </div>`;
    }).join('');
    totalEl.innerText = `$${total.toLocaleString()}`;

    const itemCount = entries.reduce((sum, [, v]) => sum + v.qty, 0);
    updateMobileCartBar(itemCount, total);
}

function updateMobileCartBar(itemCount, total) {
    const bar = document.getElementById('mobile-cart-bar');
    if (!bar) return;
    const onSalesTab = !document.getElementById('tab-sales').classList.contains('hidden');
    if (itemCount > 0 && onSalesTab) {
        document.getElementById('mob-cart-count').textContent = `${itemCount} ítem${itemCount !== 1 ? 's' : ''}`;
        document.getElementById('mob-cart-total').textContent = `$${total.toLocaleString()}`;
        bar.classList.remove('hidden');
    } else {
        bar.classList.add('hidden');
    }
}

function scrollToCartSummary() {
    const panel = document.querySelector('.cart-summary-panel');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearCart() {
    cart = {};
    renderSalesGrid(currentSalesCat);
    renderCartSummary();
}

function toggleCustomItemForm() {
    const form = document.getElementById('custom-item-form');
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
        document.getElementById('custom-item-name').value = '';
        document.getElementById('custom-item-price').value = '';
        document.getElementById('custom-item-name').focus();
    }
}

function addCustomItemToCart() {
    const name  = document.getElementById('custom-item-name').value.trim();
    const price = parseCOPInput(document.getElementById('custom-item-price').value);
    if (!name)  { alert('Ingresa un nombre para el ítem'); return; }
    if (!price) { alert('Ingresa un precio válido'); return; }
    const key = `__custom__${name}`;
    if (!cart[key]) cart[key] = { qty: 0, price, isCustom: true, label: name };
    cart[key].qty += 1;
    toggleCustomItemForm();
    renderCartSummary();
}

async function submitCartSale() {
    const entries = Object.entries(cart).filter(([, v]) => v.qty > 0);
    if (!entries.length) { alert('Agrega productos al pedido'); return; }

    const salesInsert = [];
    for (const [name, v] of entries) {
        if (v.isCustom) {
            salesInsert.push({ product_id: null, quantity: v.qty, total_price: v.price * v.qty, notes: v.label || name });
        } else {
            const { data: dbProd } = await _supabase.from('umamii_products').select('id').eq('name', name).single();
            if (dbProd) {
                salesInsert.push({ product_id: dbProd.id, quantity: v.qty, total_price: v.price * v.qty, notes: 'Venta Carrito' });
            }
        }
    }

    if (salesInsert.length === 0) { alert('No se encontraron productos en la BD'); return; }
    const { error } = await _supabase.from('umamii_sales').insert(salesInsert);
    if (error) { alert('Error al guardar: ' + error.message); return; }

    const total = entries.reduce((a, [, v]) => a + v.price * v.qty, 0);
    alert(`✅ Venta registrada — ${salesInsert.length} ítem(s) — ${formatCOP(total)}`);
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
            <td>${s.products?.name || s.notes || 'Personalizado'}</td>
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

// COP input mask helpers
function formatCOPInput(el) {
    const raw = el.value.replace(/\D/g, '');
    el.value = raw ? new Intl.NumberFormat('es-CO').format(parseInt(raw, 10)) : '';
}
function parseCOPInput(val) {
    return parseInt((val || '0').replace(/\D/g, ''), 10) || 0;
}

async function loadProducts() {
    // Try ordering by sort_order (requires migration). Fall back to category+name if column doesn't exist yet.
    let { data, error } = await _supabase
        .from('umamii_products')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('category', { ascending: true })
        .order('name', { ascending: true });

    if (error) {
        // sort_order column likely doesn't exist yet — fallback query
        const fallback = await _supabase
            .from('umamii_products')
            .select('*')
            .order('category', { ascending: true })
            .order('name', { ascending: true });
        data = fallback.data;
    }

    // Normalize categories to lowercase, preserve sold_out flag
    _productsCache = (data || []).map(p => ({ ...p, category: (p.category || '').toLowerCase(), sold_out: !!p.sold_out }));

    // Table + Visual grid
    renderProductsTable(_productsCache);
    renderProductsCatFilters();
    renderProductsVisualGrid(currentProdCat);
}

function renderProductsTable(list) {
    const tbody = document.querySelector('#products-table tbody');
    if (!tbody) return;
    tbody.innerHTML = list.map(p => {
        const imgSrc = p.image ? `assets/img/${p.image}` : `assets/img/Logo (2).webp`;
        const soldLabel = p.sold_out
            ? `<span class="badge-agotado">Agotado</span>`
            : `<span class="badge-disponible">Disponible</span>`;
        const isSpicy = p.name.includes('🌶️') || p.name.includes('🌶');
        const isCrown = p.name.includes('👑');
        const rowExtra = (isSpicy ? ' spicy-card' : '') + (isCrown ? ' crown-card' : '');
        return `
        <tr class="${p.sold_out ? 'row-agotado' : ''}${rowExtra}">
            <td><img src="${imgSrc}" class="product-table-img" onerror="this.src='assets/img/Logo (2).webp'" alt="${p.name}"></td>
            <td><b>${p.name}</b><br>${soldLabel}</td>
            <td>${catLabel(p.category)}</td>
            <td class="primary">${formatCOP(p.price)}</td>
            <td style="display:flex;gap:0.5rem;flex-wrap:wrap">
                <button class="action-btn detail-btn" onclick="openEditProductModal('${p.id}','${p.name.replace(/'/g,"\\'")}',${p.price},'${p.category}','${p.image||''}','${(p.description||'').replace(/'/g,"\\'").replace(/\n/g,' ')}')">
                    <i class="fas fa-pen"></i> Editar
                </button>
                <button class="action-btn ${p.sold_out ? 'btn-reactivar' : 'btn-agotado'}" onclick="toggleProductSoldOut('${p.id}',${p.sold_out})">
                    <i class="fas ${p.sold_out ? 'fa-check-circle' : 'fa-ban'}"></i> ${p.sold_out ? 'Reactivar' : 'Agotado'}
                </button>
                <button class="delete-btn" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="5" style="color:#888;text-align:center;padding:2rem">Sin productos</td></tr>';
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

function filterProductsBySearch(query) {
    productsSearchQuery = query.toLowerCase();
    renderProductsVisualGrid(currentProdCat);
    const filtered = productsSearchQuery
        ? _productsCache.filter(p => p.name.toLowerCase().includes(productsSearchQuery))
        : _productsCache;
    renderProductsTable(filtered);
}

function renderProductsVisualGrid(catId) {
    const grid = document.getElementById('products-visual-grid');
    if (!grid) return;
    let list = catId === 'all' ? _productsCache : _productsCache.filter(p => p.category === catId);
    if (productsSearchQuery) {
        list = list.filter(p => p.name.toLowerCase().includes(productsSearchQuery));
    }
    grid.innerHTML = list.map(p => {
        const imgSrc = p.image ? `assets/img/${p.image}` : `assets/img/Logo (2).webp`;
        const nameSafe = p.name.replace(/'/g, "\\'");
        const imgSafe  = (p.image || '').replace(/'/g, "\\'");
        const descSafe = (p.description || '').replace(/'/g, "\\'").replace(/\n/g, ' ');
        const agotadoOverlay = p.sold_out ? `<div class="agotado-overlay"><span>AGOTADO</span></div>` : '';
        const isSpicyCard = p.name.includes('🌶️') || p.name.includes('🌶');
        const isCrownCard = p.name.includes('👑');
        const extraClasses = (isSpicyCard ? ' spicy-card' : '') + (isCrownCard ? ' crown-card' : '');
        return `
        <div class="product-mini-card product-mini-editable${p.sold_out ? ' product-mini-agotado' : ''}${extraClasses}" data-id="${p.id}">
            <div class="drag-handle" title="Arrastrar para reordenar"><i class="fas fa-grip-vertical"></i></div>
            <div style="position:relative">
                <img src="${imgSrc}" class="product-mini-img" onerror="this.src='assets/img/Logo (2).webp'" alt="${p.name}">
                ${agotadoOverlay}
            </div>
            <div class="product-mini-info">
                <span class="product-mini-cat">${catLabel(p.category)}</span>
                <h4>${p.name}</h4>
                <p class="product-mini-price">${formatCOP(p.price)}</p>
            </div>
            <div class="product-mini-actions">
                <button class="edit-price-btn" onclick="openEditProductModal('${p.id}','${nameSafe}',${p.price},'${p.category}','${imgSafe}','${descSafe}')">
                    <i class="fas fa-pen"></i> Editar
                </button>
                <button class="sold-out-toggle-btn ${p.sold_out ? 'btn-reactivar' : 'btn-agotado'}" onclick="toggleProductSoldOut('${p.id}',${p.sold_out})">
                    <i class="fas ${p.sold_out ? 'fa-check-circle' : 'fa-ban'}"></i> ${p.sold_out ? 'Reactivar' : 'Marcar agotado'}
                </button>
                <button class="sold-out-toggle-btn btn-eliminar" onclick="deleteProduct('${p.id}')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>`;
    }).join('');

    // Init drag-and-drop reordering with SortableJS
    if (typeof Sortable !== 'undefined') {
        Sortable.create(grid, {
            animation: 180,
            handle: '.drag-handle',
            ghostClass: 'product-mini-drag-ghost',
            chosenClass: 'product-mini-drag-chosen',
            onEnd: async function () {
                const ids = [...grid.querySelectorAll('[data-id]')].map(el => el.dataset.id);
                await saveProductOrder(ids);
            }
        });
    }
}

async function saveProductOrder(orderedIds) {
    // Batch update sort_order in Supabase
    const updates = orderedIds.map((id, index) =>
        _supabase.from('umamii_products').update({ sort_order: index }).eq('id', id)
    );
    await Promise.all(updates);
    // Sync local cache order without full reload so grid position doesn't jump
    const byId = Object.fromEntries(_productsCache.map(p => [p.id, p]));
    _productsCache = orderedIds
        .map(id => byId[id])
        .filter(Boolean)
        .concat(_productsCache.filter(p => !orderedIds.includes(p.id)));
    // Refresh the full table too so it reflects new order
    renderProductsTable(_productsCache);
}

async function toggleProductSoldOut(id, currentStatus) {
    const newStatus = !currentStatus;
    await _supabase.from('umamii_products').update({ sold_out: newStatus }).eq('id', id);
    await loadProducts();
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
        <input type="text" id="prod-price" value="${new Intl.NumberFormat('es-CO').format(price)}" placeholder="Precio" oninput="formatCOPInput(this)" required>
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
            <input type="text" id="prod-price" placeholder="Precio" oninput="formatCOPInput(this)" required>
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
            amount: parseFloat(document.getElementById('inc-amount').value),
            income_date: new Date().toISOString()
        }]);
    } else if (title.includes('Producto')) {
        const editId = document.getElementById('prod-edit-id')?.value;
        const prodData = {
            name:        document.getElementById('prod-name').value,
            category:    document.getElementById('prod-cat').value,
            price:       parseCOPInput(document.getElementById('prod-price').value),
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
// ORDERS — REALTIME SUBSCRIPTION
// ============================================================
function subscribeToOrders() {
    if (!_supabase) return;
    _supabase
        .channel('umamii-orders-watch')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'umamii_orders' },
            (payload) => {
                updateOrderBadge();
                // If the orders tab is currently open, refresh it live
                const ordersTab = document.getElementById('tab-orders');
                if (ordersTab && !ordersTab.classList.contains('hidden')) {
                    loadOrders();
                }
                showOrderToast(payload.new);
            }
        )
        .subscribe();
}

function showOrderToast(order) {
    // Play a subtle ping using Web Audio API
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
    } catch (_) {}

    // Shake the badge button
    const bnavBtn = document.querySelector('.bnav-item[onclick*="orders"]');
    if (bnavBtn) {
        bnavBtn.classList.add('bnav-shake');
        setTimeout(() => bnavBtn.classList.remove('bnav-shake'), 800);
    }

    // Build toast
    const name = order?.customer_name ? `<b>${order.customer_name}</b>` : 'Cliente';
    const itemCount = Array.isArray(order?.items) ? order.items.reduce((s, i) => s + (i.qty || 1), 0) : '?';
    const toast = document.createElement('div');
    toast.className = 'order-toast';
    toast.innerHTML = `
        <div class="order-toast-icon"><i class="fas fa-bell"></i></div>
        <div class="order-toast-body">
            <span class="order-toast-title">¡Nuevo pedido!</span>
            <span class="order-toast-sub">${name} &mdash; ${itemCount} ítem(s)</span>
        </div>
        <button class="order-toast-close" onclick="this.parentElement.remove()">✕</button>`;
    document.body.appendChild(toast);
    // Auto-dismiss after 8 s
    setTimeout(() => { toast.classList.add('order-toast-hide'); setTimeout(() => toast.remove(), 400); }, 8000);
}

// ============================================================
// ORDERS
// ============================================================
let _currentOrderFilter = 'pending';

async function updateOrderBadge() {
    if (!_supabase) return;
    const { count } = await _supabase
        .from('umamii_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
    const badge = document.getElementById('orders-badge');
    if (!badge) return;
    if (count && count > 0) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

async function loadOrders(statusFilter) {
    if (!_supabase) return;
    if (statusFilter) _currentOrderFilter = statusFilter;
    const list = document.getElementById('orders-list');
    list.innerHTML = '<p class="orders-empty-msg"><i class="fas fa-spinner fa-spin"></i> Cargando...</p>';

    let query = _supabase.from('umamii_orders').select('*').order('created_at', { ascending: false });
    if (_currentOrderFilter !== 'all') query = query.eq('status', _currentOrderFilter);

    const { data, error } = await query;
    if (error) { list.innerHTML = `<p class="orders-empty-msg error">Error: ${error.message}</p>`; return; }
    if (!data || data.length === 0) {
        const labels = { pending: 'pedidos pendientes', confirmed: 'pedidos confirmados', rejected: 'pedidos rechazados', all: 'pedidos' };
        list.innerHTML = `<p class="orders-empty-msg"><i class="fas fa-inbox"></i> No hay ${labels[_currentOrderFilter] || 'pedidos'}</p>`;
        return;
    }
    list.innerHTML = data.map(o => renderOrderCard(o)).join('');
    updateOrderBadge();
}

function filterOrders(status, btn) {
    document.querySelectorAll('#tab-orders .filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    loadOrders(status);
}

function renderOrderCard(o) {
    const items = Array.isArray(o.items) ? o.items : [];
    const date  = new Date(o.created_at);
    const timeAgo = timeSince(date);
    const dateStr = date.toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const totalFmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(o.total);

    const statusMap = {
        pending:   { label: 'Pendiente',   cls: 'order-badge-pending' },
        confirmed: { label: 'Confirmado',  cls: 'order-badge-confirmed' },
        rejected:  { label: 'Rechazado',   cls: 'order-badge-rejected' },
    };
    const st = statusMap[o.status] || statusMap.pending;

    const itemsHtml = items.map(i => `
        <div class="order-item-row">
            ${i.image ? `<img src="assets/img/${i.image}" class="order-item-img" onerror="this.style.display='none'" alt="">` : ''}
            <span class="order-item-name">${i.quantity}× ${i.name}</span>
            <span class="order-item-price">${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(i.price * i.quantity)}</span>
        </div>`).join('');

    const actionBtns = o.status === 'pending' ? `
        <div class="order-actions">
            <button class="order-btn-confirm" onclick="convertOrderToSale('${o.id}')">
                <i class="fas fa-check-circle"></i> Convertir a Venta
            </button>
            <button class="order-btn-reject" onclick="rejectOrder('${o.id}')">
                <i class="fas fa-times-circle"></i> Rechazar
            </button>
        </div>` : '';

    return `
    <div class="order-card" id="order-${o.id}">
        <div class="order-card-header">
            <div class="order-meta">
                <span class="order-time" title="${dateStr}"><i class="fas fa-clock"></i> ${timeAgo}</span>
                ${o.customer_name ? `<span class="order-customer"><i class="fas fa-user"></i> ${o.customer_name}</span>` : ''}
            </div>
            <span class="order-status-badge ${st.cls}">${st.label}</span>
        </div>
        ${o.customer_note ? `<div class="order-note"><i class="fas fa-map-marker-alt"></i> ${o.customer_note}</div>` : ''}
        <div class="order-items-list">${itemsHtml}</div>
        <div class="order-total-row">
            <span>Total</span>
            <strong>${totalFmt}</strong>
        </div>
        ${actionBtns}
    </div>`;
}

async function convertOrderToSale(orderId) {
    if (!confirm('¿Convertir este pedido en venta? Se registrará en el historial de ventas.')) return;
    const { data: order, error } = await _supabase.from('umamii_orders').select('*').eq('id', orderId).single();
    if (error || !order) { alert('No se pudo obtener el pedido'); return; }

    const items = Array.isArray(order.items) ? order.items : [];
    const salesInsert = [];

    for (const item of items) {
        const { data: dbProd } = await _supabase.from('umamii_products').select('id').eq('name', item.name).single();
        salesInsert.push({
            product_id:  dbProd?.id || null,
            quantity:    item.quantity,
            total_price: item.price * item.quantity,
            notes:       dbProd ? 'Pedido web' : item.name
        });
    }

    const { error: saleErr } = await _supabase.from('umamii_sales').insert(salesInsert);
    if (saleErr) { alert('Error al registrar venta: ' + saleErr.message); return; }

    await _supabase.from('umamii_orders').update({ status: 'confirmed' }).eq('id', orderId);
    loadOrders();
    loadStats();
    updateOrderBadge();
}

async function rejectOrder(orderId) {
    if (!confirm('¿Rechazar este pedido?')) return;
    await _supabase.from('umamii_orders').update({ status: 'rejected' }).eq('id', orderId);
    loadOrders();
    updateOrderBadge();
}

function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60)  return 'hace un momento';
    if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
    return `hace ${Math.floor(seconds / 86400)} días`;
}

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
    if (currentFilter === 'custom') {
        const s = customRangeFrom ? new Date(customRangeFrom + 'T00:00:00') : new Date();
        const e = customRangeTo   ? new Date(customRangeTo   + 'T23:59:59') : new Date();
        if (!customRangeTo) e.setHours(23, 59, 59, 999);
        return { start: s.toISOString(), end: e.toISOString() };
    }
    const now = new Date();
    let start, end;
    if (currentFilter === 'day') {
        start = new Date(now); start.setDate(start.getDate() + periodOffset); start.setHours(0, 0, 0, 0);
        end   = new Date(start); end.setHours(23, 59, 59, 999);
    } else if (currentFilter === 'week') {
        const dow = (now.getDay() || 7) - 1; // 0=Mon
        start = new Date(now); start.setDate(now.getDate() - dow + periodOffset * 7); start.setHours(0, 0, 0, 0);
        end   = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
    } else if (currentFilter === 'month') {
        start = new Date(now.getFullYear(), now.getMonth() + periodOffset, 1);
        end   = new Date(now.getFullYear(), now.getMonth() + periodOffset + 1, 0, 23, 59, 59, 999);
    } else { // year
        start = new Date(now.getFullYear() + periodOffset, 0, 1);
        end   = new Date(now.getFullYear() + periodOffset, 11, 31, 23, 59, 59, 999);
    }
    return { start: start.toISOString(), end: end.toISOString() };
}

function getPeriodLabel() {
    if (currentFilter === 'custom') {
        if (customRangeFrom && customRangeTo) return `${customRangeFrom} → ${customRangeTo}`;
        return 'Rango personalizado';
    }
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const fullMonths = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const now = new Date();
    if (currentFilter === 'day') {
        const d = new Date(now); d.setDate(d.getDate() + periodOffset);
        if (periodOffset === 0) return 'Hoy — ' + d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
        if (periodOffset === -1) return 'Ayer — ' + d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
        return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (currentFilter === 'week') {
        const dow = (now.getDay() || 7) - 1;
        const s = new Date(now); s.setDate(now.getDate() - dow + periodOffset * 7); s.setHours(0,0,0,0);
        const e = new Date(s); e.setDate(s.getDate() + 6);
        return `${s.getDate()} ${months[s.getMonth()]} – ${e.getDate()} ${months[e.getMonth()]} ${e.getFullYear()}`;
    }
    if (currentFilter === 'month') {
        const d = new Date(now.getFullYear(), now.getMonth() + periodOffset, 1);
        return `${fullMonths[d.getMonth()]} ${d.getFullYear()}`;
    }
    return String(now.getFullYear() + periodOffset);
}

function updatePeriodLabel() {
    const lbl = document.getElementById('period-label');
    if (lbl) lbl.textContent = getPeriodLabel();
    // Hide nav arrows in custom mode
    const nav = document.getElementById('period-nav');
    if (nav) nav.style.visibility = currentFilter === 'custom' ? 'hidden' : 'visible';
}

function shiftPeriod(dir) {
    if (currentFilter === 'custom') return;
    periodOffset += dir;
    loadStats();
}

function applyCustomRange() {
    const from = document.getElementById('range-from').value;
    const to   = document.getElementById('range-to').value;
    if (!from || !to) { alert('Selecciona ambas fechas para aplicar el rango.'); return; }
    if (from > to) { alert('La fecha de inicio debe ser anterior a la fecha final.'); return; }
    customRangeFrom = from;
    customRangeTo   = to;
    loadStats();
}

function setFilter(f) {
    currentFilter = f;
    periodOffset  = 0;
    document.querySelectorAll('.time-filters .filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.filter === f);
    });
    // Show/hide custom range panel
    const panel = document.getElementById('custom-range-panel');
    if (panel) panel.classList.toggle('hidden', f !== 'custom');
    // Pre-fill today's dates when switching to custom
    if (f === 'custom') {
        const today = new Date().toISOString().split('T')[0];
        const fromEl = document.getElementById('range-from');
        const toEl   = document.getElementById('range-to');
        if (fromEl && !fromEl.value) fromEl.value = today;
        if (toEl   && !toEl.value)   toEl.value   = today;
    }
    loadStats();
}

function logout() { window.location.reload(); }
