// shared/api-client.js
const API_BASE = "http://localhost:3000";

function getAuthHeaders() {
    const headers = { "Content-Type": "application/json" };
    // Check both storages to support both React (localStorage) and Electron (sessionStorage)
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

async function handleResponse(res) {
    const text = await res.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        // not JSON, ignore
    }

    if (!res.ok) {
        const msg = (data && data.message) || text || `Request failed with status ${res.status}`;
        throw new Error(msg);
    }
    return data;
}

// --- AUTH ---

export async function login({ email, password }) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
}

export async function register({ email, password }) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
}

// --- ITEMS ---

export async function getItems(search) {
    const url = search
        ? `${API_BASE}/api/items?search=${encodeURIComponent(search)}`
        : `${API_BASE}/api/items`;

    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(res);
}

export async function addItem(item) {
    const res = await fetch(`${API_BASE}/api/items`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(item),
    });
    return handleResponse(res);
}

export async function adjustItem(id, changeAmount) {
    const res = await fetch(`${API_BASE}/api/items/${id}/adjust`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ change_amount: changeAmount }),
    });
    return handleResponse(res);
}

export async function deleteItem(id) {
    const res = await fetch(`${API_BASE}/api/items/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Delete failed with status ${res.status}`);
    }
}

// --- EXPORT (NEW) ---

export async function exportItems() {
    // If your backend route is /api/export
    const res = await fetch(`${API_BASE}/api/export`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        throw new Error("Failed to download export file");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory.csv";
    document.body.appendChild(a);
    a.click();
    
    a.remove();
    window.URL.revokeObjectURL(url);
}