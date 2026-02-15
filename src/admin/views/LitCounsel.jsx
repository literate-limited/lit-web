import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Loader2,
  Mic,
  PauseCircle,
  Plus,
  SendHorizonal,
  Sparkles,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const makeId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

const formatTime = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
};

const Bubble = ({ role, children, meta }) => {
  const isUser = role === "user";

  return (
    <div
      className={`max-w-3xl rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed whitespace-pre-wrap break-words ${
        isUser
          ? "ml-auto bg-gradient-to-br from-amber-500 to-rose-500 text-white rounded-br-none"
          : "mr-auto bg-white/80 text-slate-900 rounded-bl-none border border-slate-100"
      }`}
    >
      <div className="flex items-center gap-2 mb-1 text-xs uppercase tracking-wide">
        <span className="font-semibold">{isUser ? "You" : "Lit Counsel"}</span>
        {meta?.transcribedFromAudio && (
          <span className="px-2 py-0.5 rounded-full bg-black/10 text-[11px]">
            voice → text
          </span>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
};

const DocCard = ({ title, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-4 shadow-sm space-y-2">
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
      <Sparkles className="h-4 w-4 text-amber-600" />
      <span>{title}</span>
    </div>
    {children}
  </div>
);

export default function LitCounsel() {
  const token = localStorage.getItem("token");
  const authHeaders = useMemo(
    () => ({
      Authorization: token ? `Bearer ${token}` : "",
    }),
    [token]
  );

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [transcribing, setTranscribing] = useState(false);
  const [previewText, setPreviewText] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const silenceStartRef = useRef(null);
  const lastVoicePlayedId = useRef(null);

  const chatRef = useRef(null);

  const promptQueueDoc = useMemo(
    () => docs.find((d) => d.slug === "PROMPT_QUEUE"),
    [docs]
  );
  const nonNegotiablesDoc = useMemo(
    () => docs.find((d) => d.slug === "NON_NEGOTIABLES"),
    [docs]
  );

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchSessions = async () => {
    try {
      setError("");
      const { data } = await axios.get(`${API_URL}/admin/lit-counsel/sessions`, {
        headers: authHeaders,
      });
      const list = data.sessions || [];
      setSessions(list);

      if (!activeSessionId && list[0]?._id) {
        setActiveSessionId(list[0]._id);
        loadSession(list[0]._id);
      }
    } catch (err) {
      console.error("Failed to load sessions", err);
      setError(err.response?.data?.message || err.message);
    }
  };

  const loadSession = async (sessionId) => {
    if (!sessionId) return;
    try {
      setLoadingSession(true);
      setError("");
      const { data } = await axios.get(
        `${API_URL}/admin/lit-counsel/sessions/${sessionId}/messages`,
        { headers: authHeaders }
      );
      setActiveSessionId(sessionId);
      setMessages(data.messages || []);
      setDocs(data.docs || []);
      if (voiceMode) startVoiceRecorder();
    } catch (err) {
      console.error("Failed to load session", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoadingSession(false);
    }
  };

  const createSession = async () => {
    try {
      setError("");
      const { data } = await axios.post(
        `${API_URL}/admin/lit-counsel/sessions`,
        { title: "New Counsel" },
        { headers: authHeaders }
      );
      const session = data.session;
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session._id);
      setMessages([]);
      await loadSession(session._id);
      return session;
    } catch (err) {
      console.error("Failed to create session", err);
      setError(err.response?.data?.message || err.message);
    }
    return null;
  };

  const mutateDocItems = async (slug, updater) => {
    const doc = docs.find((d) => d.slug === slug);
    if (!doc) return;
    const nextItems = updater(doc.data?.items || []);
    const nextData = { ...(doc.data || {}), items: nextItems };

    const { data } = await axios.put(
      `${API_URL}/admin/lit-counsel/docs/${slug}`,
      { data: nextData },
      { headers: authHeaders }
    );

    setDocs((prev) =>
      prev.map((d) => (d.slug === slug ? data.doc || d : d))
    );
  };

  const addPrompt = async (text) => {
    if (!text?.trim()) return;
    await mutateDocItems("PROMPT_QUEUE", (items) => [
      ...items,
      { id: makeId(), title: text.trim(), createdAt: new Date().toISOString() },
    ]);
  };

  const removePrompt = async (id) => {
    await mutateDocItems("PROMPT_QUEUE", (items) =>
      items.filter((item) => item.id !== id)
    );
  };

  const addNonNegotiable = async (text) => {
    if (!text?.trim()) return;
    await mutateDocItems("NON_NEGOTIABLES", (items) => [
      ...items,
      { id: makeId(), text: text.trim() },
    ]);
  };

  const handleSend = async (override) => {
    const textToSend = override?.text ?? input;
    const blobToSend = override?.blob ?? recordingBlob;
    if (!textToSend?.trim() && !blobToSend) return;
    let sessionId = activeSessionId;
    if (!sessionId) {
      const created = await createSession();
      sessionId = created?._id;
    }
    if (!sessionId) return;
    try {
      setSending(true);
      setError("");
      const fd = new FormData();
      if (textToSend?.trim()) fd.append("text", textToSend.trim());
      if (blobToSend) {
        const voiceFile = new File(
          [blobToSend],
          "voice-message.webm",
          { type: blobToSend.type || "audio/webm" }
        );
        fd.append("audio", voiceFile);
      }
      fd.append("tts", "true");

      const { data } = await axios.post(
        `${API_URL}/admin/lit-counsel/sessions/${sessionId}/messages`,
        fd,
        {
          headers: {
            ...authHeaders,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessages((prev) => [
        ...prev,
        data.userMessage,
        data.assistantMessage,
      ]);
      setSessions((prev) =>
        prev.map((s) => (s._id === sessionId ? { ...s, ...data.session } : s))
      );
      setInput("");
      setRecordingBlob(null);
      setPreviewText("");

      const playbackPromise =
        data.assistantTts?.base64 && data.assistantMessage?._id
          ? playTts(data.assistantTts, data.assistantMessage._id)
          : data.assistantTts?.base64
          ? playTts(data.assistantTts)
          : null;

      if (voiceMode) {
        if (playbackPromise?.then) {
          await playbackPromise;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
        startVoiceRecorder();
      } else if (playbackPromise?.catch) {
        playbackPromise.catch(() => {});
      }
    } catch (err) {
      console.error("Send message failed", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setSending(false);
    }
  };

  const handleTranscribe = async (blob) => {
    if (!blob) return;
    try {
      setTranscribing(true);
      const fd = new FormData();
      const voiceFile = new File(
        [blob],
        "voice-snippet.webm",
        { type: blob.type || "audio/webm" }
      );
      fd.append("audio", voiceFile);
      const { data } = await axios.post(
        `${API_URL}/admin/lit-counsel/voice/transcribe`,
        fd,
        {
          headers: {
            ...authHeaders,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setPreviewText(data.text || "");
      if (!input.trim()) {
        setInput(data.text || "");
      }
    } catch (err) {
      console.error("Transcription failed", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setTranscribing(false);
    }
  };

  const queueDraftRef = useRef(null);
  const nonNegDraftRef = useRef(null);

  const queueItems = promptQueueDoc?.data?.items || [];
  const nonNegItems = nonNegotiablesDoc?.data?.items || [];

  const teardownAudio = () => {
    try {
      mediaRecorderRef.current?.stop();
    } catch (_) {}
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    mediaStreamRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    silenceStartRef.current = null;
    setListening(false);
  };

  const playTts = (audioPayload, messageId) => {
    if (!audioPayload?.base64 || audioPayload?.pruned) return null;
    const playbackId = messageId || audioPayload?.id || `${Date.now()}`;
    if (lastVoicePlayedId.current === playbackId) return null;
    lastVoicePlayedId.current = playbackId;
    const url = `data:${audioPayload.mime || "audio/mpeg"};base64,${audioPayload.base64}`;
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.onended = resolve;
      audio.onerror = resolve;
      audio.play().catch(() => resolve());
    });
  };

  const stopRecordingAndSend = () => {
    const rec = mediaRecorderRef.current;
    if (!rec || rec.state !== "recording") return;
    try {
      rec.stop();
    } catch (_) {}
  };

  const startVoiceRecorder = async () => {
    try {
      if (listening || !voiceMode) return;
      const stream =
        mediaStreamRef.current ||
        (await navigator.mediaDevices.getUserMedia({ audio: true }));
      mediaStreamRef.current = stream;

      const audioCtx =
        audioCtxRef.current ||
        new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      let chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        setListening(false);
        const blob = new Blob(chunks, { type: "audio/webm" });
        chunks = [];
        if (blob.size > 1500) {
          setRecordingBlob(blob);
          handleTranscribe(blob);
          handleSend({ blob });
        } else if (voiceMode) {
          setTimeout(startVoiceRecorder, 400);
        }
      };

      recorder.start();
      setListening(true);
      silenceStartRef.current = Date.now();

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const checkSilence = () => {
        if (!voiceMode || recorder.state !== "recording") return;
        analyser.getByteTimeDomainData(buffer);
        const maxDeviation = buffer.reduce(
          (max, v) => Math.max(max, Math.abs(v - 128)),
          0
        );
        const now = Date.now();
        if (maxDeviation > 8) {
          silenceStartRef.current = now;
        }
        if (now - (silenceStartRef.current || now) > 2000) {
          stopRecordingAndSend();
          return;
        }
        requestAnimationFrame(checkSilence);
      };
      requestAnimationFrame(checkSilence);
    } catch (err) {
      console.error("Voice mode error", err);
      setError("Microphone unavailable");
      setVoiceMode(false);
      teardownAudio();
    }
  };

  useEffect(() => {
    if (voiceMode) {
      startVoiceRecorder();
    } else {
      teardownAudio();
    }
    return () => teardownAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 text-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Lit Counsel</h1>
            <p className="text-sm text-slate-200/80">
              Voice-first admin-only studio for your personal agent.
            </p>
          </div>
          <button
            onClick={createSession}
            className="inline-flex items-center gap-2 rounded-full bg-white text-slate-900 px-4 py-2 shadow-lg hover:-translate-y-0.5 transition"
          >
            <Plus className="h-4 w-4" />
            New Thread
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-100/80 text-rose-800 px-4 py-2 text-sm border border-rose-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Sessions list */}
          <div className="lg:col-span-3 space-y-3">
            <DocCard title="Threads">
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {sessions.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => loadSession(s._id)}
                    className={`w-full text-left rounded-xl border px-3 py-2 transition ${
                      s._id === activeSessionId
                        ? "border-amber-400 bg-amber-50 text-slate-900"
                        : "border-slate-200 hover:border-amber-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{formatTime(s.updatedAt || s.lastMessageAt)}</span>
                      <span className="uppercase tracking-wide">Chat</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {s.title || "Untitled"}
                    </div>
                    {s.lastMessage?.content && (
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                        {s.lastMessage.content}
                      </p>
                    )}
                  </button>
                ))}
                {sessions.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No conversations yet. Start a new thread to talk to Lit Counsel.
                  </p>
                )}
              </div>
            </DocCard>

            <DocCard title="Non‑Negotiables">
              <div className="space-y-2">
                {nonNegItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg bg-slate-50/70 text-slate-900 px-3 py-2 text-xs border border-slate-200"
                  >
                    {item.text}
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    ref={nonNegDraftRef}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 bg-white"
                    placeholder="Add another guardrail"
                  />
                  <button
                    onClick={() => {
                      const text = nonNegDraftRef.current?.value || "";
                      addNonNegotiable(text);
                      if (nonNegDraftRef.current) nonNegDraftRef.current.value = "";
                    }}
                    className="rounded-lg bg-amber-500 text-white px-3 py-2 text-xs"
                  >
                    Add
                  </button>
                </div>
              </div>
            </DocCard>

            <DocCard title="Prompt Queue">
              <div className="space-y-2">
                {queueItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 flex items-start gap-2"
                  >
                    <span className="text-amber-600 font-semibold">{idx + 1}.</span>
                    <div className="flex-1">{item.title || item.text}</div>
                    <button
                      onClick={() => removePrompt(item.id)}
                      className="text-slate-400 hover:text-rose-500"
                      aria-label="Remove prompt"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-2">
                  <input
                    ref={queueDraftRef}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 bg-white"
                    placeholder="Next thing to ask the agent"
                  />
                  <button
                    onClick={() => {
                      const text = queueDraftRef.current?.value || "";
                      addPrompt(text);
                      if (queueDraftRef.current) queueDraftRef.current.value = "";
                    }}
                    className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-xs"
                  >
                    Queue
                  </button>
                </div>
              </div>
            </DocCard>
          </div>

          {/* Chat panel */}
          <div className="lg:col-span-6 rounded-3xl bg-white/10 border border-white/10 backdrop-blur shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-200">
                  Lit Counsel
                </p>
                <h2 className="text-lg font-semibold text-white">
                  {sessions.find((s) => s._id === activeSessionId)?.title ||
                    "New Counsel"}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setVoiceMode((v) => !v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                    voiceMode
                      ? "bg-emerald-400 text-emerald-950 border-emerald-200"
                      : "bg-white/10 text-white border-white/30"
                  }`}
                >
                  {voiceMode ? "Voice: On" : "Voice: Off"}
                </button>
                {loadingSession && (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                )}
              </div>
            </div>

            <div
              ref={chatRef}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-white/5"
            >
              {messages.map((m) => (
                <Bubble key={m._id} role={m.role} meta={m.meta}>
                  {m.content}
                </Bubble>
              ))}
              {messages.length === 0 && (
                <p className="text-sm text-amber-100/70">
                  Start a conversation — Lit Counsel will remember this thread and keep your
                  guardrails in mind.
                </p>
              )}
            </div>

            <div className="border-t border-white/10 bg-white/5 px-4 py-3 space-y-2">
              {previewText && (
                <div className="text-xs text-amber-100/80">
                  Whisper heard: <span className="font-semibold text-white">{previewText}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Speak or type to Lit Counsel…"
                    className="flex-1 bg-transparent focus:outline-none text-slate-900 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !sending) handleSend();
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="p-2 rounded-full bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SendHorizonal className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (voiceMode && listening) {
                        stopRecordingAndSend();
                      } else if (voiceMode) {
                        startVoiceRecorder();
                      } else {
                        setVoiceMode(true);
                      }
                    }}
                    className={`p-3 rounded-full border transition ${
                      listening
                        ? "border-rose-400 bg-rose-50 text-rose-700"
                        : "border-white/40 bg-white/10 text-white hover:bg-white/20"
                    }`}
                    title="Toggle voice"
                  >
                    {listening ? <PauseCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                  {recordingBlob && !listening && (
                    <button
                      onClick={() => {
                        setRecordingBlob(null);
                        setPreviewText("");
                      }}
                      className="text-xs text-slate-200 hover:text-white"
                    >
                      Clear clip
                    </button>
                  )}
                  {(listening || transcribing) && (
                    <span className="text-[12px] text-amber-100">
                      {transcribing ? "Transcribing…" : "Listening…"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Doc panel right on desktop */}
          <div className="lg:col-span-3 space-y-3">
            <DocCard title="Lit Counsel Docs">
              <p className="text-xs text-slate-700">
                Docs are writable by the agent and by you. Lit Counsel sees them on every turn.
              </p>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Docs loaded</span>
                  <span className="font-semibold text-slate-900">{docs.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Queue items</span>
                  <span className="font-semibold text-slate-900">
                    {queueItems.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Non‑negotiables</span>
                  <span className="font-semibold text-slate-900">
                    {nonNegItems.length}
                  </span>
                </div>
              </div>
            </DocCard>
          </div>
        </div>
      </div>
    </div>
  );
}
