import { useMemo, useState } from 'react';
import { ShoppingCart, Check, Plus, Minus } from 'lucide-react';
import {
  getProducts,
  getMaxMakeableQty,
  recordSale,
  formatINR,
} from './dataModel';

export default function POS() {
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState([]); // {productId, qty}
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [phone, setPhone] = useState('');

  const products = useMemo(() => getProducts(), []);

  const filtered = useMemo(() => {
    return products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  }, [products, query]);

  const addToCart = (p) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) {
        return prev.map((i) => (i.productId === p.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { productId: p.id, qty: 1 }];
    });
  };

  const inc = (id) => setCart((c) => c.map((i) => (i.productId === id ? { ...i, qty: i.qty + 1 } : i)));
  const dec = (id) =>
    setCart((c) => c.map((i) => (i.productId === id ? { ...i, qty: Math.max(1, i.qty - 1) } : i)));
  const remove = (id) => setCart((c) => c.filter((i) => i.productId !== id));

  const totals = useMemo(() => {
    let amount = 0;
    const items = cart.map((i) => {
      const p = products.find((x) => x.id === i.productId);
      const line = p.sellingPrice * i.qty;
      amount += line;
      return { ...i, name: p.name, price: p.sellingPrice, line };
    });
    return { amount, items };
  }, [cart, products]);

  const maxPerProduct = useMemo(() => {
    const map = {};
    for (const p of products) map[p.id] = getMaxMakeableQty(p.id);
    return map;
  }, [products]);

  const checkout = () => {
    if (cart.length === 0) return alert('Cart is empty.');
    const phoneSanitized = phone?.trim();
    try {
      recordSale({ items: totals.items, paymentMode, customerPhone: phoneSanitized });
      setCart([]);
      setPhone('');
      alert('Sale recorded and WhatsApp bill queued.');
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5">
      <div className="md:col-span-3 border-r border-slate-200 p-4">
        <div className="mb-3 flex items-center gap-3">
          <input
            placeholder="Search juice..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <img
                src={p.image || 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200&auto=format&fit=crop'}
                alt={p.name}
                className="h-28 w-full rounded-md object-cover"
              />
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-emerald-700">{formatINR(p.sellingPrice)}</p>
                </div>
                <p className="text-xs text-slate-500">Available: {maxPerProduct[p.id]} cups</p>
                <button
                  onClick={() => addToCart(p)}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-slate-900"
                >
                  <ShoppingCart size={16} /> Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="md:col-span-2 p-4">
        <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold">Cart</p>
        </div>
        <div className="space-y-2">
          {cart.length === 0 && <p className="text-sm text-slate-500">No items in cart.</p>}
          {cart.map((i) => {
            const p = products.find((x) => x.id === i.productId);
            const max = maxPerProduct[i.productId] || 0;
            const disabledAdd = i.qty >= max;
            return (
              <div key={i.productId} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-slate-500">Max: {max}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-md border px-2 py-1" onClick={() => dec(i.productId)}>
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center">{i.qty}</span>
                  <button
                    className={`rounded-md border px-2 py-1 ${disabledAdd ? 'opacity-50' : ''}`}
                    onClick={() => !disabledAdd && inc(i.productId)}
                    disabled={disabledAdd}
                  >
                    <Plus size={14} />
                  </button>
                  <button className="ml-2 text-xs text-rose-600" onClick={() => remove(i.productId)}>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between text-sm">
            <span>Total</span>
            <span className="font-semibold">{formatINR(totals.amount)}</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
            {['Cash', 'UPI', 'Card'].map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMode(m)}
                className={`rounded-md border px-2 py-2 ${paymentMode === m ? 'border-black bg-black text-white' : 'border-slate-300'}`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <input
              placeholder="Customer WhatsApp Number (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={checkout}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Check size={16} /> Checkout & Send WhatsApp Bill
          </button>
        </div>
      </div>
    </div>
  );
}
