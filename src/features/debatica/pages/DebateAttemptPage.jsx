import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { debaticaApi } from './debaticaApi';

const limits = { opening: 350, rebuttal: 250, closing: 200 };
const count = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export default function DebateAttemptPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [text, setText] = useState({ opening: '', rebuttal: '', closing: '' });
  const [active, setActive] = useState('opening');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const r = await debaticaApi.attempt(id);
      setData(r);
      setText({
        opening: r.rounds?.opening?.content || '',
        rebuttal: r.rounds?.rebuttal?.content || '',
        closing: r.rounds?.closing?.content || ''
      });
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, [id]);

  const save = async () => {
    try {
      await debaticaApi.saveRounds(id, text);
    } catch (e) {
      setError(e.message);
    }
  };

  const submit = async () => {
    try {
      await save();
      await debaticaApi.submit(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (error) return <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4">{error}</div>;
  if (!data?.attempt) return <div className="text-white/70">Loading…</div>;

  const wc = count(text[active]);
  const tooLong = wc > limits[active];

  return (
    <div>
      <h2 className="text-2xl font-black">{data.attempt.debateMotion}</h2>
      <div className="mt-3 flex gap-2">
        {['opening', 'rebuttal', 'closing'].map((r) => (
          <button key={r} onClick={() => setActive(r)} className={`rounded-full px-3 py-1.5 text-sm ${active === r ? 'bg-white text-black' : 'bg-white/10'}`}>{r}</button>
        ))}
      </div>
      <textarea
        value={text[active]}
        onChange={(e) => setText({ ...text, [active]: e.target.value })}
        className="mt-4 h-72 w-full rounded-xl border border-white/20 bg-black/30 p-4"
      />
      <div className={`mt-2 text-sm ${tooLong ? 'text-red-200' : 'text-white/70'}`}>{wc}/{limits[active]} words</div>
      <div className="mt-4 flex gap-2">
        <button onClick={save} className="rounded-xl border border-white/20 bg-white/5 px-4 py-2">Save</button>
        <button onClick={submit} disabled={tooLong || data.attempt.status !== 'draft'} className="rounded-xl bg-white px-4 py-2 font-semibold text-black disabled:opacity-50">Submit (1 Lit🔥)</button>
      </div>
    </div>
  );
}
