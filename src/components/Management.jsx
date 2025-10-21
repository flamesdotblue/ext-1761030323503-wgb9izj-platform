import { useMemo, useState } from 'react';
import {
  getInventory,
  addStockPurchase,
  getRecipes,
  updateRecipeQty,
  getProducts,
  setProductMarkup,
  computeProductCost,
  formatINR,
} from './dataModel';

export default function Management() {
  const [tab, setTab] = useState('inventory');

  return (
    <div className="p-6">
      <div className="mb-4 flex gap-2">
        {[
          { id: 'inventory', label: 'Inventory' },
          { id: 'recipes', label: 'Recipes' },
          { id: 'pricing', label: 'Pricing' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md border px-3 py-2 text-sm ${tab === t.id ? 'border-black bg-black text-white' : 'border-slate-300 bg-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'inventory' && <InventoryTab />}
      {tab === 'recipes' && <RecipesTab />}
      {tab === 'pricing' && <PricingTab />}
    </div>
  );
}

function InventoryTab() {
  const [items, setItems] = useState(getInventory());
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [selected, setSelected] = useState(items[0]?.id || '');

  const addPurchase = () => {
    const q = parseFloat(qty);
    const c = parseFloat(cost);
    if (!selected || isNaN(q) || isNaN(c) || q <= 0 || c < 0) return alert('Enter valid quantity and cost');
    addStockPurchase(selected, q, c);
    setItems(getInventory());
    setQty('');
    setCost('');
    alert('Stock updated');
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold">Live Inventory</h3>
        <div className="space-y-2 text-sm">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
              <span className="font-medium">{it.name}</span>
              <span>
                {it.qty} {it.unit} • Reorder {it.reorder}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold">Add Purchase</h3>
        <div className="grid grid-cols-1 gap-2 text-sm">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2">
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Quantity"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            placeholder="Total Cost (INR)"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
          <button onClick={addPurchase} className="rounded-md bg-black px-3 py-2 text-white">
            Save Purchase
          </button>
        </div>
      </div>
    </div>
  );
}

function RecipesTab() {
  const [recipes, setRecipes] = useState(getRecipes());

  const onChangeQty = (productId, ingredientId, val) => {
    const q = parseFloat(val);
    if (isNaN(q) || q < 0) return;
    updateRecipeQty(productId, ingredientId, q);
    setRecipes(getRecipes());
  };

  return (
    <div className="space-y-6">
      {recipes.map((r) => (
        <div key={r.productId} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">{r.productName}</p>
            <p className="text-xs text-slate-500">Cost per cup: {formatINR(r.costPerCup)}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {r.ingredients.map((ing) => (
              <div key={ing.ingredientId} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm">
                <span>
                  {ing.ingredientName}
                  <span className="ml-2 text-xs text-slate-500">({ing.unit})</span>
                </span>
                <input
                  value={ing.qty}
                  onChange={(e) => onChangeQty(r.productId, ing.ingredientId, e.target.value)}
                  className="w-24 rounded-md border border-slate-300 px-2 py-1 text-right"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PricingTab() {
  const [products, setProducts] = useState(getProducts());

  const setMarkup = (id, val) => {
    const m = parseFloat(val);
    if (isNaN(m) || m < 0) return;
    setProductMarkup(id, m);
    setProducts(getProducts());
  };

  const rows = useMemo(() =>
    products.map((p) => ({
      ...p,
      cost: computeProductCost(p.id),
      price: p.sellingPrice,
      markup: p.markup,
    })), [products]
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold">Dynamic Pricing</h3>
      <div className="grid grid-cols-1 gap-2 text-sm">
        <div className="grid grid-cols-4 gap-2 rounded-md bg-slate-50 p-2 font-medium">
          <div>Juice</div>
          <div>Cost/Cup</div>
          <div>Markup</div>
          <div>Selling Price</div>
        </div>
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-4 items-center gap-2 rounded-md border border-slate-200 p-2">
            <div className="font-medium">{r.name}</div>
            <div>{formatINR(r.cost)}</div>
            <div>
              <input
                value={r.markup}
                onChange={(e) => setMarkup(r.id, e.target.value)}
                className="w-24 rounded-md border border-slate-300 px-2 py-1 text-right"
              />
            </div>
            <div className="font-semibold text-emerald-700">{formatINR(r.price)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
