import { useEffect, useMemo, useState } from "react";

import {
  createItem,
  deleteItem,
  evaluatePurchase,
  fetchItems,
  updateItem,
} from "./api";
import "./styles.css";

const CATEGORIES = ["Clothing", "Shoes", "Household", "Food", "Other"];
const CATEGORY_CODES = {
  Clothing: "CL",
  Shoes: "SH",
  Household: "HH",
  Food: "FD",
  Other: "OT",
};
const CATEGORY_ALIASES = {
  "\u8863\u7269": "Clothing",
  "\u978b\u5b50": "Shoes",
  "\u65e5\u7528\u54c1": "Household",
  "\u98df\u54c1": "Food",
  "\u5176\u4ed6": "Other",
};
const FEATURE_KEYS = ["color", "style", "material", "purpose"];
const FEATURE_LABELS = {
  category: "Category",
  color: "Color",
  style: "Style",
  material: "Material",
  purpose: "Purpose",
};
const FEATURE_WEIGHTS = {
  category: 30,
  color: 30,
  style: 15,
  material: 15,
  purpose: 10,
};

function normalizeCategory(category) {
  return CATEGORY_ALIASES[category] || category || "Other";
}

function Icon({ name, size = 18 }) {
  const paths = {
    box: <><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /></>,
    compare: <><path d="M4 7h11M12 4l3 3-3 3M20 17H9M12 14l-3 3 3 3" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
  };
  return (
    <svg aria-hidden="true" className="icon" fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
        {paths[name]}
      </g>
    </svg>
  );
}

function ItemCard({ item, index, onEdit, onDelete }) {
  const category = normalizeCategory(item.category);
  const details = [
    item.attributes?.color,
    item.attributes?.material,
    item.attributes?.style,
  ].filter(Boolean);
  const description =
    item.notes ||
    details.join(" / ") ||
    (item.expected_usage_days
      ? `Estimated use: ${item.expected_usage_days} days`
      : "No details added");

  return (
    <article className="item-card">
      <div className="item-visual">
        <span>{CATEGORY_CODES[category] || "IT"}</span>
        <small>{String(index + 1).padStart(2, "0")}</small>
      </div>
      <div className="item-info">
        <div className="item-heading">
          <span className="category">{category}</span>
          <div className="card-actions">
            <button aria-label={`Edit ${item.name}`} onClick={() => onEdit(item)} title="Edit" type="button">
              <Icon name="edit" size={16} />
            </button>
            <button aria-label={`Delete ${item.name}`} onClick={() => onDelete(item)} title="Delete" type="button">
              <Icon name="trash" size={16} />
            </button>
          </div>
        </div>
        <h2>{item.name}</h2>
        <p>{description}</p>
        <div className="quantity">
          <span>Quantity</span>
          <strong>{item.quantity}</strong>
        </div>
      </div>
    </article>
  );
}

