import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { debaticaApi } from './debaticaApi';

export default function DebateLibraryPage() {
  const [debates, setDebates] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    debaticaApi.debates().then((r) => setDebates(r.debates || [])).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4">{error}</div>;

  return (
    <div>
      <h2 className="text-3xl font-black">Debate Library</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {debates.map((d) => (
          <button key={d.id} onClick={() => navigate(`/deb/debate/${d.id}`)} className="rounded-2xl border border-white/15 bg-white/5 p-5 text-left hover:bg-white/10">
            <div className="text-sm text-white/70">{d.title}</div>
            <div className="mt-1 text-lg font-bold">{d.motion}</div>
            <div className="mt-2 text-xs text-white/60">Difficulty: {d.difficulty || 'intro'}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
