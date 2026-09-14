import { useEffect, useMemo, useState } from "react";
import { createItem, fetchItems } from "./api";
import "./styles.css";

const categoryIcons = { 衣物: "👗", 鞋子: "👟", 日用品: "🧴", 食品: "🥫" };
const cardColors = ["yellow", "blue", "pink", "green"];

function ItemCard({ item, index }) {
  const detail = item.notes || (item.expected_usage_days ? `預計使用 ${item.expected_usage_days} 天` : "尚未新增說明");
  return (
    <article className="item-card">
      <div className={`item-image ${cardColors[index % cardColors.length]}`}>{categoryIcons[item.category] || "📦"}</div>
      <div className="item-info">
        <div className="item-heading"><span className="category">{item.category}</span><button aria-label={`編輯${item.name}`} type="button">•••</button></div>
        <h2>{item.name}</h2><p>{detail}</p>
        <div className="quantity"><span>庫存數量</span><strong>{item.quantity}</strong></div>
      </div>
    </article>
  );
}

function AddItemModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", category: "衣物", quantity: 1, notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault(); setSubmitting(true); setError("");
    try {
      await createItem({ ...form, name: form.name.trim(), quantity: Number(form.quantity), notes: form.notes.trim() || null, attributes: {} });
      onCreated();
    } catch {
      setError("新增失敗，請確認後端服務是否正常運作。"); setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="add-item-title">
        <div className="modal-header"><div><p className="eyebrow">NEW ITEM</p><h2 id="add-item-title">新增物品</h2></div><button className="close-button" onClick={onClose} type="button" aria-label="關閉">×</button></div>
        <form onSubmit={handleSubmit}>
          <label>物品名稱<input name="name" value={form.name} onChange={updateField} maxLength="200" placeholder="例如：黃色洋裝" required autoFocus /></label>
          <div className="form-row">
            <label>分類<select name="category" value={form.category} onChange={updateField}><option>衣物</option><option>鞋子</option><option>日用品</option><option>食品</option><option>其他</option></select></label>
            <label>數量<input name="quantity" value={form.quantity} onChange={updateField} type="number" min="0" required /></label>
          </div>
          <label>備註（選填）<textarea name="notes" value={form.notes} onChange={updateField} maxLength="2000" placeholder="顏色、用途或其他說明…" rows="3" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions"><button className="secondary-button" onClick={onClose} type="button">取消</button><button className="primary-button" disabled={submitting} type="submit">{submitting ? "新增中…" : "新增物品"}</button></div>
        </form>
      </section>
    </div>
  );
}

export function App() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("loading");
  const [formOpen, setFormOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const data = await fetchItems({ search, category, signal: controller.signal });
        setItems(data); setStatus("success");
      } catch (error) {
        if (error.name !== "AbortError") setStatus("error");
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, category, reloadKey]);

  function handleCreated() {
    setFormOpen(false); setReloadKey((key) => key + 1);
  }

  const stats = useMemo(() => ({
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    categories: new Set(items.map((item) => item.category)).size,
    lowStock: items.filter((item) => item.quantity <= 1).length,
  }), [items]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span>◈</span> SmartStock</div>
        <nav aria-label="主要選單"><a className="active" href="#inventory">▦ 我的物品</a><a href="#decision">✦ 購買建議</a><a href="#reminders">◷ 補貨提醒</a></nav>
        <div className="sidebar-tip"><span>💡</span><p>先記錄已有物品，AI 才能提供更準確的購買建議。</p></div>
      </aside>
      <main className="content" id="inventory">
        <header className="page-header"><div><p className="eyebrow">MY INVENTORY</p><h1>我的物品</h1><p>清楚掌握擁有的東西，避免重複購買。</p></div><button className="primary-button" onClick={() => setFormOpen(true)} type="button">＋ 新增物品</button></header>
        <section className="stats" aria-label="庫存摘要">
          <article><span>庫存總數</span><strong>{stats.totalQuantity}</strong><small>共 {stats.categories} 個種類</small></article>
          <article><span>低庫存物品</span><strong>{stats.lowStock}</strong><small className="warning">數量為 1 以下</small></article>
          <article><span>目前項目</span><strong>{items.length}</strong><small>資料來自 PostgreSQL</small></article>
        </section>
        <section className="inventory-panel">
          <div className="toolbar">
            <label className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="搜尋物品" placeholder="搜尋物品名稱…" /></label>
            <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="依分類篩選"><option value="all">所有分類</option><option>衣物</option><option>鞋子</option><option>日用品</option><option>食品</option></select>
          </div>
          {status === "loading" && <div className="state-message">正在載入庫存…</div>}
          {status === "error" && <div className="state-message error">無法連接後端，請確認 Docker 服務是否正在執行。</div>}
          {status === "success" && items.length === 0 && <div className="state-message"><strong>目前沒有符合的物品</strong><span>可以調整搜尋條件，或新增第一件物品。</span></div>}
          {status === "success" && items.length > 0 && <div className="item-grid">{items.map((item, index) => <ItemCard item={item} index={index} key={item.id} />)}</div>}
        </section>
      </main>
      {formOpen && <AddItemModal onClose={() => setFormOpen(false)} onCreated={handleCreated} />}
    </div>
  );
}
