// shared/api-client.js
// Default to same-origin ("") so the web build talks to whatever host serves it
// (works on localhost and on the deployed URL). Native/dev cross-origin builds can
// override by setting VITE_API_BASE at build time (e.g. http://192.168.0.121:3000).
const API_BASE =
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) || "";

console.log("🔥 API CLIENT TARGETING:", API_BASE);

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

    const res = await fetch(`${API_BASE}/api/export`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        throw new Error("Failed to fetch export data");
    }


    return res.text(); 
}