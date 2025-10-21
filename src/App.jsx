import { useEffect, useMemo, useState } from 'react';
import { Home, ShoppingCart, Settings, MessageSquare } from 'lucide-react';
import HeroCover from './components/HeroCover';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Management from './components/Management';
import WhatsAppLogs from './components/WhatsAppLogs';
import { initStore, scheduleNinePMSummaryIfNeeded } from './components/dataModel';

export default function App() {
  const [active, setActive] = useState('dashboard');

  useEffect(() => {
    initStore();
    scheduleNinePMSummaryIfNeeded();
  }, []);

  const NavButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActive(id)}
      className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        active === id ? 'bg-black text-white' : 'bg-white/70 hover:bg-white'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  const Title = useMemo(() => {
    switch (active) {
      case 'dashboard':
        return 'Juice Shop AI Dashboard';
      case 'pos':
        return 'POS • Sales Counter';
      case 'manage':
        return 'Inventory • Recipes • Pricing';
      case 'whatsapp':
        return 'WhatsApp Communication Log';
      default:
        return 'Juice Shop';
    }
  }, [active]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <div className="relative h-[380px] w-full">
        <HeroCover />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-white/0" />
        <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-7xl px-6 pb-6">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white drop-shadow-sm">{Title}</h1>
              <p className="mt-1 text-white/90">INR currency • Offline-ready • AI Predictions • WhatsApp Billing</p>
            </div>
            <div className="flex gap-2">
              <NavButton id="dashboard" icon={Home} label="Dashboard" />
              <NavButton id="pos" icon={ShoppingCart} label="POS" />
              <NavButton id="manage" icon={Settings} label="Manage" />
              <NavButton id="whatsapp" icon={MessageSquare} label="WhatsApp" />
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto -mt-20 w-full max-w-7xl px-6 pb-20">
        <div className="rounded-xl border border-slate-200 bg-white/90 shadow-lg backdrop-blur">
          {active === 'dashboard' && <Dashboard />}
          {active === 'pos' && <POS />}
          {active === 'manage' && <Management />}
          {active === 'whatsapp' && <WhatsAppLogs />}
        </div>
      </main>
    </div>
  );
}
