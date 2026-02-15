import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { SendHorizonal, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function ChatPage({ user, language = "en" }) {
  /* ---------- state ---------- */
  const [messages, setMessages] = useState([
    { role: "system", content: `You are a helpful ${language} tutor.` },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);

  /* ---------- auto-scroll ---------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------- helpers ---------- */
  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  /* ---------- send ---------- */
  const send = async () => {
    if (!input.trim()) return;

    const nextMsgs = [...messages, { role: "user", content: input.trim() }];
    setMessages(nextMsgs);
    setInput("");
    setBusy(true);

    try {
      const { data } = await axios.post(
        `${API_URL}/chat`,
        { messages: nextMsgs },
        getAuthHeader()
      );
      setMessages([
        ...nextMsgs,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      alert(err.response?.data?.message || "Chat failed");
    } finally {
      setBusy(false);
    }
  };
  /* ---------- click-to-save vocab ---------- */
  const saveWord = async (word) => {
    try {
      await axios.post(
        `${API_URL}/save-word`,
        { word, language, userId: user._id },
        getAuthHeader()
      );
    } catch (err) {
      console.error(err);
    }
  };

  console.log("User in Chat page: ", user);

  /* ---------- render assistant bubble with clickable words ---------- */
  const Bubble = ({ role, children }) => (
    <div
      className={`max-w-[80%] rounded-2xl px-4 py-3 shadow text-sm leading-relaxed whitespace-pre-wrap break-words ${
        role === "user"
          ? "ml-auto bg-teal-600 text-white rounded-br-none"
          : "mr-auto bg-white text-gray-900 rounded-bl-none"
      }`}
    >
      {children}
    </div>
  );

  const renderAssistant = (text) =>
    text.split(/(\s+)/).map((token, idx) => {
      if (/^\s+$/.test(token)) return token; // keep spaces intact
      return (
        <span
          key={idx}
          onClick={() => saveWord(token.replace(/[^\wÀ-ž-]/g, ""))}
          className="cursor-pointer hover:underline decoration-dotted underline-offset-4"
        >
          {token}
        </span>
      );
    });

  /* ---------- ui ---------- */
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-amber-100 to-rose-100">
      {/* header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 shadow-sm">
        <h1 className="text-lg font-semibold tracking-tight">
          Literate • Chat
        </h1>
        <span className="text-xs text-gray-500">
          {language.toUpperCase()}
        </span>
      </header>

      {/* chat list */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.slice(1).map((m, i) => (
          <Bubble role={m.role} key={i}>
            {m.role === "assistant" ? renderAssistant(m.content) : m.content}
          </Bubble>
        ))}
        <div ref={bottomRef} />
      </main>

      {/* input bar */}
      <footer className="sticky bottom-0 w-full bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !busy && send()}
            placeholder="Type your message…"
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white/80"
          />
          <button
            onClick={send}
            disabled={busy}
            className="grid place-items-center w-10 h-10 rounded-full bg-teal-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendHorizonal className="h-4 w-4" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
