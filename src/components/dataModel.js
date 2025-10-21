// Local offline-first data store to simulate Excel workbook sheets.
// Sheets: Products, Inventory, Sales, Customers, Recipes, AI_Predictions, WhatsApp_Logs

const STORE_KEY = 'juiceshop_app_store_v1';

function defaultStore() {
  const now = Date.now();
  return {
    Products: [
      {
        id: 'p_mango',
        name: 'Mango Juice',
        image: 'https://images.unsplash.com/photo-1524156868115-e696b44983db?ixid=M3w3OTkxMTl8MHwxfHNlYXJjaHwxfHxNYW5nbyUyMEp1aWNlfGVufDB8MHx8fDE3NjEwMzA3Nzh8MA&ixlib=rb-4.1.0&w=1600&auto=format&fit=crop&q=80',
        markup: 1.6, // selling price = cost * markup
      },
      {
        id: 'p_orange',
        name: 'Orange Juice',
        image: 'https://images.unsplash.com/photo-1547514701-42782101795e?q=80&w=1200&auto=format&fit=crop',
        markup: 1.5,
      },
      {
        id: 'p_sugarcane',
        name: 'Sugarcane Juice',
        image: 'https://images.unsplash.com/photo-1677146334971-3fb697b4060e?ixid=M3w3OTkxMTl8MHwxfHNlYXJjaHwxfHxTdWdhcmNhbmUlMjBKdWljZXxlbnwwfDB8fHwxNzYxMDMwNzc4fDA&ixlib=rb-4.1.0&w=1600&auto=format&fit=crop&q=80',
        markup: 1.7,
      },
    ],
    Inventory: [
      { id: 'i_mango', name: 'Mango', unit: 'kg', qty: 10, reorder: 3, avgCostPerUnit: 120 },
      { id: 'i_orange', name: 'Orange', unit: 'kg', qty: 12, reorder: 4, avgCostPerUnit: 90 },
      { id: 'i_sugar', name: 'Sugar', unit: 'kg', qty: 8, reorder: 2, avgCostPerUnit: 45 },
      { id: 'i_ice', name: 'Ice', unit: 'kg', qty: 15, reorder: 5, avgCostPerUnit: 10 },
      { id: 'i_cups', name: 'Cups', unit: 'pcs', qty: 200, reorder: 50, avgCostPerUnit: 2 },
    ],
    Recipes: [
      // qty per 1 cup
      {
        productId: 'p_mango',
        ingredients: [
          { ingredientId: 'i_mango', qty: 0.25 },
          { ingredientId: 'i_sugar', qty: 0.02 },
          { ingredientId: 'i_ice', qty: 0.1 },
          { ingredientId: 'i_cups', qty: 1 },
        ],
      },
      {
        productId: 'p_orange',
        ingredients: [
          { ingredientId: 'i_orange', qty: 0.3 },
          { ingredientId: 'i_sugar', qty: 0.02 },
          { ingredientId: 'i_ice', qty: 0.1 },
          { ingredientId: 'i_cups', qty: 1 },
        ],
      },
      {
        productId: 'p_sugarcane',
        ingredients: [
          { ingredientId: 'i_sugar', qty: 0.04 },
          { ingredientId: 'i_ice', qty: 0.15 },
          { ingredientId: 'i_cups', qty: 1 },
        ],
      },
    ],
    Sales: [
      // {time, items:[{productId, qty, price}], amount, paymentMode, customerPhone}
    ],
    Customers: [],
    AI_Predictions: [],
    WhatsApp_Logs: [
      {
        time: now,
        to: '',
        message: 'Welcome to Juice Shop AI POS ready! Enjoy your day.',
        template: 'System',
        status: 'SENT',
      },
    ],
    Settings: {
      ownerPhone: '',
      billTemplate: 'Thanks for visiting! Your total: ₹{amount}.',
      dailyTemplate: "Today's Sales: ₹{amount}. Top Juice: {juice}.",
      timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      lastSummaryDate: '',
    },
  };
}

export function initStore() {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) {
    localStorage.setItem(STORE_KEY, JSON.stringify(defaultStore()));
  }
}

function read() {
  const raw = localStorage.getItem(STORE_KEY);
  return raw ? JSON.parse(raw) : defaultStore();
}

