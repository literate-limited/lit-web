import { useEffect, useState } from "react";
import { RiTranslate2, RiArrowRightLine } from "react-icons/ri";
import languages from "../data/languages";
import "./FloatingTranslator.css";

const API_URL = import.meta.env.VITE_API_URL;

function FloatingTranslator() {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [translation, setTranslation] = useState("");
  const [fromLanguage, setFromLanguage] = useState("Detect Input");
  const [toLanguage, setToLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(() => ({
    x: Math.max(window.innerWidth - 90, 16),
    y: Math.max(window.innerHeight - 110, 16),
  }));
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const openListener = () => setOpen(true);
    window.addEventListener("open-translator", openListener);
    return () => window.removeEventListener("open-translator", openListener);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e) => {
      e.preventDefault();
      const nextX = e.clientX - dragOffset.x;
      const nextY = e.clientY - dragOffset.y;
      const maxX = window.innerWidth - 80;
      const maxY = window.innerHeight - 80;
      setPosition({
        x: Math.min(Math.max(8, nextX), maxX),
        y: Math.min(Math.max(8, nextY), maxY),
      });
    };
    const handleUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, dragOffset]);

  const startDrag = (e) => {
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDragging(true);
  };

  const handleTranslate = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) return;

    setTranslation("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch(`${API_URL}/translate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          input_text: inputText,
          from_language: fromLanguage,
          to_language: toLanguage,
          registers: [],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! Status: ${response.status}, Message: ${errorText}`
        );
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Streaming read loop; `reader.read()` controls termination.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setTranslation((prev) => prev + chunk);
      }
    } catch (error) {
      console.error("❌ Translation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  return (
    <div
      className={`translator-fab ${open ? "open" : ""} ${dragging ? "dragging" : ""}`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseDown={startDrag}
    >
      {!open && (
        <button
          type="button"
          className="translator-pill"
          onClick={() => setOpen(true)}
          title="Open translator"
          aria-label="Open translator"
        >
          <span className="pill-glow" />
          <RiTranslate2 className="pill-icon" aria-hidden />
        </button>
      )}

      {open && (
        <div
          className="translator-shell lean"
          role="dialog"
          aria-label="Translation console"
          aria-modal="false"
        >
          <div className="translator-top">
            <div className="language-rail">
              <div className="lang-box">
                <select
                  value={fromLanguage}
                  onChange={(e) => setFromLanguage(e.target.value)}
                  className="ember-select small"
                >
                  {languages.map((lang) => (
                    <option key={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <span className="language-arrow">→</span>
              <div className="lang-box">
                <select
                  value={toLanguage}
                  onChange={(e) => setToLanguage(e.target.value)}
                  className="ember-select small"
                >
                  {languages.map((lang) => (
                    <option key={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              className="translator-close ghost"
              onClick={() => setOpen(false)}
              aria-label="Close translator"
            >
              ×
            </button>
          </div>

          <div className="translator-body">
            <div className="input-with-button">
              <textarea
                className="translation-input compact"
                placeholder="Type or paste to translate..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="translate-btn-embedded"
                onClick={handleTranslate}
                disabled={loading}
                type="button"
                aria-label="Translate"
              >
                <RiArrowRightLine />
              </button>
            </div>
            {translation && (
              <div className="translation-line" aria-live="polite">
                <span className="line-label">Result</span>
                <span className="line-text">{translation}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FloatingTranslator;
