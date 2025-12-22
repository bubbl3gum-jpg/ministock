import React, { useState, useEffect } from "react";
import "./BubbleBiz.css"; 
// We import directly from api-client logic now, bypassing the old pages
import { login, register, getItems, addItem, adjustItem, deleteItem, exportItems } from "./api"; // api.js exports from shared/api-client

export default function App() {
  const [view, setView] = useState("login"); // 'login' | 'register' | 'dashboard'
  
  // Dashboard State
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Forms State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemRestock, setNewItemRestock] = useState("");

  // Adjust Logic
  const [adjustingId, setAdjustingId] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustMode, setAdjustMode] = useState("restock");

  // Check for existing login on load
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setView("dashboard");
      fetchItems();
    }
  }, []);

  // --- Actions ---

  async function handleAuth(e) {
    e.preventDefault();
    setError("");
    try {
      if (view === "login") {
        const data = await login({ email, password });
        localStorage.setItem("authToken", data.token);
        setView("dashboard");
        fetchItems();
      } else {
        // Register flow
        await register({ email, password });
        setView("login");
        setError("Account created! Please log in.");
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem("authToken");
    setItems([]);
    setView("login");
    setEmail("");
    setPassword("");
  }

  async function fetchItems(search = "") {
    try {
      const res = await getItems(search);
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddItem(e) {
    e.preventDefault();
    if (!newItemName) return;
    try {
      await addItem({ 
        name: newItemName, 
        category: newItemCategory, 
        restock_level: parseInt(newItemRestock) || 0 
      });
      setNewItemName(""); setNewItemCategory(""); setNewItemRestock("");
      fetchItems();
    } catch (err) { setError(err.message); }
  }

  async function handleAdjust(e) {
    e.preventDefault();
    if (!adjustAmount || !adjustingId) return;
    const val = parseInt(adjustAmount);
    const change = adjustMode === "sale" ? -val : val;
    try {
      await adjustItem(adjustingId, change);
      setAdjustingId(null); setAdjustAmount("");
      fetchItems();
    } catch (err) { setError(err.message); }
  }

  async function handleDelete(id, name) {
    if(!confirm(`Delete ${name}?`)) return;
    try { await deleteItem(id); fetchItems(); } 
    catch(err) { setError(err.message); }
  }

  // --- RENDER ---

  return (
    <div className="bubblebiz-page">
      <div className="bubbles">
        <div className="bubble bubble1"></div>
        <div className="bubble bubble2"></div>
        <div className="bubble bubble3"></div>
        <div className="bubble bubble4"></div>
      </div>

      {/* AUTH SCREEN (Login & Register) */}
      {(view === "login" || view === "register") && (
        <div className="bubblebiz-card" style={{ maxWidth: "400px" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "10px", textAlign: "center" }}>
            {view === "login" ? "MiniStock Login" : "Create Account"}
          </h1>
          
          <p style={{ textAlign: "center", marginBottom: "20px", color: "rgba(255, 255, 255, 0.8)", fontSize: "0.9rem" }}>
            {view === "login" ? "Please sign in to manage your inventory" : "Join us to get started!"}
          </p>
          
          {error && <div style={{ color: "#ff8888", textAlign: "center", marginBottom: "1rem" }}>{error}</div>}
          
          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <input 
              className="bubblebiz-input" 
              type="email" 
              placeholder="Email" 
              value={email} onChange={e => setEmail(e.target.value)} required 
            />
            <input 
              className="bubblebiz-input" 
              type="password" 
              placeholder="Password" 
              value={password} onChange={e => setPassword(e.target.value)} required 
            />
            
            <button type="submit" className="bubblebiz-button">
              {view === "login" ? "Sign In" : "Register"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1rem", color: "rgba(255,255,255,0.7)" }}>
            {view === "login" ? "New here?" : "Already have an account?"}
            <button 
              onClick={() => { setError(""); setView(view === "login" ? "register" : "login"); }}
              style={{ background: "none", border: "none", color: "#7BD5F5", cursor: "pointer", marginLeft: "5px", textDecoration: "underline" }}
            >
              {view === "login" ? "Register" : "Login"}
            </button>
          </p>
        </div>
      )}

      {/* DASHBOARD SCREEN */}
      {view === "dashboard" && (
        <div className="bubblebiz-card">
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "20px", marginBottom: "20px" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "2.5rem" }}>MiniStock Inventory</h1>
              <p style={{ margin: 0, opacity: 0.8 }}>Manage your items</p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={exportItems} className="bubblebiz-button" style={{ background: "rgba(34, 197, 94, 0.2)", border: "1px solid rgba(34, 197, 94, 0.5)", color: "#dcfce7" }}>
                Export CSV
              </button>
              <button onClick={handleLogout} className="bubblebiz-button" style={{ background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.5)", color: "#fee2e2" }}>
                Sign Out
              </button>
            </div>
          </header>

          <div style={{ background: "rgba(0,0,0,0.3)", padding: "20px", borderRadius: "16px", marginBottom: "20px" }}>
            <h3 style={{ marginTop: 0 }}>Add New Item</h3>
            <form onSubmit={handleAddItem} style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <input className="bubblebiz-input" style={{ flex: 1, minWidth: "150px" }} placeholder="Name" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
              <input className="bubblebiz-input" style={{ flex: 1, minWidth: "150px" }} placeholder="Category" value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} />
              <input className="bubblebiz-input" style={{ width: "120px" }} type="number" placeholder="Restock" value={newItemRestock} onChange={e => setNewItemRestock(e.target.value)} />
              <button type="submit" className="bubblebiz-button">Add</button>
            </form>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h3>Current Items ({items.length})</h3>
            <input 
              className="bubblebiz-input" 
              style={{ width: "250px", padding: "8px 16px" }} 
              placeholder="Search..." 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); fetchItems(e.target.value); }}
            />
          </div>

          <div style={{ overflowX: "auto", background: "rgba(0,0,0,0.3)", borderRadius: "16px" }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Restock Lvl</th>
                  <th>Last Updated</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ background: "rgba(255,255,255,0.02)" }}>
                    <td><strong>{item.name}</strong></td>
                    <td><span style={{ background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "12px", fontSize: "0.8em" }}>{item.category}</span></td>
                    <td style={{ color: item.stock_quantity <= item.restock_level ? "#ff6b6b" : "white", fontWeight: "bold" }}>{item.stock_quantity}</td>
                    <td>{item.restock_level}</td>
                    <td style={{ opacity: 0.7, fontSize: "0.9em" }}>{new Date(item.last_updated).toLocaleString()}</td>
                    <td style={{ textAlign: "right" }}>
                      <button 
                        onClick={() => setAdjustingId(adjustingId === item.id ? null : item.id)}
                        style={{ marginRight: "10px", padding: "5px 10px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "white", cursor: "pointer" }}
                      >
                        Adjust
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id, item.name)}
                        style={{ padding: "5px 10px", borderRadius: "20px", border: "1px solid rgba(255,100,100,0.5)", background: "rgba(255,0,0,0.2)", color: "white", cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {adjustingId && (
              <div style={{ padding: "15px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "10px" }}>
                 <span>Adjust Stock:</span>
                 <select className="bubblebiz-input" style={{ width: "auto" }} value={adjustMode} onChange={e => setAdjustMode(e.target.value)}>
                   <option value="restock">Add Stock (+)</option>
                   <option value="sale">Sale (-)</option>
                 </select>
                 <input className="bubblebiz-input" style={{ width: "100px" }} type="number" placeholder="Qty" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} />
                 <button className="bubblebiz-button" onClick={handleAdjust}>Save</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}