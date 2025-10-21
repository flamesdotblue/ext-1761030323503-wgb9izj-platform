import { useEffect, useState } from 'react';
import { getWhatsAppLogs, sendDailySummaryNow } from './dataModel';

export default function WhatsAppLogs() {
  const [logs, setLogs] = useState(getWhatsAppLogs());

  useEffect(() => {
    const i = setInterval(() => setLogs(getWhatsAppLogs()), 2000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">WhatsApp Messages</h3>
        <button
          onClick={() => {
            sendDailySummaryNow();
            setLogs(getWhatsAppLogs());
            alert('Daily summary queued.');
          }}
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Send Daily Summary Now
        </button>
      </div>
      <div className="space-y-2 text-sm">
        {logs.length === 0 && <p className="text-slate-500">No messages yet.</p>}
        {logs.map((l, idx) => (
          <div key={idx} className="rounded-md border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">{new Date(l.time).toLocaleString()}</div>
              <div className="text-xs text-slate-500">To: {l.to || 'Owner'}</div>
            </div>
            <p className="mt-1 whitespace-pre-wrap">{l.message}</p>
            <p className="mt-1 text-xs text-slate-500">Template: {l.template}</p>
            <p className="text-[11px] text-slate-400">Status: {l.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
