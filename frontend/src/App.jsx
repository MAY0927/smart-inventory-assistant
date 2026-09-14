import { useEffect, useMemo, useState } from "react";
import { createItem, deleteItem, evaluatePurchase, fetchItems, updateItem } from "./api";
import "./styles.css";

const categoryIcons = { 衣物: "👗", 鞋子: "👟", 日用品: "🧴", 食品: "🥫" };
const cardColors = ["yellow", "blue", "pink", "green"];

function ItemCard({ item, index, onEdit, onDelete }) {
  const detail = item.notes || (item.expected_usage_days ? `預計使用 ${item.expected_usage_days} 天` : "尚未新增說明");
  return (
    <article className="item-card">
      <div className={`item-image ${cardColors[index % cardColors.length]}`}>{categoryIcons[item.category] || "📦"}</div>
      <div className="item-info">
        <div className="item-heading"><span className="category">{item.category}</span><div className="card-actions"><button onClick={() => onEdit(item)} aria-label={`編輯${item.name}`} title="編輯" type="button">✎</button><button onClick={() => onDelete(item)} aria-label={`刪除${item.name}`} title="刪除" type="button">×</button></div></div>
        <h2>{item.name}</h2><p>{detail}</p>
        <div className="quantity"><span>庫存數量</span><strong>{item.quantity}</strong></div>
      </div>
    </article>
  );
}

function AddItemModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", category: "衣物", quantity: 1, notes: "", color: "", style: "", material: "", purpose: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault(); setSubmitting(true); setError("");
    try {
      const attributes = Object.fromEntries(["color", "style", "material", "purpose"].filter((key) => form[key].trim()).map((key) => [key, form[key].trim()]));
      await createItem({ name: form.name.trim(), category: form.category, quantity: Number(form.quantity), notes: form.notes.trim() || null, attributes });
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
          <div className="feature-grid">
            <label>顏色<input name="color" value={form.color} onChange={updateField} placeholder="黃色" /></label>
            <label>風格<input name="style" value={form.style} onChange={updateField} placeholder="休閒" /></label>
            <label>材質<input name="material" value={form.material} onChange={updateField} placeholder="棉" /></label>
            <label>用途<input name="purpose" value={form.purpose} onChange={updateField} placeholder="日常" /></label>
          </div>
          <label>備註（選填）<textarea name="notes" value={form.notes} onChange={updateField} maxLength="2000" placeholder="顏色、用途或其他說明…" rows="3" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions"><button className="secondary-button" onClick={onClose} type="button">取消</button><button className="primary-button" disabled={submitting} type="submit">{submitting ? "新增中…" : "新增物品"}</button></div>
        </form>
      </section>
    </div>
  );
}

function EditItemModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState({ name: item.name, category: item.category, quantity: item.quantity, notes: item.notes || "", color: item.attributes?.color || "", style: item.attributes?.style || "", material: item.attributes?.material || "", purpose: item.attributes?.purpose || "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault(); setSubmitting(true); setError("");
    try {
      const attributes = Object.fromEntries(["color", "style", "material", "purpose"].filter((key) => form[key].trim()).map((key) => [key, form[key].trim()]));
      await updateItem(item.id, { name: form.name.trim(), category: form.category, quantity: Number(form.quantity), notes: form.notes.trim() || null, attributes });
      onSaved();
    } catch {
      setError("儲存失敗，請稍後再試。"); setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-item-title">
        <div className="modal-header"><div><p className="eyebrow">EDIT ITEM</p><h2 id="edit-item-title">編輯物品</h2></div><button className="close-button" onClick={onClose} type="button" aria-label="關閉">×</button></div>
        <form onSubmit={handleSubmit}>
          <label>物品名稱<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength="200" required autoFocus /></label>
          <div className="form-row">
            <label>分類<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>衣物</option><option>鞋子</option><option>日用品</option><option>食品</option><option>其他</option></select></label>
            <label>數量<input value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} type="number" min="0" required /></label>
          </div>
          <div className="feature-grid">
            <label>顏色<input value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} placeholder="黃色" /></label>
            <label>風格<input value={form.style} onChange={(event) => setForm({ ...form, style: event.target.value })} placeholder="休閒" /></label>
            <label>材質<input value={form.material} onChange={(event) => setForm({ ...form, material: event.target.value })} placeholder="棉" /></label>
            <label>用途<input value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} placeholder="日常" /></label>
          </div>
          <label>備註（選填）<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} maxLength="2000" rows="3" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions"><button className="secondary-button" onClick={onClose} type="button">取消</button><button className="primary-button" disabled={submitting} type="submit">{submitting ? "儲存中…" : "儲存變更"}</button></div>
        </form>
      </section>
    </div>
  );
}

