/**
 * FlameTerminalTabs
 *
 * Tab bar for the multi-pane Flame Terminal.
 * Displays Live, Chat, and Agent tabs with add button.
 */
import { useState, useCallback } from "react";
import { useFlameAgents, TAB_TYPES } from "../../context/FlameAgentContext";
import "./FlameTerminal.css";

const AGENT_TYPES = [
  { type: "image", icon: "🖼️", name: "Image Gen" },
  { type: "audio", icon: "🔊", name: "Audio Gen" },
  { type: "text", icon: "📝", name: "Text Gen" },
  { type: "code", icon: "💻", name: "Code Gen" },
];

const FlameTerminalTabs = () => {
  const {
    tabs,
    activeTabId,
    setActiveTabId,
    closeTab,
    createAgent,
    socketConnected,
  } = useFlameAgents();

  const [showNewAgentMenu, setShowNewAgentMenu] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleTabClick = useCallback((tabId) => {
    setActiveTabId(tabId);
  }, [setActiveTabId]);

  const handleCloseTab = useCallback((e, tabId) => {
    e.stopPropagation();
    closeTab(tabId);
  }, [closeTab]);

  const handleCreateAgent = useCallback(async (agentType) => {
    if (isCreating) return;

    try {
      setIsCreating(true);
      setShowNewAgentMenu(false);
      await createAgent(agentType.type, agentType.name);
    } catch (err) {
      console.error("Failed to create agent:", err);
    } finally {
      setIsCreating(false);
    }
  }, [createAgent, isCreating]);

  const getTabIcon = (tab) => {
    switch (tab.type) {
      case TAB_TYPES.LIVE:
        return "📡";
      case TAB_TYPES.CHAT:
        return "💬";
      case TAB_TYPES.AGENT:
        return "🤖";
      default:
        return "📄";
    }
  };

  return (
    <div className="flame-tabs">
      <div className="flame-tabs-list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`flame-tab ${activeTabId === tab.id ? "active" : ""} ${tab.type}`}
            onClick={() => handleTabClick(tab.id)}
            title={tab.name}
          >
            <span className="tab-icon">{getTabIcon(tab)}</span>
            <span className="tab-name">{tab.name.replace(/^[^\s]+\s*/, "")}</span>
            {tab.closable && (
              <button
                className="tab-close"
                onClick={(e) => handleCloseTab(e, tab.id)}
                title="Close tab"
              >
                ×
              </button>
            )}
          </button>
        ))}

        {/* Add Agent Button */}
        <div className="flame-tab-add-container">
          <button
            className="flame-tab-add"
            onClick={() => setShowNewAgentMenu(!showNewAgentMenu)}
            disabled={isCreating}
            title="Spawn new agent"
          >
            {isCreating ? "⏳" : "+"}
          </button>

          {showNewAgentMenu && (
            <div className="new-agent-menu">
              <div className="new-agent-menu-header">Spawn Agent</div>
              {AGENT_TYPES.map((agentType) => (
                <button
                  key={agentType.type}
                  className="new-agent-option"
                  onClick={() => handleCreateAgent(agentType)}
                >
                  <span className="agent-icon">{agentType.icon}</span>
                  <span className="agent-name">{agentType.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="flame-tabs-status">
        <span
          className={`connection-dot ${socketConnected ? "connected" : "disconnected"}`}
          title={socketConnected ? "Connected" : "Disconnected"}
        />
      </div>
    </div>
  );
};

export default FlameTerminalTabs;
