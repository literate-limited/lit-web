/**
 * DevInspector
 *
 * Provides component inspection functionality in dev mode.
 * - Alt+Click on any element to inspect it
 * - Shows component path, props, and allows feedback
 * - Highlights hovered elements
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useDevMode } from "../../context/DevModeContext";
import { useUser } from "../../context/UserContext";
import "./DevInspector.css";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Try to extract React component info from a DOM element
 * Uses React DevTools internals when available
 */
const getComponentInfo = (element) => {
  if (!element) return null;

  // Try to get React fiber node
  const fiberKey = Object.keys(element).find(
    (key) => key.startsWith("__reactFiber$") || key.startsWith("__reactInternalInstance$")
  );

  let componentName = null;
  let componentPath = null;
  let props = {};

  if (fiberKey) {
    let fiber = element[fiberKey];

    // Walk up the fiber tree to find actual component
    while (fiber) {
      if (fiber.type && typeof fiber.type === "function") {
        componentName = fiber.type.displayName || fiber.type.name || "Anonymous";

        // Try to get source info (only in dev mode with source maps)
        if (fiber._debugSource) {
          componentPath = `${fiber._debugSource.fileName}:${fiber._debugSource.lineNumber}`;
        }

        // Get props (sanitized)
        if (fiber.memoizedProps) {
          props = Object.keys(fiber.memoizedProps).reduce((acc, key) => {
            const val = fiber.memoizedProps[key];
            if (typeof val === "function") {
              acc[key] = "[Function]";
            } else if (typeof val === "object" && val !== null) {
              acc[key] = "[Object]";
            } else {
              acc[key] = val;
            }
            return acc;
          }, {});
        }

        break;
      }
      fiber = fiber.return;
    }
  }

  // Fallback: use element info
  if (!componentName) {
    componentName = element.tagName?.toLowerCase() || "unknown";
    if (element.className) {
      componentName += `.${element.className.split(" ")[0]}`;
    }
  }

  // Generate a component path based on DOM path if we don't have source
  if (!componentPath) {
    const path = [];
    let el = element;
    while (el && el !== document.body) {
      let selector = el.tagName?.toLowerCase() || "";
      if (el.id) selector += `#${el.id}`;
      else if (el.className) selector += `.${el.className.split(" ")[0]}`;
      path.unshift(selector);
      el = el.parentElement;
    }
    componentPath = path.join(" > ");
  }

  return {
    name: componentName,
    path: componentPath,
    props,
    element: {
      tagName: element.tagName,
      id: element.id,
      className: element.className,
      textContent: element.textContent?.slice(0, 100),
    },
  };
};

