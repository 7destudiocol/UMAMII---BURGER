// Supabase Configuration
const SUPABASE_URL = 'https://gvdvgjredmqojtsogrkn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2ZHZnanJlZG1xb2p0c29ncmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzA0MDYsImV4cCI6MjA4Nzk0NjQwNn0.LFBqn7gz1HWSnULa3uC9N_MHg1BiUFoUzG_MF_BtntA';

// State
let _supabase = null;
let currentFilter = 'day';
let posCart = {}; 

// Initialize Supabase
function initSupabase() {
    _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Password Protection
function checkAdminPassword() {
    const pass = document.getElementById('admin-pass').value;
    const errorMsg = document.getElementById('login-error');
    if (pass === 'GORDO123') {
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.remove('hidden');
        initDashboard();
    } else {
        errorMsg.innerText = 'Contraseña incorrecta.';
        errorMsg.style.color = 'var(--error)';
    }
}

async function initDashboard() {
    initSupabase();
    await syncMenuWithDB();
    loadStats();
    initPosCategories();
}

// Dashboard Navigation
function showTab(tabId) {
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    loadTabData(tabId);
}

async function loadTabData(tabId) {
    if (!_supabase) return;
    switch(tabId) {
        case 'sales': await loadSales(); break;
        case 'expenses': await loadExpenses(); break;
        case 'products': await loadProducts(); break;
        case 'stats': await loadStats(); break;
    }
}

// Stats & Charts
async function loadStats() {
    if (!_supabase) return;
    const startDate = getDateRange();

    const { data: sales } = await _supabase.from('sales').select('*, products(name)').gte('sale_date', startDate);
    const { data: others } = await _supabase.from('other_income').select('*').gte('income_date', startDate);
    const { data: expenses } = await _supabase.from('expenses').select('*').gte('expense_date', startDate);

    const totalSales = sales ? sales.reduce((acc, s) => acc + parseFloat(s.total_price), 0) : 0;
    const totalOthers = others ? others.reduce((acc, o) => acc + parseFloat(o.amount), 0) : 0;
    const totalExpenses = expenses ? expenses.reduce((acc, e) => acc + parseFloat(e.amount), 0) : 0;

    const totalIncome = totalSales + totalOthers;
    
    document.getElementById('total-income-val').innerText = `$${totalIncome.toLocaleString()}`;
    document.getElementById('total-expenses-val').innerText = `$${totalExpenses.toLocaleString()}`;
    document.getElementById('cash-flow-val').innerText = `$${(totalIncome - totalExpenses).toLocaleString()}`;

    loadMonthlyFlow();
}

async function loadMonthlyFlow() {
    const { data: monthlyData } = await _supabase.from('monthly_cash_flow').select('*');
    if (!monthlyData) return;
    renderMainChart(monthlyData);
    renderMonthlyTable(monthlyData);
}

function renderMainChart(data) {
    const ctx = document.getElementById('mainFlowChart').getContext('2d');
    if (window.mainChart) window.mainChart.destroy();

    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const labels = data.map(d => months[new Date(d.month).getUTCMonth()]);
    
    let cumulative = 0;
    const netAccumulated = data.map(d => {
        cumulative += parseFloat(d.cash_flow);
        return cumulative;
    });

    window.mainChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Ingresos', data: data.map(d => d.income), backgroundColor: 'rgba(46, 213, 115, 0.6)', borderRadius: 8 },
                { label: 'Gastos', data: data.map(d => d.expenses), backgroundColor: 'rgba(255, 71, 87, 0.6)', borderRadius: 8 },
                { label: 'Acumulado', data: netAccumulated, type: 'line', borderColor: '#00d2ff', borderWidth: 3, fill: false, tension: 0.4, pointRadius: 4 }
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
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    let cumulative = 0;
    tbody.innerHTML = data.map(d => {
        cumulative += parseFloat(d.cash_flow);
        return `<tr><td>${months[new Date(d.month).getUTCMonth()]}</td><td class="success">$${parseFloat(d.income).toLocaleString()}</td><td class="error">$${parseFloat(d.expenses).toLocaleString()}</td><td class="${d.cash_flow >= 0 ? 'success' : 'error'}">$${parseFloat(d.cash_flow).toLocaleString()}</td><td class="primary"><b>$${cumulative.toLocaleString()}</b></td></tr>`;
    }).join('');
}

// --- Visual POS ---
function initPosCategories() {
    const filter = document.getElementById('pos-cat-filter');
    filter.innerHTML = '<option value="all">Todas las categorías</option>' + 
        menuData.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function openVisualPos() {
    document.getElementById('pos-modal').classList.remove('hidden');
    renderPosProducts('all');
}

function closePosModal() {
    document.getElementById('pos-modal').classList.add('hidden');
    posCart = {};
    updatePosSummary();
}

function renderPosProducts(catId) {
    const grid = document.getElementById('pos-product-grid');
    const filtered = catId === 'all' ? menuData.products : menuData.products.filter(p => p.category === catId);
    grid.innerHTML = filtered.map(p => `
        <div class="pos-card" data-category="${p.category}">
            <img src="assets/img/${p.image || 'Logo (2).webp'}" class="pos-img" onerror="this.src='assets/img/Logo (2).webp'">
            <div class="pos-info"><h4>${p.name}</h4><p class="pos-price">$${p.price.toLocaleString()}</p></div>
            <div class="pos-controls">
                <button class="qty-btn" onclick="updateCart('${p.name}', -1)">-</button>
                <span id="qty-${p.name}" class="qty-val">0</span>
                <button class="qty-btn" onclick="updateCart('${p.name}', 1)">+</button>
            </div>
        </div>
    `).join('');
}

function updateCart(name, delta) {
    if (!posCart[name]) posCart[name] = 0;
    posCart[name] = Math.max(0, posCart[name] + delta);
    const qtyEl = document.getElementById(`qty-${name}`);
    if (qtyEl) qtyEl.innerText = posCart[name];
    updatePosSummary();
}

function updatePosSummary() {
    let total = 0, count = 0;
    Object.entries(posCart).forEach(([name, qty]) => {
        if (qty > 0) {
            const product = menuData.products.find(p => p.name === name);
            total += product.price * qty;
            count += qty;
        }
    });
    document.getElementById('pos-item-count').innerText = count;
    document.getElementById('pos-total-amount').innerText = `$${total.toLocaleString()}`;
}

async function submitPosSale() {
    const sales = [];
    for (const [name, qty] of Object.entries(posCart)) {
        if (qty > 0) {
            const product = menuData.products.find(p => p.name === name);
            const { data: dbProd } = await _supabase.from('products').select('id').eq('name', name).single();
            sales.push({ product_id: dbProd.id, quantity: qty, total_price: product.price * qty, notes: 'Venta POS' });
        }
    }
    if (sales.length === 0) return alert("Selecciona productos");
    const { error } = await _supabase.from('sales').insert(sales);
    if (!error) { alert("Venta exitosa"); closePosModal(); loadStats(); }
}

function filterPosProducts() { renderPosProducts(document.getElementById('pos-cat-filter').value); }

// --- Standard Tab Loaders ---
async function loadSales() {
    const { data } = await _supabase.from('sales').select('*, products(name)').order('sale_date', { ascending: false });
    const tbody = document.querySelector('#sales-table tbody');
    tbody.innerHTML = data?.map(s => `<tr><td>${new Date(s.sale_date).toLocaleDateString()}</td><td>${s.products?.name || 'Varios'}</td><td>${s.quantity}</td><td>$${parseFloat(s.total_price).toLocaleString()}</td><td>${s.notes || ''}</td></tr>`).join('') || '';
}

async function loadExpenses() {
    const { data } = await _supabase.from('expenses').select('*').order('expense_date', { ascending: false });
    const tbody = document.querySelector('#expenses-table tbody');
    tbody.innerHTML = data?.map(e => `<tr><td>${new Date(e.expense_date).toLocaleDateString()}</td><td>${e.description}</td><td>${e.category}</td><td>$${parseFloat(e.amount).toLocaleString()}</td></tr>`).join('') || '';
}

async function loadProducts() {
    const { data } = await _supabase.from('products').select('*').order('category', { ascending: true });
    const tbody = document.querySelector('#products-table tbody');
    tbody.innerHTML = data?.map(p => `<tr><td>${p.name}</td><td>${p.category}</td><td>$${parseFloat(p.price).toLocaleString()}</td><td><button class="delete-btn" onclick="deleteProduct('${p.id}')">Eliminar</button></td></tr>`).join('') || '';
}

async function deleteProduct(id) {
    if (confirm('¿Eliminar producto?')) { await _supabase.from('products').delete().eq('id', id); loadProducts(); }
}

// --- Modals ---
async function openModal(type) {
    const fields = document.getElementById('dynamic-fields');
    document.getElementById('modal-container').classList.remove('hidden');
    if (type === 'expense') {
        document.getElementById('modal-title').innerText = 'Registrar Gasto';
        fields.innerHTML = `<input type="text" id="exp-desc" placeholder="Descripción" required><select id="exp-cat" required><option value="Insumos">Compra de Insumos</option><option value="Servicios">Servicios Públicos</option><option value="Arriendo">Arriendo</option><option value="Administrativo">Administrativo</option><option value="Otros">Otros</option></select><input type="number" id="exp-amount" placeholder="Monto" required>`;
    } else if (type === 'other_income') {
        document.getElementById('modal-title').innerText = 'Registrar Ingreso General';
        fields.innerHTML = `<input type="text" id="inc-desc" placeholder="Descripción" required><input type="number" id="inc-amount" placeholder="Monto" required>`;
    }
}

document.getElementById('admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('modal-title').innerText;
    if (title.includes('Gasto')) {
        await _supabase.from('expenses').insert([{ description: document.getElementById('exp-desc').value, category: document.getElementById('exp-cat').value, amount: parseFloat(document.getElementById('exp-amount').value) }]);
    } else if (title.includes('General')) {
        await _supabase.from('other_income').insert([{ description: document.getElementById('inc-desc').value, amount: parseFloat(document.getElementById('inc-amount').value) }]);
    }
    closeModal(); loadStats();
});

// --- Helpers ---
function getDateRange() {
    let s = new Date(); s.setHours(0,0,0,0);
    if (currentFilter === 'week') s.setHours(-24 * ((s.getDay() || 7) - 1));
    else if (currentFilter === 'month') s.setDate(1);
    else if (currentFilter === 'year') s.setMonth(0, 1);
    return s.toISOString();
}

function setFilter(f) {
    currentFilter = f;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.innerText.toLowerCase().includes(f === 'day' ? 'hoy' : f === 'week' ? 'semana' : f === 'month' ? 'mes' : 'año')));
    loadStats();
}

async function syncMenuWithDB() {
    const { data } = await _supabase.from('products').select('name');
    const existing = new Set(data?.map(p => p.name) || []);
    const news = menuData.products.filter(p => !existing.has(p.name)).map(p => ({ name: p.name, price: p.price, category: menuData.categories.find(c => c.id === p.category)?.name || 'General' }));
    if (news.length > 0) await _supabase.from('products').insert(news);
}

function closeModal() { document.getElementById('modal-container').classList.add('hidden'); }
function logout() { window.location.reload(); }
