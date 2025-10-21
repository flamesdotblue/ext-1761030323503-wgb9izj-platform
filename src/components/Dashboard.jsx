import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, TrendingUp, IndianRupee, Box } from 'lucide-react';
import {
  getTodaySummary,
  getLowStockItems,
  getAIPredictions,
  getTopSellingJuice,
} from './dataModel';

export default function Dashboard() {
  const [summary, setSummary] = useState(getTodaySummary());
  const [lowStock, setLowStock] = useState(getLowStockItems());
  const [predictions, setPredictions] = useState(getAIPredictions());

  useEffect(() => {
    const i = setInterval(() => {
      setSummary(getTodaySummary());
      setLowStock(getLowStockItems());
      setPredictions(getAIPredictions());
    }, 2500);
    return () => clearInterval(i);
  }, []);

  const topJuice = useMemo(() => getTopSellingJuice(), [summary.totalSales]);

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Today's Sales</p>
              <p className="mt-1 text-2xl font-semibold">₹{summary.totalAmount.toFixed(2)}</p>
            </div>
            <IndianRupee className="h-8 w-8 text-emerald-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Total Orders</p>
              <p className="mt-1 text-2xl font-semibold">{summary.totalSales}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-indigo-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Top Juice</p>
              <p className="mt-1 text-2xl font-semibold">{topJuice?.name || '—'}</p>
            </div>
            <Box className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Low Stock Alerts</h3>
          <div className="space-y-2">
            {lowStock.length === 0 && (
              <p className="text-sm text-slate-500">All good. No low stock items.</p>
            )}
            {lowStock.map((it) => (
              <div key={it.id} className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="font-medium">{it.name}</span>
                </div>
                <span>
                  {it.qty} {it.unit} (Reorder: {it.reorder})
                </span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">AI Prediction Summary (Tomorrow)</h3>
          <div className="space-y-2">
            {predictions.map((p) => (
              <div key={p.productId} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{p.productName}</p>
                  <p className="text-xs text-slate-500">{p.comment}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{p.predictedQty} cups</p>
                  <p className="text-xs text-slate-500">Confidence: {Math.round(p.confidence * 100)}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}
