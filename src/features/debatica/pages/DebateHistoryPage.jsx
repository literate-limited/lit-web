import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { debaticaApi } from './debaticaApi';

export default function DebateHistoryPage() {
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    debaticaApi.attempts().then((r) => setAttempts(r.attempts || [])).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4">{error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-black">History</h2>
      <div className="mt-4 space-y-3">
        {attempts.map((a) => (
          <button key={a.id} onClick={() => navigate(`/deb/attempt/${a.id}`)} className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-left hover:bg-white/10">
            <div className="text-sm text-white/75">{a.debateTitle}</div>
            <div className="text-xs text-white/60">{a.side} · {a.status}</div>
            <div className="mt-1 text-lg font-bold">{a.overallScore ?? '—'}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
