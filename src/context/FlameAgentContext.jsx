/**
 * FlameAgentContext
 *
 * Global state management for agent tabs, socket connections, and activity feed.
 * Provides real-time updates for the Flame Terminal multi-tab interface.
 */
import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { io } from "socket.io-client";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const SOCKET_URL = API_URL.replace("/api/v2", "").replace(/\/$/, "") || "http://localhost:8000";

const FlameAgentContext = createContext(null);

// Tab types
export const TAB_TYPES = {
  LIVE: "live",
  CHAT: "chat",
  AGENT: "agent",
};

// Initial tabs
const INITIAL_TABS = [
  { id: "live", type: TAB_TYPES.LIVE, name: "📡 Live", closable: false },
  { id: "chat", type: TAB_TYPES.CHAT, name: "💬 Chat", closable: false },
];

export const FlameAgentProvider = ({ children }) => {
  // Tab state
  const [tabs, setTabs] = useState(INITIAL_TABS);
  const [activeTabId, setActiveTabId] = useState("chat"); // Start on Chat tab

  // Agent state
  const [agents, setAgents] = useState([]);
  const [agentSuggestions, setAgentSuggestions] = useState({}); // { agentId: [suggestions] }
  const [agentGenerations, setAgentGenerations] = useState({}); // { agentId: [generations] }

  // Activity feed
  const [activityFeed, setActivityFeed] = useState([]);
  const MAX_ACTIVITY_ITEMS = 500;

  // Socket connection
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Initialize socket connection
   */
  const connectSocket = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (socketRef.current?.connected) return;

    const socket = io(`${SOCKET_URL}/dev-agents`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("subscribe_activity");
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.warn("Agent socket connection error:", err.message);
      setSocketConnected(false);
    });

    // Activity events
    socket.on("agent_activity", (activity) => {
      setActivityFeed((prev) => {
        const updated = [{ ...activity, id: Date.now() }, ...prev];
        return updated.slice(0, MAX_ACTIVITY_ITEMS);
      });
    });

    // Suggestion events
    socket.on("suggestion_generated", ({ agentId, suggestion }) => {
      setAgentSuggestions((prev) => ({
        ...prev,
        [agentId]: [suggestion, ...(prev[agentId] || [])],
      }));
    });

    // Generation events
    socket.on("generation_progress", ({ agentId, generationId, progress, status }) => {
      setAgentGenerations((prev) => {
        const agentGens = prev[agentId] || [];
        const updated = agentGens.map((g) =>
          g._id === generationId ? { ...g, progress, status } : g
        );
        return { ...prev, [agentId]: updated };
      });
    });

    socket.on("generation_complete", ({ agentId, generation }) => {
      setAgentGenerations((prev) => {
        const agentGens = prev[agentId] || [];
        const existing = agentGens.find((g) => g._id === generation._id);
        if (existing) {
          return {
            ...prev,
            [agentId]: agentGens.map((g) => (g._id === generation._id ? generation : g)),
          };
        }
        return { ...prev, [agentId]: [generation, ...agentGens] };
      });
    });

    socket.on("generation_error", ({ agentId, generationId, error }) => {
      setAgentGenerations((prev) => {
        const agentGens = prev[agentId] || [];
        const updated = agentGens.map((g) =>
          g._id === generationId ? { ...g, status: "error", error: { message: error } } : g
        );
        return { ...prev, [agentId]: updated };
      });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  /**
   * Disconnect socket
   */
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    }
  }, []);

  /**
   * Join agent room for specific updates
   */
  const joinAgentRoom = useCallback((agentId) => {
    if (socketRef.current?.connected && agentId) {
      socketRef.current.emit("join_agent", agentId);
    }
  }, []);

  /**
   * Leave agent room
   */
  const leaveAgentRoom = useCallback((agentId) => {
    if (socketRef.current?.connected && agentId) {
      socketRef.current.emit("leave_agent", agentId);
    }
  }, []);

  /**
   * Fetch user's agents from API
   */
  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/dev/agents`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch agents");

      const { agents: fetchedAgents } = await response.json();
      setAgents(fetchedAgents || []);

      // Create tabs for active agents
      const agentTabs = (fetchedAgents || []).map((agent) => ({
        id: agent.id,
        type: TAB_TYPES.AGENT,
        name: `🤖 ${agent.name || agent.agentType}`,
        agentId: agent.id,
        agentType: agent.agentType,
        closable: true,
      }));

      setTabs((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const newTabs = agentTabs.filter((t) => !existingIds.has(t.id));
        return [...prev, ...newTabs];
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new agent
   */
  const createAgent = useCallback(async (agentType, name, config = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/dev/agents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ agentType, name, config }),
      });

      if (!response.ok) throw new Error("Failed to create agent");

      const { agent } = await response.json();

      // Add to agents list
      setAgents((prev) => [agent, ...prev]);

      // Create tab for new agent
      const newTab = {
        id: agent.id,
        type: TAB_TYPES.AGENT,
        name: `🤖 ${agent.name || agent.agentType}`,
        agentId: agent.id,
        agentType: agent.agentType,
        closable: true,
      };

      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(agent.id);

      // Join agent room
      joinAgentRoom(agent.id);

      return agent;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [joinAgentRoom]);

  /**
   * Delete an agent
   */
  const deleteAgent = useCallback(async (agentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/dev/agents/${agentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete agent");

      // Remove from state
      setAgents((prev) => prev.filter((a) => a.id !== agentId));
      setTabs((prev) => prev.filter((t) => t.id !== agentId));

      // Leave room
      leaveAgentRoom(agentId);

      // Switch to chat tab if deleted agent was active
      if (activeTabId === agentId) {
        setActiveTabId("chat");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [activeTabId, leaveAgentRoom]);

  /**
   * Close a tab
   */
  const closeTab = useCallback((tabId) => {
    setTabs((prev) => {
      const tab = prev.find((t) => t.id === tabId);
      if (!tab?.closable) return prev;

      // Leave agent room if it's an agent tab
      if (tab.type === TAB_TYPES.AGENT && tab.agentId) {
        leaveAgentRoom(tab.agentId);
      }

      return prev.filter((t) => t.id !== tabId);
    });

    // Switch tab if closing active
    if (activeTabId === tabId) {
      setActiveTabId("chat");
    }
  }, [activeTabId, leaveAgentRoom]);

  /**
   * Add activity to feed (for local events)
   */
  const addActivity = useCallback((activity) => {
    setActivityFeed((prev) => {
      const updated = [{ ...activity, id: Date.now(), timestamp: new Date() }, ...prev];
      return updated.slice(0, MAX_ACTIVITY_ITEMS);
    });
  }, []);

  /**
   * Clear activity feed
   */
  const clearActivityFeed = useCallback(() => {
    setActivityFeed([]);
  }, []);

  /**
   * Get active tab
   */
  const activeTab = useMemo(() => {
    return tabs.find((t) => t.id === activeTabId) || tabs[0];
  }, [tabs, activeTabId]);

  // Context value
  const value = useMemo(() => ({
    // Tab management
    tabs,
    activeTabId,
    activeTab,
    setActiveTabId,
    closeTab,

    // Agent management
    agents,
    createAgent,
    deleteAgent,
    fetchAgents,

    // Suggestions and generations
    agentSuggestions,
    setAgentSuggestions,
    agentGenerations,
    setAgentGenerations,

    // Activity feed
    activityFeed,
    addActivity,
    clearActivityFeed,

    // Socket
    socketConnected,
    connectSocket,
    disconnectSocket,
    joinAgentRoom,
    leaveAgentRoom,

    // Status
    loading,
    error,
    setError,
  }), [
    tabs,
    activeTabId,
    activeTab,
    closeTab,
    agents,
    createAgent,
    deleteAgent,
    fetchAgents,
    agentSuggestions,
    agentGenerations,
    activityFeed,
    addActivity,
    clearActivityFeed,
    socketConnected,
    connectSocket,
    disconnectSocket,
    joinAgentRoom,
    leaveAgentRoom,
    loading,
    error,
  ]);

  return (
    <FlameAgentContext.Provider value={value}>
      {children}
    </FlameAgentContext.Provider>
  );
};

export const useFlameAgents = () => {
  const context = useContext(FlameAgentContext);
  if (!context) {
    // Return safe defaults if not wrapped in provider
    return {
      tabs: INITIAL_TABS,
      activeTabId: "chat",
      activeTab: INITIAL_TABS[1],
      setActiveTabId: () => {},
      closeTab: () => {},
      agents: [],
      createAgent: async () => {},
      deleteAgent: async () => {},
      fetchAgents: async () => {},
      agentSuggestions: {},
      agentGenerations: {},
      activityFeed: [],
      addActivity: () => {},
      clearActivityFeed: () => {},
      socketConnected: false,
      connectSocket: () => {},
      disconnectSocket: () => {},
      joinAgentRoom: () => {},
      leaveAgentRoom: () => {},
      loading: false,
      error: null,
      setError: () => {},
    };
  }
  return context;
};

export default FlameAgentContext;
