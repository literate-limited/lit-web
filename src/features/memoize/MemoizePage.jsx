import { useMemo, useState } from "react";
import { Upload, ListFilter, Sparkles, Target, Shield, BookOpen } from "lucide-react";
import "./memoize.css";

const PERSONAL_WORDS = ["i ", "me ", "my ", "mine ", "myself", "family", "mom", "dad", "friend"];
const CODE_WORDS = ["function", "class", "const ", "let ", "import ", "export ", "def ", "return", "{", "};", "=>"];
const WANT_WORDS = ["want", "wish", "need", "hope", "would like", "goal", "dream"];
const BELIEF_WORDS = ["believe", "think", "feel", "I think", "I believe", "my view", "opinion"];

const normalizeMessages = (raw) => {
  if (!raw) return [];
  if (typeof raw === "string") {
    return raw.split(/\n+/).map((line) => ({ role: "user", content: line.trim() })).filter((l) => l.content);
  }
  if (Array.isArray(raw)) {
    return raw
      .map((m) => {
        if (typeof m === "string") return { role: "user", content: m };
        if (m && typeof m === "object") return { role: m.role || "user", content: m.content || m.text || "" };
        return null;
      })
      .filter((m) => m && m.content);
  }
  if (raw.messages && Array.isArray(raw.messages)) {
    return normalizeMessages(raw.messages);
  }
  return [];
};

const scoreContains = (text, keywords) =>
  keywords.some((w) => text.toLowerCase().includes(w.toLowerCase()));

const splitIntoSentences = (text) =>
  text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

const crawlHistory = (messages) => {
  const logs = [];
  messages.forEach((m) => {
    const sentences = splitIntoSentences(m.content || "");
    sentences.forEach((s) => {
      if (!s) return;
      logs.push({
        text: s,
        role: m.role || "user",
        isQuestion: s.trim().endsWith("?"),
        personal: scoreContains(s, PERSONAL_WORDS),
        code: scoreContains(s, CODE_WORDS),
        want: scoreContains(s, WANT_WORDS),
        belief: scoreContains(s, BELIEF_WORDS),
      });
    });
  });

  const wants = logs.filter((l) => l.want);
  const questions = logs.filter((l) => l.isQuestion);
  const personal = logs.filter((l) => l.personal);
  const code = logs.filter((l) => l.code);
  const beliefs = logs.filter((l) => l.belief);

  const curated = [...wants, ...questions, ...personal, ...code, ...beliefs, ...logs]
    .filter((item, idx, arr) => {
      // dedupe by text
      return arr.findIndex((a) => a.text === item.text) === idx;
    })
    .slice(0, 20);

  const personalLogs = curated.filter((c) => c.personal);
  const nonPersonal = curated.filter((c) => !c.personal);

  return {
    curated,
    personalLogs,
    nonPersonal,
    wants,
    questions,
    code,
    beliefs,
    totalSentences: logs.length,
  };
};

const Pill = ({ icon, label }) => (
  <span className="memo-chip">
    {icon}
    {label}
  </span>
);

const ExampleHint = () => (
  <div className="memo-card">
    <p className="memo-kicker">How to use</p>
    <h2>Upload your ChatGPT export</h2>
    <p>
      Drop a JSON export or paste text. Memoize will sift wants, desires, anecdotes, beliefs, ideas, code, and
      split personal vs. not. It then curates ~20 items for your memoir log.
    </p>
    <div className="memo-pill-row">
      <Pill icon={<Sparkles size={14} />} label="Wants + ideas" />
      <Pill icon={<Target size={14} />} label="Goals" />
      <Pill icon={<Shield size={14} />} label="Personal sift" />
      <Pill icon={<BookOpen size={14} />} label="Biography log" />
    </div>
  </div>
);

