// --- Configuration ---
const API_BASE = 'http://localhost:3000/api';

// --- DOM Element Cache ---
// Caching elements improves performance by avoiding repeated DOM lookups.
const dom = {
    // Auth
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    loginBtn: document.getElementById('loginBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    authSection: document.getElementById('authSection'),
    logoutSection: document.getElementById('logoutSection'),
    authStatus: document.getElementById('authStatus'),
    authResult: document.getElementById('authResult'),
    
    // Main Manager
    inventoryManager: document.getElementById('inventoryManager'),

    // Add Item
    itemNameInput: document.getElementById('itemName'),
    itemCategoryInput: document.getElementById('itemCategory'),
    itemRestockInput: document.getElementById('itemRestock'),
    addItemBtn: document.getElementById('addItemBtn'),
    addItemResult: document.getElementById('addItemResult'),

    // Adjust Stock
    adjustIdInput: document.getElementById('adjustId'),
    adjustAmountInput: document.getElementById('adjustAmount'),
    sellBtn: document.getElementById('sellBtn'),
    restockBtn: document.getElementById('restockBtn'),
    adjustResult: document.getElementById('adjustResult'),

    // List Items
    searchTermInput: document.getElementById('searchTerm'),
    listItemsBtn: document.getElementById('listItemsBtn'),
    listStatus: document.getElementById('listStatus'),
    itemsTable: document.getElementById('itemsTable'),
    itemsTbody: document.getElementById('itemsTbody'),
};

// --- Helper Functions ---
function displayResult(element, data) {
    element.textContent = JSON.stringify(data, null, 2);
}

function escapeHtml(str) {
    if (typeof str !== 'string') return str || '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = sessionStorage.getItem('authToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// --- UI Update Functions ---
function updateUIForLogin() {
    dom.authStatus.textContent = 'Logged In';
    dom.authResult.textContent = 'Login successful. 👍';
    dom.authSection.classList.add('hidden');
    dom.logoutSection.classList.remove('hidden');
    dom.inventoryManager.classList.remove('hidden');
}

function updateUIForLogout() {
    dom.authStatus.textContent = 'Logged Out';
    dom.authResult.textContent = 'You have been logged out.';
    dom.authSection.classList.remove('hidden');
    dom.logoutSection.classList.add('hidden');
    dom.inventoryManager.classList.add('hidden');
    dom.itemsTable.classList.add('hidden');
    dom.listStatus.textContent = 'Logged out. Please log in to view items.';
}

// --- API Call Functions ---
async function login() {
    const email = dom.emailInput.value;
    const password = dom.passwordInput.value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const result = await response.json();
        displayResult(dom.authResult, result);

        if (result.token) {
            sessionStorage.setItem('authToken', result.token);
            updateUIForLogin();
            listItems(); // Automatically load items after login
        }
    } catch (error) {
        displayResult(dom.authResult, { status: 'error', message: 'Network error: ' + error.message });
    }
}

function logout() {
    sessionStorage.removeItem('authToken');
    updateUIForLogout();
}

async function addItem() {
    const name = dom.itemNameInput.value;
    const category = dom.itemCategoryInput.value;
    const restock_level = parseInt(dom.itemRestockInput.value, 10);

    try {
        const response = await fetch(`${API_BASE}/items`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name, category, restock_level })
        });

        const result = await response.json();

        // If backend reports an error, show a simple friendly message
        if (!response.ok || result.status === 'error') {
            dom.addItemResult.textContent = `Error. ${result.message}`;
        } else {
            // For success, you can still use the pretty JSON renderer
            displayResult(dom.addItemResult, result);
            listItems(); // Refresh list on success
        }
    } catch (error) {
        dom.addItemResult.textContent = `Error. Network error: ${error.message}`;
    }
}

