import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { debaticaApi } from './debaticaApi';

export default function DebateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [debate, setDebate] = useState(null);
  const [side, setSide] = useState('affirmative');
  const [error, setError] = useState('');

  useEffect(() => {
    debaticaApi.debate(id).then((r) => setDebate(r.debate || null)).catch((e) => setError(e.message));
  }, [id]);

  const start = async () => {
    try {
      const r = await debaticaApi.createAttempt(id, side);
      navigate(`/deb/attempt/${r.attempt.id}`);
    } catch (e) {
      setError(e.message);
    }
  };

  if (error) return <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4">{error}</div>;
  if (!debate) return <div className="text-white/70">Loading…</div>;

  return (
    <div>
      <h2 className="text-2xl font-black">{debate.title}</h2>
      <p className="mt-2 text-lg font-semibold">{debate.motion}</p>
      <div className="mt-6 flex gap-3">
        <button onClick={() => setSide('affirmative')} className={`rounded-lg px-4 py-2 ${side === 'affirmative' ? 'bg-white text-black' : 'border border-white/20 bg-white/5'}`}>Affirmative</button>
        <button onClick={() => setSide('negative')} className={`rounded-lg px-4 py-2 ${side === 'negative' ? 'bg-white text-black' : 'border border-white/20 bg-white/5'}`}>Negative</button>
      </div>
      <button onClick={start} className="mt-6 rounded-xl bg-white px-5 py-2.5 font-semibold text-black">Start attempt</button>
    </div>
  );
}
