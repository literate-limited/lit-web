/**
 * LiveActivityPanel
 *
 * Real-time feed of all agent activity.
 * Shows events from all agents with filtering and timestamps.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useFlameAgents } from "../../context/FlameAgentContext";
import "./FlameTerminal.css";

const LEVEL_ICONS = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
};

const LEVEL_COLORS = {
  info: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
};

const LiveActivityPanel = () => {
  const {
    activityFeed,
    clearActivityFeed,
    socketConnected,
    connectSocket,
  } = useFlameAgents();

  const [filter, setFilter] = useState("all"); // all, info, success, warning, error
  const [isPaused, setIsPaused] = useState(false);
  const [visibleFeed, setVisibleFeed] = useState([]);
  const feedEndRef = useRef(null);

  // Update visible feed when activity changes (unless paused)
  useEffect(() => {
    if (!isPaused) {
      const filtered = filter === "all"
        ? activityFeed
        : activityFeed.filter((a) => a.level === filter);
      setVisibleFeed(filtered);
    }
  }, [activityFeed, filter, isPaused]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!isPaused) {
      feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [visibleFeed, isPaused]);

  // Connect socket on mount
  useEffect(() => {
    connectSocket();
  }, [connectSocket]);

  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }, []);

  const formatActivityType = useCallback((type) => {
    return type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }, []);

  return (
    <div className="live-activity-panel">
      {/* Controls */}
      <div className="live-controls">
        <div className="live-filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === "info" ? "active" : ""}`}
            onClick={() => setFilter("info")}
            style={{ "--filter-color": LEVEL_COLORS.info }}
          >
            ℹ️
          </button>
          <button
            className={`filter-btn ${filter === "success" ? "active" : ""}`}
            onClick={() => setFilter("success")}
            style={{ "--filter-color": LEVEL_COLORS.success }}
          >
            ✅
          </button>
          <button
            className={`filter-btn ${filter === "warning" ? "active" : ""}`}
            onClick={() => setFilter("warning")}
            style={{ "--filter-color": LEVEL_COLORS.warning }}
          >
            ⚠️
          </button>
          <button
            className={`filter-btn ${filter === "error" ? "active" : ""}`}
            onClick={() => setFilter("error")}
            style={{ "--filter-color": LEVEL_COLORS.error }}
          >
            ❌
          </button>
        </div>

        <div className="live-actions">
          <button
            className={`live-action-btn ${isPaused ? "paused" : ""}`}
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? "▶️" : "⏸️"}
          </button>
          <button
            className="live-action-btn"
            onClick={clearActivityFeed}
            title="Clear feed"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Connection status banner */}
      {!socketConnected && (
        <div className="connection-banner">
          <span>⚠️ Disconnected</span>
          <button onClick={connectSocket}>Reconnect</button>
        </div>
      )}

      {/* Activity Feed */}
      <div className="live-feed">
        {visibleFeed.length === 0 ? (
          <div className="live-empty">
            <span className="empty-icon">📡</span>
            <span className="empty-text">
              {socketConnected
                ? "Waiting for activity..."
                : "Connect to see live activity"}
            </span>
          </div>
        ) : (
          visibleFeed.map((activity, index) => (
            <div
              key={activity.id || index}
              className={`activity-item ${activity.level || "info"}`}
              style={{ "--level-color": LEVEL_COLORS[activity.level] || LEVEL_COLORS.info }}
            >
              <div className="activity-header">
                <span className="activity-icon">
                  {LEVEL_ICONS[activity.level] || LEVEL_ICONS.info}
                </span>
                <span className="activity-type">
                  {formatActivityType(activity.type || activity.activityType || "event")}
                </span>
                <span className="activity-time">
                  {formatTimestamp(activity.timestamp || activity.createdAt)}
                </span>
              </div>
              <div className="activity-message">{activity.message}</div>
              {activity.result?.url && (
                <div className="activity-preview">
                  <img
                    src={activity.result.thumbnailUrl || activity.result.url}
                    alt="Result preview"
                    className="preview-thumb"
                  />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={feedEndRef} />
      </div>

      {/* Stats bar */}
      <div className="live-stats">
        <span className="stat-item">
          {visibleFeed.length} / {activityFeed.length} events
        </span>
        {isPaused && <span className="stat-paused">PAUSED</span>}
      </div>
    </div>
  );
};

export default LiveActivityPanel;
