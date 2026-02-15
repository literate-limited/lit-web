import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDevMode } from "../../context/DevModeContext";
import { FlameAgentProvider } from "../../context/FlameAgentContext";
import "./FlameTerminalTTV.css";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const ChatPanel = ({ onClose, onMinimize, onHeaderMouseDown }) => {
  const { canAccessDevMode } = useDevMode();
  const isDevUser = canAccessDevMode;

  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [attachedScreenshot, setAttachedScreenshot] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState(null);
  const [branchInfo, setBranchInfo] = useState(null);
  const wsRef = useRef(null);
  const inputRef = useRef(null);
  const historyEndRef = useRef(null);

  const wsUrl = useMemo(() => {
    const base = API_URL.replace(/\/api\/v1$/, "");
    return base.replace(/^http/, "ws") + "/ws/terminal";
  }, []);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isDevUser) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_URL}/dev/branch`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.branch) setBranchInfo(data);
      })
      .catch(() => {});
  }, [isDevUser]);

  // Connect to PTY WebSocket
  useEffect(() => {
    if (!isDevUser) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setWsError("Missing auth token");
      return;
    }
    const ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;
    setWsError(null);

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onerror = (e) => {
      setWsError("WebSocket error");
      console.error("Terminal WS error", e);
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "data") {
          setHistory((prev) => [...prev, { type: "output", text: msg.data }]);
        } else if (msg.type === "exit") {
          setHistory((prev) => [...prev, { type: "system", text: `Process exited (${msg.exitCode})` }]);
        } else if (msg.type === "ready") {
          setHistory((prev) => [...prev, { type: "system", text: msg.message || "Terminal ready" }]);
        }
      } catch (err) {
        console.error("WS parse error", err);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [isDevUser, wsUrl]);

  const uploadScreenshot = useCallback(async (dataUrl) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/dev/screenshot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ dataUrl }),
    });
    if (!response.ok) throw new Error(`Upload failed (${response.status})`);
    const json = await response.json();
    return json.url;
  }, []);

  const captureScreenshot = useCallback(async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      const htmlToImage = await import("html-to-image");
      const dataUrl = await htmlToImage.toPng(document.documentElement, { pixelRatio: 2, cacheBust: true });
      let remoteUrl = null;
      try {
        remoteUrl = await uploadScreenshot(dataUrl);
        setAttachedScreenshot({ dataUrl, remoteUrl });
        setInput((prev) => `${prev ? prev + " " : ""}${remoteUrl}`);
        setHistory((prev) => [...prev, { type: "success", text: `Screenshot saved: ${remoteUrl}` }]);
      } catch (err) {
        setHistory((prev) => [...prev, { type: "error", text: `Upload failed: ${err.message}` }]);
      }
    } catch (err) {
      setHistory((prev) => [...prev, { type: "error", text: `Screenshot failed: ${err.message}` }]);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, uploadScreenshot]);

  const handleSend = useCallback(() => {
    const trimmed = input;
    if (!trimmed) return;
    if (!isDevUser) {
      setHistory((prev) => [...prev, { type: "error", text: "Dev role required to use terminal." }]);
      setInput("");
      return;
    }
    setHistory((prev) => [...prev, { type: "input", text: `> ${trimmed}` }]);
    const payload = { type: "input", data: trimmed.endsWith("\n") ? trimmed : `${trimmed}\r` };
    wsRef.current?.send(JSON.stringify(payload));
    setInput("");
  }, [input, isDevUser]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="simple-terminal">
      <div className="simple-terminal-header" onMouseDown={onHeaderMouseDown}>
        <div className="header-title">
          <span className="flame-emoji-small">🔥</span>
          <span>Flame Terminal</span>
        </div>
        <div className="header-actions">
          {branchInfo && (
            <span className="branch-tag" title="Server git branch">
              {branchInfo.branch}@{branchInfo.sha}{branchInfo.dirty ? "*" : ""}
            </span>
          )}
          <button className="header-btn" onClick={captureScreenshot} disabled={isCapturing} title="Attach screenshot">
            📸
          </button>
          <button className="header-btn" onClick={onMinimize} title="Minimize">
            _
          </button>
          <button className="header-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>
      </div>

      <div className="terminal-history simple-screen">
        {!isDevUser && <div className="history-entry error">Dev role required for terminal access.</div>}
        {wsError && <div className="history-entry error">{wsError}</div>}
        {wsConnected ? null : <div className="history-entry info">Connecting to local shell…</div>}
        {history.length === 0 && <div className="history-entry placeholder">Shell output will appear here…</div>}
        {history.map((entry, i) => (
          <div key={i} className={`history-entry ${entry.type}`}>
            {entry.text}
          </div>
        ))}
        <div ref={historyEndRef} />
      </div>

      <div className="simple-input-row">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={wsConnected ? "Send commands to your local shell…" : "Waiting for shell…"}
          spellCheck={false}
          autoComplete="off"
          disabled={!wsConnected}
        />
        <button className="send-btn" onClick={handleSend} disabled={!wsConnected}>
          Send
        </button>
      </div>
    </div>
  );
};

const FlameTerminalInner = () => {
  const { devModeActive, terminalExpanded, setTerminalExpanded } = useDevMode();
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 100 });
  const [size, setSize] = useState({ width: 420, height: 420 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const terminalRef = useRef(null);

  const handleHeaderMouseDown = (e) => {
    if (e.target.closest("button")) return;
    if (!terminalExpanded) setTerminalExpanded(true);
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragOffset.current.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y));
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "`") {
        e.preventDefault();
        setTerminalExpanded((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setTerminalExpanded]);

  return (
    <div
      ref={terminalRef}
      className={`flame-terminal ${terminalExpanded ? "expanded" : "collapsed"} ${devModeActive ? "dev-active" : ""} ${
        isDragging ? "dragging" : ""
      } simple`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        ...(terminalExpanded && { width: `${size.width}px`, height: `${size.height}px` }),
      }}
    >
      {!terminalExpanded && (
        <button className="flame-trigger" onClick={() => setTerminalExpanded(true)} title="Open Flame Terminal (Ctrl+`)">
          <span className="flame-icon">
            <span className="flame-emoji">🔥</span>
            {devModeActive && <span className="dev-indicator" />}
          </span>
        </button>
      )}

      {terminalExpanded && (
        <div className="terminal-container simple-container">
          <ChatPanel
            onClose={() => setTerminalExpanded(false)}
            onMinimize={() => setTerminalExpanded(false)}
            onHeaderMouseDown={handleHeaderMouseDown}
          />
        </div>
      )}
      <div className="ember-glow" />
    </div>
  );
};

const FlameTerminal = () => (
  <FlameAgentProvider>
    <FlameTerminalInner />
  </FlameAgentProvider>
);

export default FlameTerminal;