async function deleteItem(itemId) {
    if (!confirm(`Are you sure you want to delete this item? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/items/${itemId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            alert('Item deleted successfully.');
            listItems(); // Refresh list on success
        } else {
            const result = await response.json();
            alert(`Error deleting item: ${result.message}`);
        }
    } catch (error) {
        alert(`Network error: ${error.message}`);
    }
}

async function adjustStock(isSale) {
    const id = dom.adjustIdInput.value;
    const amount = parseInt(dom.adjustAmountInput.value, 10);
    
    if (!id || isNaN(amount) || amount <= 0) {
        displayResult(dom.adjustResult, { status: 'error', message: 'Item ID and a valid, positive Amount are required.' });
        return;
    }

    const change_amount = isSale ? -amount : amount;

    try {
        const response = await fetch(`${API_BASE}/items/${id}/adjust`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ change_amount })
        });
        const result = await response.json();
        displayResult(dom.adjustResult, result);
        
        if (response.ok) {
            listItems(); // Refresh list on success
        }
    } catch (error) {
        displayResult(dom.adjustResult, { status: 'error', message: 'Network error: ' + error.message });
    }
}

async function listItems() {
    const searchTerm = dom.searchTermInput.value;
    dom.listStatus.textContent = 'Requesting data...';
    dom.itemsTable.classList.add('hidden');
    dom.itemsTbody.innerHTML = '';

    const url = searchTerm ? `${API_BASE}/items?search=${encodeURIComponent(searchTerm)}` : `${API_BASE}/items`;

    try {
        const response = await fetch(url, { headers: getAuthHeaders() });
        const result = await response.json();

        if (!response.ok) {
            dom.listStatus.textContent = `Error: ${result.message || 'Failed to fetch items.'}`;
            return;
        }

        renderItemsTable(result.data);

    } catch (error) {
        dom.listStatus.textContent = 'Network error: ' + error.message;
        dom.itemsTable.classList.add('hidden');
    }
}

function renderItemsTable(items) {
    if (!Array.isArray(items) || items.length === 0) {
        dom.itemsTbody.innerHTML = '';
        dom.itemsTable.classList.add('hidden');
        dom.listStatus.textContent = 'No items found.';
        return;
    }

    dom.itemsTbody.innerHTML = items.map(item => `
        <tr>
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.category)}</td>
            <td>${item.stock_quantity}</td>
            <td>${item.restock_level}</td>
            <td>${new Date(item.last_updated).toLocaleString()}</td>
            <td style="font-family:monospace; font-size:0.9em; cursor: pointer;" title="Click to copy ID" onclick="navigator.clipboard.writeText('${item.id}'); alert('ID Copied!');">${item.id}</td>
            <td><button class="delete-btn" data-id="${item.id}">Delete</button></td>
        </tr>
    `).join('');

    dom.listStatus.textContent = `Showing ${items.length} item(s)`;
    dom.itemsTable.classList.remove('hidden');

    // Add event listeners to the new delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            deleteItem(event.target.dataset.id);
        });
    });

    // Auto-fill the adjustment ID with the first item's ID for quick testing
    if (items.length > 0 && (!dom.adjustIdInput.value || !items.find(i => i.id === dom.adjustIdInput.value))) {
        dom.adjustIdInput.value = items[0].id;
    }
}

// --- Event Listeners ---
// The 'defer' attribute in the <script> tag ensures this code runs after the DOM is fully parsed.
function initialize() {
    // Auth
    dom.loginBtn.addEventListener('click', login);
    dom.logoutBtn.addEventListener('click', logout);

    // Actions
    dom.addItemBtn.addEventListener('click', addItem);
    dom.sellBtn.addEventListener('click', () => adjustStock(true));
    dom.restockBtn.addEventListener('click', () => adjustStock(false));
    dom.listItemsBtn.addEventListener('click', listItems);
    
    // Live search on keyup
    let searchTimeout;
    dom.searchTermInput.addEventListener('keyup', () => {
        clearTimeout(searchTimeout);
        // Debounce the search to avoid excessive API calls
        searchTimeout = setTimeout(listItems, 300); 
    });

    // Initial check on page load
    if (sessionStorage.getItem('authToken')) {
        updateUIForLogin();
        listItems(); // Load items if already logged in
    } else {
        updateUIForLogout();
    }
}

// Initialize the application
initialize();
