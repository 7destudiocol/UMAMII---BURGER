// Supabase Configuration
const SUPABASE_URL = 'https://gvdvgjredmqojtsogrkn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2ZHZnanJlZG1xb2p0c29ncmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzA0MDYsImV4cCI6MjA4Nzk0NjQwNn0.LFBqn7gz1HWSnULa3uC9N_MHg1BiUFoUzG_MF_BtntA';

let _supabase = null;

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
        errorMsg.innerText = 'Contraseña incorrecta. Inténtalo de nuevo.';
        errorMsg.style.color = 'var(--error)';
    }
}

// Dashboard Navigation
function showTab(tabId) {
    // Update Nav
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // Update Content
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');

    loadTabData(tabId);
}

// Data Loading Registry
async function initDashboard() {
    initSupabase();
    loadStats();
    loadTabData('stats');
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

// --- Stats Logic ---
async function loadStats() {
    if (!_supabase) return;

    // Fetch Income
    const { data: salesData } = await _supabase.from('sales').select('total_price');
    const income = salesData ? salesData.reduce((acc, s) => acc + parseFloat(s.total_price), 0) : 0;

    // Fetch Expenses
    const { data: expensesData } = await _supabase.from('expenses').select('amount');
    const expenses = expensesData ? expensesData.reduce((acc, e) => acc + parseFloat(e.amount), 0) : 0;
    
    document.getElementById('total-income-val').innerText = `$${income.toLocaleString()}`;
    document.getElementById('total-expenses-val').innerText = `$${expenses.toLocaleString()}`;
    document.getElementById('cash-flow-val').innerText = `$${(income - expenses).toLocaleString()}`;

    await renderChart();
}

async function renderChart() {
    // Using the view created in the SQL schema
    const { data: summary, error } = await _supabase
        .from('product_sales_summary')
        .select('*');
    
    if (error) console.error("Error loading chart data:", error);

    const labels = summary && summary.length > 0 ? summary.map(s => s.name) : ['Sin datos'];
    const values = summary && summary.length > 0 ? summary.map(s => s.total_sold) : [0];

    const ctx = document.getElementById('topProductsChart').getContext('2d');
    
    if (window.myChart) window.myChart.destroy();

    window.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Unidades Vendidas',
                data: values,
                backgroundColor: 'rgba(255, 204, 0, 0.6)',
                borderColor: '#ffcc00',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// --- Sales Management ---
async function loadSales() {
    const { data, error } = await _supabase
        .from('sales')
        .select('*, products(name)')
        .order('sale_date', { ascending: false });

    if (error) return console.error(error);

    const tbody = document.querySelector('#sales-table tbody');
    tbody.innerHTML = data.map(s => `
        <tr>
            <td>${new Date(s.sale_date).toLocaleDateString()}</td>
            <td>${s.products ? s.products.name : 'Desconocido'}</td>
            <td>${s.quantity}</td>
            <td>$${parseFloat(s.total_price).toLocaleString()}</td>
            <td>${s.notes || ''}</td>
        </tr>
    `).join('');
}

// --- Expenses Management ---
async function loadExpenses() {
    const { data, error } = await _supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

    if (error) return console.error(error);

    const tbody = document.querySelector('#expenses-table tbody');
    tbody.innerHTML = data.map(e => `
        <tr>
            <td>${new Date(e.expense_date).toLocaleDateString()}</td>
            <td>${e.description}</td>
            <td>${e.category}</td>
            <td>$${parseFloat(e.amount).toLocaleString()}</td>
        </tr>
    `).join('');
}

// --- Product Management ---
async function loadProducts() {
    const { data, error } = await _supabase
        .from('products')
        .select('*')
        .order('category', { ascending: true });

    if (error) return console.error(error);

    const tbody = document.querySelector('#products-table tbody');
    tbody.innerHTML = data.map(p => `
        <tr>
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td>$${parseFloat(p.price).toLocaleString()}</td>
            <td><button class="delete-btn" onclick="deleteProduct('${p.id}')">Eliminar</button></td>
        </tr>
    `).join('');
}

// --- Modal Logic ---
async function openModal(type) {
    const container = document.getElementById('modal-container');
    const fields = document.getElementById('dynamic-fields');
    const title = document.getElementById('modal-title');
    
    container.classList.remove('hidden');
    fields.innerHTML = '';

    if (type === 'sale') {
        const { data: products } = await _supabase.from('products').select('id, name');
        title.innerText = 'Registrar Nueva Venta';
        fields.innerHTML = `
            <select id="sale-product">${products.map(p => `<option value="${p.id}">${p.name}</option>`)}</select>
            <input type="number" id="sale-qty" placeholder="Cantidad" value="1">
            <input type="text" id="sale-notes" placeholder="Notas (Ej: Domicilio)">
        `;
    } else if (type === 'expense') {
        title.innerText = 'Registrar Nuevo Gasto';
        fields.innerHTML = `
            <input type="text" id="exp-desc" placeholder="Descripción">
            <input type="text" id="exp-cat" placeholder="Categoría (Ej: Insumos)">
            <input type="number" id="exp-amount" placeholder="Monto">
        `;
    } else if (type === 'product') {
        title.innerText = 'Nuevo Producto';
        fields.innerHTML = `
            <input type="text" id="prod-name" placeholder="Nombre">
            <input type="text" id="prod-cat" placeholder="Categoría">
            <input type="number" id="prod-price" placeholder="Precio">
        `;
    }
}

// --- Product Management ---
async function deleteProduct(id) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    
    const { error } = await _supabase.from('products').delete().eq('id', id);
    if (error) alert('Error al eliminar: ' + error.message);
    else loadProducts();
}

// --- Form Submission ---
document.getElementById('admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('modal-title').innerText;
    
    if (title.includes('Venta')) {
        const productId = document.getElementById('sale-product').value;
        const qty = parseInt(document.getElementById('sale-qty').value);
        const notes = document.getElementById('sale-notes').value;

        // Fetch product price
        const { data: prod } = await _supabase.from('products').select('price').eq('id', productId).single();
        const total = prod.price * qty;

        const { error } = await _supabase.from('sales').insert([
            { product_id: productId, quantity: qty, total_price: total, notes: notes }
        ]);
        if (error) alert(error.message);
        else { closeModal(); loadSales(); loadStats(); }

    } else if (title.includes('Gasto')) {
        const desc = document.getElementById('exp-desc').value;
        const cat = document.getElementById('exp-cat').value;
        const amount = parseFloat(document.getElementById('exp-amount').value);

        const { error } = await _supabase.from('expenses').insert([
            { description: desc, category: cat, amount: amount }
        ]);
        if (error) alert(error.message);
        else { closeModal(); loadExpenses(); loadStats(); }

    } else if (title.includes('Producto')) {
        const name = document.getElementById('prod-name').value;
        const cat = document.getElementById('prod-cat').value;
        const price = parseFloat(document.getElementById('prod-price').value);

        const { error } = await _supabase.from('products').insert([
            { name: name, category: cat, price: price }
        ]);
        if (error) alert(error.message);
        else { closeModal(); loadProducts(); }
    }
});

function closeModal() {
    document.getElementById('modal-container').classList.add('hidden');
}

// --- CSV Export ---
async function exportDataToCSV() {
    const { data: sales } = await _supabase.from('sales').select('*, products(name)');
    const { data: expenses } = await _supabase.from('expenses').select('*');

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Fecha,Concepto,Monto\n";
    
    sales.forEach(s => {
        csvContent += `${new Date(s.sale_date).toLocaleDateString()},Venta: ${s.products.name},${s.total_price}\n`;
    });
    expenses.forEach(e => {
        csvContent += `${new Date(e.expense_date).toLocaleDateString()},Gasto: ${e.description},-${e.amount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `umami_contabilidad_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
}

function logout() {
    window.location.reload();
}
