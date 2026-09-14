import "./styles.css";

const demoItems = [
  { id: 1, icon: "👗", name: "黃色洋裝", category: "衣物", quantity: 1, detail: "休閒・夏季", color: "yellow" },
  { id: 2, icon: "👟", name: "白色休閒鞋", category: "鞋子", quantity: 2, detail: "最後使用：3 天前", color: "blue" },
  { id: 3, icon: "🧴", name: "保濕乳液", category: "日用品", quantity: 1, detail: "預計 8 天後用完", color: "pink" },
  { id: 4, icon: "🥫", name: "萬字醬油", category: "食品", quantity: 1, detail: "預計 10 天後補貨", color: "green" },
];

export function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span>◈</span> SmartStock</div>
        <nav aria-label="主要選單">
          <a className="active" href="#inventory">▦ 我的物品</a>
          <a href="#decision">✦ 購買建議</a>
          <a href="#reminders">◷ 補貨提醒</a>
        </nav>
        <div className="sidebar-tip">
          <span>💡</span>
          <p>先記錄已有物品，AI 才能提供更準確的購買建議。</p>
        </div>
      </aside>

      <main className="content" id="inventory">
        <header className="page-header">
          <div>
            <p className="eyebrow">MY INVENTORY</p>
            <h1>我的物品</h1>
            <p>清楚掌握擁有的東西，避免重複購買。</p>
          </div>
          <button className="primary-button" type="button">＋ 新增物品</button>
        </header>

        <section className="stats" aria-label="庫存摘要">
          <article><span>物品總數</span><strong>5</strong><small>共 4 個種類</small></article>
          <article><span>即將用完</span><strong>2</strong><small className="warning">需要留意</small></article>
          <article><span>本月新增</span><strong>3</strong><small>比上月多 1 件</small></article>
        </section>

        <section className="inventory-panel">
          <div className="toolbar">
            <label className="search-box">
              <span>⌕</span>
              <input aria-label="搜尋物品" placeholder="搜尋物品名稱…" />
            </label>
            <select aria-label="依分類篩選" defaultValue="all">
              <option value="all">所有分類</option>
              <option>衣物</option><option>鞋子</option><option>日用品</option><option>食品</option>
            </select>
          </div>

          <div className="item-grid">
            {demoItems.map((item) => (
              <article className="item-card" key={item.id}>
                <div className={`item-image ${item.color}`}>{item.icon}</div>
                <div className="item-info">
                  <div className="item-heading">
                    <span className="category">{item.category}</span>
                    <button aria-label={`編輯${item.name}`} type="button">•••</button>
                  </div>
                  <h2>{item.name}</h2>
                  <p>{item.detail}</p>
                  <div className="quantity"><span>庫存數量</span><strong>{item.quantity}</strong></div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