function PurchaseModal({ onClose }) {
  const [form, setForm] = useState({ name: "", category: "衣物", color: "", style: "", material: "", purpose: "" });
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault(); setSubmitting(true); setError(""); setResult(null);
    try {
      const candidate_attributes = Object.fromEntries(
        ["color", "style", "material", "purpose"].filter((key) => form[key].trim()).map((key) => [key, form[key].trim()])
      );
      const data = await evaluatePurchase({ candidate_name: form.name.trim(), candidate_category: form.category, candidate_attributes });
      setResult(data);
    } catch {
      setError("分析失敗，請確認後端服務是否正常運作。");
    } finally {
      setSubmitting(false);
    }
  }

  const labels = { category: "分類", color: "顏色", style: "風格", material: "材質", purpose: "用途" };
  const decisions = { skip: ["不建議購買", "danger"], consider: ["再考慮一下", "caution"], buy: ["可以考慮購買", "positive"] };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal recommendation-modal" role="dialog" aria-modal="true" aria-labelledby="purchase-title">
        <div className="modal-header"><div><p className="eyebrow">PURCHASE ADVISOR</p><h2 id="purchase-title">購買建議</h2><p>輸入商品特徵，與現有庫存進行比較。</p></div><button className="close-button" onClick={onClose} type="button" aria-label="關閉">×</button></div>
        <div className="recommendation-layout">
          <form onSubmit={handleSubmit}>
            <label>想買的商品<input name="name" value={form.name} onChange={updateField} placeholder="例如：黃色夏季洋裝" required autoFocus /></label>
            <label>分類<select name="category" value={form.category} onChange={updateField}><option>衣物</option><option>鞋子</option><option>日用品</option><option>食品</option><option>其他</option></select></label>
            <div className="feature-grid">
              <label>顏色<input name="color" value={form.color} onChange={updateField} placeholder="黃色" /></label>
              <label>風格<input name="style" value={form.style} onChange={updateField} placeholder="休閒" /></label>
              <label>材質<input name="material" value={form.material} onChange={updateField} placeholder="棉" /></label>
              <label>用途<input name="purpose" value={form.purpose} onChange={updateField} placeholder="日常" /></label>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button evaluate-button" disabled={submitting} type="submit">{submitting ? "分析中…" : "開始分析"}</button>
          </form>
          <div className="result-panel">
            {!result && <div className="result-placeholder"><span>✦</span><strong>等待分析</strong><p>系統會顯示相似度與每項特徵的計分。</p></div>}
            {result && <>
              <div className={`decision-badge ${decisions[result.recommendation]?.[1] || "caution"}`}>{decisions[result.recommendation]?.[0] || result.recommendation}</div>
              <div className="score"><strong>{result.similarity_score}%</strong><span>最高相似度</span></div>
              <p className="explanation">{result.explanation}</p>
              {result.similar_item_name && <p className="similar-item">最相似物品：<strong>{result.similar_item_name}</strong></p>}
              <div className="breakdown">{Object.entries(result.breakdown).map(([feature, score]) => <div key={feature}><span>{labels[feature]}</span><div><i style={{ width: `${(score / ({ category: 30, color: 30, style: 15, material: 15, purpose: 10 }[feature])) * 100}%` }} /></div><strong>+{score}</strong></div>)}</div>
            </>}
          </div>
        </div>
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
  const [editingItem, setEditingItem] = useState(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
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

  function handleSaved() {
    setEditingItem(null); setReloadKey((key) => key + 1);
  }

  async function handleDelete(item) {
    if (!window.confirm(`確定要刪除「${item.name}」嗎？`)) return;
    try {
      await deleteItem(item.id); setReloadKey((key) => key + 1);
    } catch {
      window.alert("刪除失敗，請確認後端服務是否正常運作。");
    }
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
        <nav aria-label="主要選單"><a className="active" href="#inventory">▦ 我的物品</a><button onClick={() => setPurchaseOpen(true)} type="button">✦ 購買建議</button><a href="#reminders">◷ 補貨提醒</a></nav>
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
          {status === "success" && items.length > 0 && <div className="item-grid">{items.map((item, index) => <ItemCard item={item} index={index} onEdit={setEditingItem} onDelete={handleDelete} key={item.id} />)}</div>}
        </section>
      </main>
      {formOpen && <AddItemModal onClose={() => setFormOpen(false)} onCreated={handleCreated} />}
      {editingItem && <EditItemModal item={editingItem} onClose={() => setEditingItem(null)} onSaved={handleSaved} />}
      {purchaseOpen && <PurchaseModal onClose={() => setPurchaseOpen(false)} />}
    </div>
  );
}