const DevInspector = () => {
  const { devModeActive, selectElement, feedbackPanelOpen, feedbackTarget, closeFeedback } =
    useDevMode();
  const { getAuthHeaders } = useUser() || {};

  const [hoveredElement, setHoveredElement] = useState(null);
  const [hoverRect, setHoverRect] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState([]);

  const overlayRef = useRef(null);

  // Handle mouse move for hover highlighting
  const handleMouseMove = useCallback(
    (e) => {
      if (!devModeActive || !e.altKey) {
        setHoveredElement(null);
        setHoverRect(null);
        return;
      }

      // Ignore our own overlay elements
      if (e.target.closest(".dev-inspector-overlay") || e.target.closest(".flame-terminal")) {
        return;
      }

      const element = e.target;
      setHoveredElement(element);

      const rect = element.getBoundingClientRect();
      setHoverRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    },
    [devModeActive]
  );

  // Handle click to select element
  const handleClick = useCallback(
    (e) => {
      if (!devModeActive || !e.altKey) return;

      // Ignore our own overlay elements
      if (e.target.closest(".dev-inspector-overlay") || e.target.closest(".flame-terminal")) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const element = e.target;
      const info = getComponentInfo(element);

      selectElement(element, info);
      setHoveredElement(null);
      setHoverRect(null);
    },
    [devModeActive, selectElement]
  );

  // Handle key up to clear hover when Alt is released
  const handleKeyUp = useCallback((e) => {
    if (e.key === "Alt") {
      setHoveredElement(null);
      setHoverRect(null);
    }
  }, []);

  // Attach global listeners
  useEffect(() => {
    if (!devModeActive) return;

    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [devModeActive, handleMouseMove, handleClick, handleKeyUp]);

  // Load existing feedback when target changes
  useEffect(() => {
    if (!feedbackTarget?.path || !feedbackPanelOpen) {
      setExistingFeedback([]);
      return;
    }

    const loadFeedback = async () => {
      try {
        const res = await fetch(
          `${API_URL}/dev/feedback?componentPath=${encodeURIComponent(feedbackTarget.path)}`,
          { headers: getAuthHeaders?.() || {} }
        );
        if (res.ok) {
          const data = await res.json();
          setExistingFeedback(data.feedback || []);
        }
      } catch (err) {
        console.error("Failed to load feedback:", err);
      }
    };

    loadFeedback();
  }, [feedbackTarget, feedbackPanelOpen, getAuthHeaders]);

  // Submit feedback
  const submitFeedback = async () => {
    if (!feedbackText.trim() || !feedbackTarget) return;

    setFeedbackLoading(true);
    try {
      const res = await fetch(`${API_URL}/dev/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getAuthHeaders?.() || {}),
        },
        body: JSON.stringify({
          componentPath: feedbackTarget.path,
          componentName: feedbackTarget.name,
          feedback: feedbackText.trim(),
          url: window.location.pathname,
          elementInfo: feedbackTarget.element,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setExistingFeedback((prev) => [...prev, data.feedback]);
        setFeedbackText("");
      }
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (!devModeActive) return null;

  return (
    <div className="dev-inspector-overlay" ref={overlayRef}>
      {/* Hover highlight box */}
      {hoverRect && (
        <div
          className="inspector-highlight"
          style={{
            top: hoverRect.top,
            left: hoverRect.left,
            width: hoverRect.width,
            height: hoverRect.height,
          }}
        >
          <div className="highlight-label">
            {hoveredElement && getComponentInfo(hoveredElement)?.name}
          </div>
        </div>
      )}

      {/* Feedback Panel */}
      {feedbackPanelOpen && feedbackTarget && (
        <div className="feedback-panel">
          <div className="feedback-header">
            <div className="feedback-title">
              <span className="component-icon">📦</span>
              <span className="component-name">{feedbackTarget.name}</span>
            </div>
            <button className="feedback-close" onClick={closeFeedback}>
              ×
            </button>
          </div>

          <div className="feedback-path">{feedbackTarget.path}</div>

          {/* Existing feedback */}
          {existingFeedback.length > 0 && (
            <div className="existing-feedback">
              <div className="existing-label">Previous feedback:</div>
              {existingFeedback.map((fb, i) => (
                <div key={i} className="feedback-item">
                  <div className="feedback-text">{fb.feedback}</div>
                  <div className="feedback-meta">
                    {fb.userName || "Anonymous"} · {new Date(fb.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New feedback input */}
          <div className="feedback-input-area">
            <textarea
              className="feedback-textarea"
              placeholder="Describe what should change..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={3}
            />
            <div className="feedback-actions">
              <button
                className="feedback-submit"
                onClick={submitFeedback}
                disabled={!feedbackText.trim() || feedbackLoading}
              >
                {feedbackLoading ? "Sending..." : "Submit Feedback"}
              </button>
            </div>
          </div>

          {/* Props preview */}
          {Object.keys(feedbackTarget.props || {}).length > 0 && (
            <div className="props-preview">
              <div className="props-label">Props:</div>
              <pre className="props-code">
                {JSON.stringify(feedbackTarget.props, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Instructions tooltip */}
      {!feedbackPanelOpen && (
        <div className="inspector-tooltip">
          <span className="tooltip-key">Alt</span> + Click to inspect
        </div>
      )}
    </div>
  );
};

export default DevInspector;