export default function MemoizePage() {
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState("");
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState(null);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result || "";
      setRawText(String(text));
      setFileName(file.name);
    };
    reader.readAsText(file);
  };

  const parsedMessages = useMemo(() => {
    try {
      if (!rawText) return [];
      const asJson = JSON.parse(rawText);
      return normalizeMessages(asJson);
    } catch {
      return normalizeMessages(rawText);
    }
  }, [rawText]);

  const handleCrawl = () => {
    try {
      const res = crawlHistory(parsedMessages);
      setResults(res);
      setErrors(null);
    } catch (err) {
      setErrors(err?.message || "Failed to crawl history");
    }
  };

  return (
    <div className="memo-shell">
      <div className="memo-hero">
        <p className="memo-kicker">Memoize · Memoir crawler</p>
        <h1>Memoize your ChatGPT history</h1>
        <p>Upload, sift, and log your wants, anecdotes, beliefs, ideas, and code. Personal vs non-personal is auto-tagged.</p>
        <div className="memo-flex">
          <label className="memo-btn secondary" htmlFor="memo-file">
            <Upload size={16} />
            Upload export
            <input
              id="memo-file"
              type="file"
              accept=".json,.txt"
              style={{ display: "none" }}
              onChange={onFile}
            />
          </label>
          <button className="memo-btn" type="button" onClick={handleCrawl}>
            <ListFilter size={16} />
            Crawl history
          </button>
          {fileName && <span className="memo-chip">Loaded: {fileName}</span>}
          {parsedMessages.length > 0 && (
            <span className="memo-chip">Messages: {parsedMessages.length}</span>
          )}
        </div>
        <textarea
          className="memo-input"
          rows={5}
          placeholder="Paste your ChatGPT export or transcripts..."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />
      </div>

      {errors && <div className="memo-card" style={{ borderColor: "#fca5a5" }}>{errors}</div>}

      {!results && <ExampleHint />}

      {results && (
        <div className="memo-grid">
          <div className="memo-card">
            <p className="memo-kicker">Curated log</p>
            <h2>Top 20 questions/logs</h2>
            <div className="memo-pill-row">
              <Pill icon={<Sparkles size={14} />} label={`Wants ${results.wants.length}`} />
              <Pill icon={<Target size={14} />} label={`Goals/Questions ${results.questions.length}`} />
              <Pill icon={<Shield size={14} />} label={`Personal ${results.personalLogs.length}`} />
              <Pill icon={<BookOpen size={14} />} label={`Non-personal ${results.nonPersonal.length}`} />
            </div>
            <div className="memo-list">
              {results.curated.map((item, idx) => (
                <div key={`${item.text}-${idx}`} className="memo-item">
                  <div className="memo-pill-row">
                    {item.personal && <Pill icon={<Shield size={12} />} label="Personal" />}
                    {item.isQuestion && <Pill icon={<Target size={12} />} label="Question" />}
                    {item.code && <Pill icon={<BookOpen size={12} />} label="Code-ish" />}
                    {item.want && <Pill icon={<Sparkles size={12} />} label="Want/Desire" />}
                    {item.belief && <Pill icon={<Sparkles size={12} />} label="Belief" />}
                  </div>
                  <div style={{ marginTop: 6, color: "#d7e5f8" }}>{item.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="memo-card">
            <p className="memo-kicker">Cuts</p>
            <h2>Personal vs Non-Personal</h2>
            <table className="memo-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Personal</td>
                  <td>{results.personalLogs.length}</td>
                </tr>
                <tr>
                  <td>Non-personal</td>
                  <td>{results.nonPersonal.length}</td>
                </tr>
                <tr>
                  <td>Questions</td>
                  <td>{results.questions.length}</td>
                </tr>
                <tr>
                  <td>Code-like</td>
                  <td>{results.code.length}</td>
                </tr>
                <tr>
                  <td>Beliefs</td>
                  <td>{results.beliefs.length}</td>
                </tr>
              </tbody>
            </table>
            <p style={{ marginTop: 12, color: "#9db2cc" }}>
              Total sentences scanned: {results.totalSentences}. You can copy the curated log into your memoir, or refine the keywords in code.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