function write(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

export function formatINR(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(
    Number(n || 0)
  );
}

export function getInventory() {
  return read().Inventory;
}

export function getProducts() {
  const db = read();
  return db.Products.map((p) => ({ ...p, sellingPrice: computeSellingPrice(db, p.id) }));
}

export function getRecipes() {
  const db = read();
  return db.Recipes.map((r) => {
    const product = db.Products.find((p) => p.id === r.productId);
    const ingredients = r.ingredients.map((ing) => {
      const inv = db.Inventory.find((i) => i.id === ing.ingredientId);
      return { ingredientId: ing.ingredientId, ingredientName: inv?.name || ing.ingredientId, unit: inv?.unit || '', qty: ing.qty };
    });
    return {
      productId: r.productId,
      productName: product?.name || r.productId,
      ingredients,
      costPerCup: computeProductCost(r.productId),
    };
  });
}

export function updateRecipeQty(productId, ingredientId, qty) {
  const db = read();
  const r = db.Recipes.find((x) => x.productId === productId);
  if (!r) return;
  const ing = r.ingredients.find((x) => x.ingredientId === ingredientId);
  if (!ing) r.ingredients.push({ ingredientId, qty });
  else ing.qty = qty;
  write(db);
}

export function computeProductCost(productId) {
  const db = read();
  const r = db.Recipes.find((x) => x.productId === productId);
  if (!r) return 0;
  let cost = 0;
  for (const ing of r.ingredients) {
    const inv = db.Inventory.find((i) => i.id === ing.ingredientId);
    if (!inv) continue;
    cost += (inv.avgCostPerUnit || 0) * ing.qty;
  }
  return round2(cost);
}

function computeSellingPrice(db, productId) {
  const product = db.Products.find((p) => p.id === productId);
  const cost = computeProductCost(productId);
  const price = cost * (product?.markup || 1.5);
  return round2(price);
}

export function setProductMarkup(productId, markup) {
  const db = read();
  const p = db.Products.find((x) => x.id === productId);
  if (!p) return;
  p.markup = markup;
  write(db);
}

export function addStockPurchase(ingredientId, qty, totalCost) {
  const db = read();
  const inv = db.Inventory.find((i) => i.id === ingredientId);
  if (!inv) throw new Error('Ingredient not found');
  const prevQty = inv.qty;
  const prevCost = inv.avgCostPerUnit;
  const newUnits = qty;
  const newCostPerUnit = newUnits > 0 ? totalCost / newUnits : 0;
  const combinedQty = prevQty + newUnits;
  if (combinedQty > 0) {
    inv.avgCostPerUnit = round2((prevQty * prevCost + newUnits * newCostPerUnit) / combinedQty);
  }
  inv.qty = round2(combinedQty);
  write(db);
}

export function getLowStockItems() {
  const db = read();
  return db.Inventory.filter((i) => i.qty <= i.reorder);
}

export function getMaxMakeableQty(productId) {
  const db = read();
  const r = db.Recipes.find((x) => x.productId === productId);
  if (!r) return 0;
  let max = Infinity;
  for (const ing of r.ingredients) {
    const inv = db.Inventory.find((i) => i.id === ing.ingredientId);
    if (!inv) return 0;
    const possible = Math.floor(inv.qty / ing.qty);
    if (Number.isFinite(possible)) max = Math.min(max, possible);
  }
  return max === Infinity ? 0 : max;
}

export function recordSale({ items, paymentMode, customerPhone }) {
  const db = read();
  // Stock check
  for (const it of items) {
    const max = getMaxMakeableQty(it.productId);
    if (it.qty > max) throw new Error('Insufficient stock for ' + it.name);
  }
  // Deduct inventory
  for (const it of items) {
    const r = db.Recipes.find((x) => x.productId === it.productId);
    if (!r) continue;
    for (const ing of r.ingredients) {
      const inv = db.Inventory.find((i) => i.id === ing.ingredientId);
      if (!inv) continue;
      inv.qty = round2(inv.qty - ing.qty * it.qty);
    }
  }
  const amount = round2(items.reduce((a, b) => a + b.price * b.qty, 0));
  db.Sales.push({
    time: Date.now(),
    items: items.map(({ productId, qty, price }) => ({ productId, qty, price })),
    amount,
    paymentMode,
    customerPhone: customerPhone || '',
  });
  // WhatsApp bill
  if (customerPhone) {
    const msg = billTemplate(db.Settings.billTemplate, amount);
    db.WhatsApp_Logs.push({ time: Date.now(), to: customerPhone, message: msg, template: 'Customer Bill', status: 'QUEUED' });
  }
  write(db);
}

function billTemplate(tpl, amount) {
  return tpl.replace('{amount}', amount.toFixed(2));
}

function dailyTemplate(tpl, amount, topJuiceName) {
  return tpl.replace('{amount}', amount.toFixed(2)).replace('{juice}', topJuiceName || '—');
}

export function getTodaySummary() {
  const db = read();
  const start = startOfToday();
  const todaySales = db.Sales.filter((s) => s.time >= start);
  return {
    totalSales: todaySales.length,
    totalAmount: round2(todaySales.reduce((a, b) => a + b.amount, 0)),
  };
}

export function getTopSellingJuice() {
  const db = read();
  const counts = {};
  for (const s of db.Sales) for (const it of s.items) counts[it.productId] = (counts[it.productId] || 0) + it.qty;
  let best = null;
  for (const p of db.Products) {
    const qty = counts[p.id] || 0;
    if (!best || qty > best.qty) best = { id: p.id, name: p.name, qty };
  }
  return best;
}

export function getAIPredictions() {
  const db = read();
  const weather = getMockWeatherFactor();
  const products = db.Products;
  const preds = products.map((p) => {
    const history = getSalesHistoryForProduct(p.id);
    const avg = history.length ? history.reduce((a, b) => a + b, 0) / history.length : 10;
    const trend = history.length > 3 ? (history.at(-1) - history[0]) / Math.max(1, history.length - 1) : 0;
    const base = avg + trend;
    const predicted = Math.max(0, Math.round(base * weather.factor));
    const confidence = Math.max(0.5, Math.min(0.95, 0.6 + Math.abs(trend) * 0.05));
    const comment = weather.comment;
    return { productId: p.id, productName: p.name, predictedQty: predicted, confidence, comment };
  });
  return preds;
}

function getSalesHistoryForProduct(productId) {
  const db = read();
  // sum per day last 14 days
  const days = 14;
  const arr = [];
  for (let d = days - 1; d >= 0; d--) {
    const start = startOfDayOffset(-d);
    const end = start + 24 * 60 * 60 * 1000;
    const qty = db.Sales.filter((s) => s.time >= start && s.time < end)
      .flatMap((s) => s.items)
      .filter((it) => it.productId === productId)
      .reduce((a, b) => a + b.qty, 0);
    arr.push(qty);
  }
  return arr;
}

function getMockWeatherFactor() {
  // Simple mock: hotter days => higher factor.
  const hour = new Date().getHours();
  const tempIndex = (hour >= 11 && hour <= 18) ? 1.15 : 0.95; // day boosts cold drink sales
  const comment = tempIndex > 1 ? 'Hot hours ahead, expect higher demand.' : 'Mild weather, average demand.';
  return { factor: tempIndex, comment };
}

export function getWhatsAppLogs() {
  return read().WhatsApp_Logs.sort((a, b) => b.time - a.time);
}

export function sendDailySummaryNow() {
  const db = read();
  const sum = getTodaySummary();
  const top = getTopSellingJuice();
  db.WhatsApp_Logs.push({
    time: Date.now(),
    to: db.Settings.ownerPhone || '',
    message: dailyTemplate(db.Settings.dailyTemplate, sum.totalAmount, top?.name),
    template: 'Daily Summary',
    status: 'QUEUED',
  });
  write(db);
}

export function scheduleNinePMSummaryIfNeeded() {
  // Basic scheduler: on app load, if it's after 21:00 local and not sent today, enqueue.
  const db = read();
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const h = now.getHours();
  if (h >= 21 && db.Settings.lastSummaryDate !== todayKey) {
    sendDailySummaryNow();
    db.Settings.lastSummaryDate = todayKey;
    write(db);
  }
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return +d;
}

function startOfDayOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(0, 0, 0, 0);
  return +d;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
