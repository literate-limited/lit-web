/**
 * Interactive Terminal Component
 *
 * Full terminal emulation using xterm.js with WebSocket connection
 * Supports interactive programs like claude code, vim, htop, etc.
 */
import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import "./InteractiveTerminal.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
// Extract base URL without /api/v1 path for WebSocket
const BASE_URL = API_URL.replace(/\/api\/v[0-9]+$/, "");
const WS_URL = BASE_URL.replace("http", "ws");

const InteractiveTerminal = ({ terminalId }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const wsRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Courier New", monospace',
      theme: {
        background: "#ffffff",
        foreground: "#0f172a",
        cursor: "#0f766e",
        cursorAccent: "#ffffff",
        selection: "rgba(15, 118, 110, 0.3)",
        black: "#1e293b",
        red: "#dc2626",
        green: "#059669",
        yellow: "#d97706",
        blue: "#0284c7",
        magenta: "#7c3aed",
        cyan: "#0f766e",
        white: "#cbd5e1",
        brightBlack: "#475569",
        brightRed: "#f87171",
        brightGreen: "#34d399",
        brightYellow: "#fbbf24",
        brightBlue: "#38bdf8",
        brightMagenta: "#a78bfa",
        brightCyan: "#14b8a6",
        brightWhite: "#f1f5f9",
      },
      allowProposedApi: true,
    });

    // Add fit addon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;

    // Add web links addon
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(webLinksAddon);

    // Open terminal in DOM
    term.open(terminalRef.current);

    // Fit to container
    fitAddon.fit();

    xtermRef.current = term;

    // Connect WebSocket
    const token = localStorage.getItem("token");
    if (!token) {
      term.writeln("\x1b[31mError: No authentication token found\x1b[0m");
      setConnectionStatus("error");
      return;
    }

    const wsUrl = `${WS_URL}/ws/terminal?token=${token}&terminalId=${terminalId || ""}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("connected");
      term.writeln("\x1b[32m✓ Terminal session established\x1b[0m");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case "ready":
            term.writeln(`\x1b[36m✓ Connected to terminal ${msg.terminalId}\x1b[0m`);
            break;

          case "data":
            term.write(msg.data);
            break;

          case "exit":
            term.writeln(`\n\x1b[33m⚠ Process exited with code ${msg.exitCode}\x1b[0m`);
            break;

          case "pong":
            // Keep-alive response
            break;

          default:
            console.warn("Unknown message type:", msg.type);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      term.writeln("\n\x1b[31m✗ Connection error\x1b[0m");
      setConnectionStatus("error");
    };

    ws.onclose = () => {
      term.writeln("\n\x1b[33m✗ Connection closed\x1b[0m");
      setConnectionStatus("disconnected");
    };

    // Handle terminal input
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data }));
      }
    });

    // Handle terminal resize
    const handleResize = () => {
      if (fitAddon && ws.readyState === WebSocket.OPEN) {
        fitAddon.fit();
        const { cols, rows } = term;
        ws.send(JSON.stringify({ type: "resize", cols, rows }));
      }
    };

    // Set up resize observer
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(handleResize, 100);
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    // Keep-alive ping
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    // Cleanup
    return () => {
      clearInterval(pingInterval);
      resizeObserver.disconnect();
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      term.dispose();
    };
  }, [terminalId]);

  // Handle window resize
  useEffect(() => {
    const handleWindowResize = () => {
      if (fitAddonRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        fitAddonRef.current.fit();
        const { cols, rows } = xtermRef.current;
        wsRef.current.send(JSON.stringify({ type: "resize", cols, rows }));
      }
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  return (
    <div className="interactive-terminal-container">
      <div className="terminal-connection-status">
        <span className={`status-indicator status-${connectionStatus}`} />
        <span className="status-text">{connectionStatus}</span>
      </div>
      <div ref={terminalRef} className="interactive-terminal" />
    </div>
  );
};

export default InteractiveTerminal;