function ItemModal({ item, onClose, onSaved }) {
  const editing = Boolean(item);
  const [form, setForm] = useState({
    name: item?.name || "",
    category: normalizeCategory(item?.category || "Clothing"),
    quantity: item?.quantity ?? 1,
    notes: item?.notes || "",
    color: item?.attributes?.color || "",
    style: item?.attributes?.style || "",
    material: item?.attributes?.material || "",
    purpose: item?.attributes?.purpose || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const attributes = Object.fromEntries(
      FEATURE_KEYS.filter((key) => form[key].trim()).map((key) => [key, form[key].trim()]),
    );
    const payload = {
      name: form.name.trim(),
      category: form.category,
      quantity: Number(form.quantity),
      notes: form.notes.trim() || null,
      attributes,
    };
    try {
      if (editing) await updateItem(item.id, payload);
      else await createItem(payload);
      onSaved();
    } catch {
      setError("We could not save this item. Check that the API is running and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()} role="presentation">
      <section aria-labelledby="item-modal-title" aria-modal="true" className="modal item-modal" role="dialog">
        <header className="modal-header">
          <div>
            <p className="eyebrow">INVENTORY / {editing ? "EDIT" : "NEW"}</p>
            <h2 id="item-modal-title">{editing ? "Edit item" : "Add an item"}</h2>
          </div>
          <button aria-label="Close" className="close-button" onClick={onClose} type="button"><Icon name="close" /></button>
        </header>
        <form onSubmit={handleSubmit}>
          <label>Item name<input autoFocus maxLength="200" name="name" onChange={updateField} placeholder="e.g. Yellow summer dress" required value={form.name} /></label>
          <div className="form-row">
            <label>Category<select name="category" onChange={updateField} value={form.category}>{CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Quantity<input min="0" name="quantity" onChange={updateField} required type="number" value={form.quantity} /></label>
          </div>
          <div className="feature-grid">
            <label>Color<input name="color" onChange={updateField} placeholder="Yellow" value={form.color} /></label>
            <label>Style<input name="style" onChange={updateField} placeholder="Casual" value={form.style} /></label>
            <label>Material<input name="material" onChange={updateField} placeholder="Cotton" value={form.material} /></label>
            <label>Purpose<input name="purpose" onChange={updateField} placeholder="Everyday" value={form.purpose} /></label>
          </div>
          <label>Notes (optional)<textarea maxLength="2000" name="notes" onChange={updateField} placeholder="Condition, location, or anything useful" rows="3" value={form.notes} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions">
            <button className="secondary-button" onClick={onClose} type="button">Cancel</button>
            <button className="primary-button" disabled={submitting} type="submit">
              {submitting ? "Saving..." : editing ? "Save changes" : "Add item"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function PurchaseModal({ onClose }) {
  const [form, setForm] = useState({
    name: "",
    category: "Clothing",
    color: "",
    style: "",
    material: "",
    purpose: "",
  });
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setResult(null);
    const candidateAttributes = Object.fromEntries(
      FEATURE_KEYS.filter((key) => form[key].trim()).map((key) => [key, form[key].trim()]),
    );
    try {
      const data = await evaluatePurchase({
        candidate_name: form.name.trim(),
        candidate_category: form.category,
        candidate_attributes: candidateAttributes,
      });
      setResult(data);
    } catch {
      setError("Analysis failed. Check that the API is running and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const decisions = {
    skip: ["SKIP THIS ONE", "danger"],
    consider: ["CONSIDER FIRST", "caution"],
    buy: ["GOOD TO CONSIDER", "positive"],
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-labelledby="purchase-title" aria-modal="true" className="modal recommendation-modal" role="dialog">
        <header className="modal-header">
          <div>
            <p className="eyebrow">PURCHASE CHECK</p>
            <h2 id="purchase-title">Should you buy it?</h2>
            <p>Compare a new purchase with what you already own.</p>
          </div>
          <button aria-label="Close" className="close-button" onClick={onClose} type="button"><Icon name="close" /></button>
        </header>
        <div className="recommendation-layout">
          <form onSubmit={handleSubmit}>
            <label>Item you are considering<input autoFocus name="name" onChange={updateField} placeholder="e.g. Yellow summer dress" required value={form.name} /></label>
            <label>Category<select name="category" onChange={updateField} value={form.category}>{CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></label>
            <div className="feature-grid">
              <label>Color<input name="color" onChange={updateField} placeholder="Yellow" value={form.color} /></label>
              <label>Style<input name="style" onChange={updateField} placeholder="Casual" value={form.style} /></label>
              <label>Material<input name="material" onChange={updateField} placeholder="Cotton" value={form.material} /></label>
              <label>Purpose<input name="purpose" onChange={updateField} placeholder="Everyday" value={form.purpose} /></label>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button evaluate-button" disabled={submitting} type="submit">
              {submitting ? "Comparing..." : <>Check my inventory <Icon name="arrow" size={16} /></>}
            </button>
          </form>
          <div className="result-panel">
            {!result && (
              <div className="result-placeholder">
                <span className="result-index">01</span>
                <div><strong>Ready when you are</strong><p>Enter product details to see a transparent, weighted comparison.</p></div>
              </div>
            )}
            {result && (
              <>
                <div className={`decision-badge ${decisions[result.recommendation]?.[1] || "caution"}`}>
                  {decisions[result.recommendation]?.[0] || result.recommendation}
                </div>
                <div className="score"><strong>{result.similarity_score}%</strong><span>closest match</span></div>
                <p className="explanation">{result.explanation}</p>
                {result.similar_item_name && <p className="similar-item">Closest item <strong>{result.similar_item_name}</strong></p>}
                <div className="breakdown">
                  {Object.entries(result.breakdown).map(([feature, score]) => (
                    <div key={feature}>
                      <span>{FEATURE_LABELS[feature]}</span>
                      <div><i style={{ width: `${(score / FEATURE_WEIGHTS[feature]) * 100}%` }} /></div>
                      <strong>+{score}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
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
  const [itemModal, setItemModal] = useState(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const data = await fetchItems({ search, category, signal: controller.signal });
        setItems(data);
        setStatus("success");
      } catch (error) {
        if (error.name !== "AbortError") setStatus("error");
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, category, reloadKey]);

  function handleSaved() {
    setItemModal(null);
    setReloadKey((key) => key + 1);
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.name}" from your inventory?`)) return;
    try {
      await deleteItem(item.id);
      setReloadKey((key) => key + 1);
    } catch {
      window.alert("We could not delete this item. Check that the API is running.");
    }
  }

  const stats = useMemo(
    () => ({
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      categories: new Set(items.map((item) => normalizeCategory(item.category))).size,
      lowStock: items.filter((item) => item.quantity <= 1).length,
    }),
    [items],
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span>ST</span><strong>STOW</strong></div>
        <nav aria-label="Primary navigation">
          <a className="active" href="#inventory"><Icon name="box" />Inventory</a>
          <button onClick={() => setPurchaseOpen(true)} type="button"><Icon name="compare" />Purchase check</button>
          <a href="#restock"><Icon name="clock" />Restock</a>
        </nav>
        <div className="sidebar-tip"><small>THE PRINCIPLE</small><p>Know what you own.<br />Buy only what you need.</p></div>
      </aside>

      <main className="content" id="inventory">
        <header className="page-header">
          <div>
            <p className="eyebrow">PERSONAL INVENTORY</p>
            <h1>Everything you own,<br />in one clear view.</h1>
            <p>Track belongings, spot duplicates, and make deliberate purchases.</p>
          </div>
          <button className="primary-button add-button" onClick={() => setItemModal({ mode: "add" })} type="button">
            <Icon name="plus" /> Add item
          </button>
        </header>

        <section aria-label="Inventory summary" className="stats">
          <article><span>Total units</span><strong>{stats.totalQuantity}</strong><small>Across {stats.categories} categories</small></article>
          <article><span>Low stock</span><strong>{stats.lowStock}</strong><small className="warning">One unit or less</small></article>
          <article><span>Unique items</span><strong>{items.length}</strong><small>Synced with PostgreSQL</small></article>
        </section>

        <section className="inventory-panel">
          <div className="toolbar">
            <label className="search-box"><Icon name="search" size={17} /><input aria-label="Search items" onChange={(event) => setSearch(event.target.value)} placeholder="Search your inventory" value={search} /></label>
            <select aria-label="Filter by category" onChange={(event) => setCategory(event.target.value)} value={category}>
              <option value="all">All categories</option>
              {CATEGORIES.map((value) => <option key={value}>{value}</option>)}
            </select>
          </div>
          {status === "loading" && <div className="state-message">Loading inventory...</div>}
          {status === "error" && <div className="state-message error">Unable to reach the API. Check that Docker is running.</div>}
          {status === "success" && items.length === 0 && <div className="state-message"><strong>No items found</strong><span>Adjust your filters or add your first item.</span></div>}
          {status === "success" && items.length > 0 && (
            <div className="item-grid">
              {items.map((item, index) => (
                <ItemCard item={item} index={index} key={item.id} onDelete={handleDelete} onEdit={(selected) => setItemModal({ mode: "edit", item: selected })} />
              ))}
            </div>
          )}
        </section>
      </main>

      {itemModal && <ItemModal item={itemModal.mode === "edit" ? itemModal.item : null} onClose={() => setItemModal(null)} onSaved={handleSaved} />}
      {purchaseOpen && <PurchaseModal onClose={() => setPurchaseOpen(false)} />}
    </div>
  );
}
