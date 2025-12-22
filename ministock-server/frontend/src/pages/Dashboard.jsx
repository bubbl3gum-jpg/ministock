// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { getItems, addItem, adjustItem, deleteItem } from "../api";

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "",
    restock_level: "",
  });
  const [adding, setAdding] = useState(false);

  // adjust state
  const [adjustingId, setAdjustingId] = useState(null);
  const [adjustMode, setAdjustMode] = useState("restock"); // "restock" | "sale"
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);

  // search
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);

  // helper to load items
  async function refreshItems(searchTerm) {
    try {
      if (searchTerm !== undefined) setSearching(true);
      setError("");
      setLoading(true);

      const resp = await getItems(searchTerm);
      const rows = resp?.data || resp?.items || resp || [];
      setItems(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load items");
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }

  useEffect(() => {
    refreshItems();
  }, []);

  // Add item
  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      setAdding(true);
      setError("");

      await addItem({
        name: form.name,
        category: form.category,
        restock_level: Number(form.restock_level) || 0,
      });

      await refreshItems();
      setForm({ name: "", category: "", restock_level: "" });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to add item");
    } finally {
      setAdding(false);
    }
  }

  // Adjust stock
  async function handleAdjustSubmit(e) {
    e.preventDefault();
    if (!adjustingId) return;
    const amt = Number(adjustAmount);
    if (!amt || isNaN(amt)) return;

    const signed =
      adjustMode === "sale" ? -Math.abs(amt) : Math.abs(amt); // sale = negative

    try {
      setAdjustLoading(true);
      setError("");
      await adjustItem(adjustingId, signed);
      await refreshItems();
      setAdjustingId(null);
      setAdjustAmount("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to adjust stock");
    } finally {
      setAdjustLoading(false);
    }
  }

  // Delete item
  async function handleDelete(id, name) {
    if (!window.confirm(`Delete item "${name}"? This cannot be undone.`)) return;

    try {
      setError("");
      await deleteItem(id);
      await refreshItems();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to delete item");
    }
  }

  // Search handler
  async function handleSearch(e) {
    e.preventDefault();
    await refreshItems(search.trim() || undefined);
  }

  return (
    <div className="bubblebiz-card">
      {/* HEADER */}
      <header className="border-b border-white/10 pb-6 mb-2">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          MiniStock Inventory
        </h1>
        <p className="text-sm md:text-base text-white/80">
          Live inventory dashboard – backed by your Express + SQLite server.
        </p>
      </header>

      {/* ERROR BANNER */}
      {error && (
        <div className="rounded-xl bg-red-500/20 border border-red-400/60 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* ADD ITEM CARD */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Add New Item</h2>
        <div className="rounded-2xl bg-black/30 border border-white/10 backdrop-blur-sm p-4 md:p-5">
          <form
            onSubmit={handleAdd}
            className="flex flex-wrap items-center gap-4"
          >
            <input
              className="bg-black/40 border border-white/15 rounded-full px-5 py-3 flex-1 min-w-[150px] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/60"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="bg-black/40 border border-white/15 rounded-full px-5 py-3 flex-1 min-w-[150px] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/60"
              placeholder="Category"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
            />
            <input
              className="bg-black/40 border border-white/15 rounded-full px-5 py-3 w-32 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/60"
              placeholder="Restock level"
              type="number"
              value={form.restock_level}
              onChange={(e) =>
                setForm({ ...form, restock_level: e.target.value })
              }
            />
            <button
              type="submit"
              disabled={adding}
              className="rounded-full px-7 py-3 font-semibold shadow-lg disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(90deg, #7BD5F5 0%, #C86DD7 50%, #FF758C 100%)",
              }}
            >
              {adding ? "Adding..." : "Add Item"}
            </button>
          </form>
        </div>
      </section>

      {/* SEARCH + COUNT */}
      <section className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-xl font-semibold">Current Items</h2>
          <p className="text-xs md:text-sm text-white/70">
            Total: {items.length} item{items.length !== 1 ? "s" : ""}
          </p>
        </div>
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-full px-3 py-1"
        >
          <input
            className="bg-transparent border-none outline-none px-2 py-1 text-xs md:text-sm placeholder:text-white/50"
            placeholder="Search by name or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="submit"
            disabled={searching}
            className="text-xs px-3 py-1 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 disabled:opacity-60"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </form>
      </section>

      {/* TABLE CARD */}
      <section>
        {loading ? (
          <p>Loading items from server…</p>
        ) : items.length === 0 ? (
          <p className="text-white/70">
            No items found. Try clearing search or add a new item above.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-black/30 border border-white/10 backdrop-blur-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3 text-right">Stock</th>
                  <th className="px-6 py-3 text-right">Restock level</th>
                  <th className="px-6 py-3">Last updated</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const stock = item.stock_quantity ?? item.stock ?? 0;
                  const restock = item.restock_level ?? 0;
                  const low = stock <= restock;

                  return (
                    <tr
                      key={item.id || item.item_id || item.name}
                      className={`border-t border-white/5 ${
                        index % 2 === 0 ? "bg-white/0" : "bg-white/[0.03]"
                      }`}
                    >
                     <td className="px-6 py-3 align-middle">
                        <span className="font-medium">{item.name}</span>
                      </td>

                      <td className="px-6 py-3 align-middle">
                        <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs border border-white/10">
                          {item.category || "Uncategorized"}
                        </span>
                      </td>

                      <td
  className={`px-6 py-3 text-right align-middle ${
    low ? "low-stock-text" : ""
  }`}
>
  {stock}
</td>

                      <td className="px-6 py-3 text-right align-middle">
                        {restock}
                      </td>
                      <td className="px-6 py-3 align-middle text-white/70">
                        {item.last_updated
                          ? new Date(item.last_updated).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-6 py-3 text-right align-middle">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setAdjustingId(
                                adjustingId === item.id ? null : item.id
                              );
                              setAdjustAmount("");
                              setAdjustMode("restock");
                            }}
                            className="text-xs px-3 py-1 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"
                          >
                            {adjustingId === item.id ? "Cancel" : "Adjust"}
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="text-xs px-3 py-1 rounded-full border border-red-400/70 bg-red-500/30 hover:bg-red-500/50 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* INLINE ADJUST BAR */}
            {adjustingId && (
              <div className="border-t border-white/10 px-6 py-4 bg-black/40">
                <form
                  onSubmit={handleAdjustSubmit}
                  className="flex flex-wrap items-center gap-4"
                >
                  <span className="text-sm text-white/80">
                    Adjust stock for{" "}
                    <strong>
                      {items.find((i) => i.id === adjustingId)?.name}
                    </strong>
                  </span>
                  <select
                    className="bg-black/60 border border-white/20 rounded-full px-4 py-2 text-sm"
                    value={adjustMode}
                    onChange={(e) => setAdjustMode(e.target.value)}
                  >
                    <option value="restock">Restock (+)</option>
                    <option value="sale">Sale (-)</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    className="bg-black/60 border border-white/20 rounded-full px-4 py-2 w-28 text-sm"
                    placeholder="Qty"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={adjustLoading}
                    className="rounded-full px-6 py-2 text-sm font-semibold shadow disabled:opacity-60"
                    style={{
                      background:
                        "linear-gradient(90deg, #7BD5F5 0%, #C86DD7 50%, #FF758C 100%)",
                    }}
                  >
                    {adjustLoading ? "Saving…" : "Apply"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
