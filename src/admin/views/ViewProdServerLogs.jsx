import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { FiActivity, FiPause, FiPlay, FiTrash2 } from "react-icons/fi";

const MAX_UI_LOGS = 1000;
const LEVELS = ["info", "warn", "error", "security"];
const SOURCES = ["api", "socket", "db", "auth", "server"];

const LEVEL_STYLES = {
  info: "text-slate-200",
  warn: "text-amber-400",
  error: "text-red-400",
  security: "text-purple-400",
};

const STATUS_STYLES = {
  connected: "bg-emerald-100 text-emerald-700",
  reconnecting: "bg-amber-100 text-amber-700",
  disconnected: "bg-red-100 text-red-700",
  connecting: "bg-slate-100 text-slate-600",
};

function resolveSocketBaseUrl() {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (!import.meta.env.VITE_API_URL) return "http://localhost:8000";
  return import.meta.env.VITE_API_URL.replace(/\/api(\/v1)?\/?$/, "");
}

function formatTimestamp(timestamp) {
  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (err) {
    return timestamp;
  }
}

function formatMeta(meta) {
  if (!meta) return "";
  try {
    const text = JSON.stringify(meta);
    if (text.length > 320) return `${text.slice(0, 320)}...`;
    return text;
  } catch (err) {
    return "";
  }
}

export default function ViewProdServerLogs() {
  const [logs, setLogs] = useState([]);
  const [queuedLogs, setQueuedLogs] = useState([]);
  const [status, setStatus] = useState("connecting");
  const [autoScroll, setAutoScroll] = useState(true);
  const [paused, setPaused] = useState(false);

  const [levelFilters, setLevelFilters] = useState(
    LEVELS.reduce((acc, level) => ({ ...acc, [level]: true }), {})
  );
  const [sourceFilters, setSourceFilters] = useState(
    SOURCES.reduce((acc, source) => ({ ...acc, [source]: true }), {})
  );

  const socketRef = useRef(null);
  const logEndRef = useRef(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setStatus("disconnected");
      return undefined;
    }

    const baseUrl = resolveSocketBaseUrl();
    const socket = io(`${baseUrl}/admin-logs`, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
    });

    socketRef.current = socket;
    setStatus("connecting");

    const handleConnect = () => setStatus("connected");
    const handleDisconnect = () => setStatus("disconnected");
    const handleReconnectAttempt = () => setStatus("reconnecting");
    const handleConnectError = () => setStatus("reconnecting");

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.io.on("reconnect_attempt", handleReconnectAttempt);
    socket.on("connect_error", handleConnectError);

    socket.on("admin_logs_snapshot", (snapshot = []) => {
      setQueuedLogs([]);
      setLogs(snapshot.slice(-MAX_UI_LOGS));
    });

    socket.on("admin_log", (logEvent) => {
      if (!logEvent) return;
      if (pausedRef.current) {
        setQueuedLogs((prev) => [...prev, logEvent].slice(-MAX_UI_LOGS));
        return;
      }
      setLogs((prev) => [...prev, logEvent].slice(-MAX_UI_LOGS));
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!autoScroll) return;
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, autoScroll]);

  const filteredLogs = useMemo(
    () =>
      logs.filter(
        (log) => levelFilters[log.level] && sourceFilters[log.source]
      ),
    [logs, levelFilters, sourceFilters]
  );

  const statusLabel = status === "reconnecting" ? "Reconnecting" : status;

  const toggleLevel = (level) => {
    setLevelFilters((prev) => ({ ...prev, [level]: !prev[level] }));
  };

  const toggleSource = (source) => {
    setSourceFilters((prev) => ({ ...prev, [source]: !prev[source] }));
  };

  const handlePauseToggle = () => {
    if (paused) {
      setLogs((prev) =>
        [...prev, ...queuedLogs].slice(-MAX_UI_LOGS)
      );
      setQueuedLogs([]);
      setPaused(false);
      return;
    }
    setPaused(true);
  };

  const handleClear = () => {
    setLogs([]);
    setQueuedLogs([]);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Prod Server Logs
          </h1>
          <p className="text-sm text-slate-500">
            Live, read-only stream from production. Admin access only.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full ${STATUS_STYLES[status] || STATUS_STYLES.connecting}`}
          >
            {statusLabel}
          </span>
          <span className="text-xs text-slate-500">
            {filteredLogs.length} shown
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="bg-slate-950 text-slate-100 rounded-xl border border-slate-800 h-[60vh] overflow-y-auto p-4 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="text-slate-500">
              No logs yet. Waiting for production events...
            </div>
          ) : (
            filteredLogs.map((log, index) => {
              const metaText = formatMeta(log.meta);
              return (
                <div
                  key={`${log.timestamp}-${index}`}
                  className="py-1 border-b border-slate-900/60 last:border-b-0"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="text-slate-500">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <span className={`uppercase ${LEVEL_STYLES[log.level]}`}>
                      {log.level}
                    </span>
                    <span className="text-slate-400">{log.source}</span>
                    <span className="text-slate-100">{log.message}</span>
                    {metaText ? (
                      <span className="text-slate-500">{metaText}</span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
          <div ref={logEndRef} />
        </div>

        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Stream</span>
              <FiActivity className="text-slate-400" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePauseToggle}
                className="inline-flex items-center gap-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-100"
              >
                {paused ? <FiPlay /> : <FiPause />}
                {paused ? "Resume" : "Pause"}
              </button>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  className="accent-slate-700"
                  checked={autoScroll}
                  onChange={(event) => setAutoScroll(event.target.checked)}
                />
                Auto-scroll
              </label>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              {paused
                ? `Paused (${queuedLogs.length} queued)`
                : "Streaming live updates"}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-sm font-semibold text-slate-700">Level</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {LEVELS.map((level) => (
                <label
                  key={level}
                  className="flex items-center gap-2 text-xs text-slate-600"
                >
                  <input
                    type="checkbox"
                    checked={levelFilters[level]}
                    onChange={() => toggleLevel(level)}
                    className="accent-slate-700"
                  />
                  <span className={LEVEL_STYLES[level]}>{level}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-sm font-semibold text-slate-700">Source</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {SOURCES.map((source) => (
                <label
                  key={source}
                  className="flex items-center gap-2 text-xs text-slate-600"
                >
                  <input
                    type="checkbox"
                    checked={sourceFilters[source]}
                    onChange={() => toggleSource(source)}
                    className="accent-slate-700"
                  />
                  <span className="text-slate-500">{source}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-100"
          >
            <FiTrash2 />
            Clear logs
          </button>
        </div>
      </div>
    </div>
  );
}
