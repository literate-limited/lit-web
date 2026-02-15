/**
 * useAgentSocket Hook
 *
 * Manages socket connection for a specific agent.
 * Handles joining/leaving rooms and receiving updates.
 */
import { useEffect, useCallback, useState } from "react";
import { useFlameAgents } from "../context/FlameAgentContext";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const useAgentSocket = (agentId) => {
  const {
    socketConnected,
    connectSocket,
    joinAgentRoom,
    leaveAgentRoom,
    agentSuggestions,
    setAgentSuggestions,
    agentGenerations,
    setAgentGenerations,
    addActivity,
  } = useFlameAgents();

  const [isSubscribed, setIsSubscribed] = useState(false);

  // Connect and subscribe to agent room
  useEffect(() => {
    if (!agentId) return;

    // Ensure socket is connected
    connectSocket();

    // Join agent room when socket connects
    if (socketConnected) {
      joinAgentRoom(agentId);
      setIsSubscribed(true);
    }

    return () => {
      if (socketConnected && agentId) {
        leaveAgentRoom(agentId);
        setIsSubscribed(false);
      }
    };
  }, [agentId, socketConnected, connectSocket, joinAgentRoom, leaveAgentRoom]);

  // Get suggestions for this agent
  const suggestions = agentSuggestions[agentId] || [];

  // Get generations for this agent
  const generations = agentGenerations[agentId] || [];

  /**
   * Generate suggestions via API
   */
  const generateSuggestions = useCallback(async (prompt, options = {}) => {
    const token = localStorage.getItem("token");

    addActivity({
      type: "suggestion_requested",
      agentId,
      message: `Generating suggestions for: "${prompt.slice(0, 40)}..."`,
      level: "info",
    });

    try {
      const response = await fetch(`${API_URL}/dev/agents/${agentId}/suggestions/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt, options }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.status}`);
      }

      // Handle SSE streaming
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let result = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                fullText += data.text;
              }
              if (data.done) {
                result = {
                  suggestionId: data.suggestionId,
                  content: data.content,
                  variations: data.variations,
                };

                // Add to local state
                setAgentSuggestions((prev) => ({
                  ...prev,
                  [agentId]: [
                    {
                      _id: data.suggestionId,
                      originalContent: data.content,
                      variations: data.variations,
                      status: "pending",
                      createdAt: new Date(),
                    },
                    ...(prev[agentId] || []),
                  ],
                }));
              }
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseErr) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      return result;
    } catch (err) {
      addActivity({
        type: "error",
        agentId,
        message: `Generation failed: ${err.message}`,
        level: "error",
      });
      throw err;
    }
  }, [agentId, addActivity, setAgentSuggestions]);

  /**
   * Update/correct a suggestion
   */
  const correctSuggestion = useCallback(async (suggestionId, corrections, finalContent) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/dev/agents/${agentId}/suggestions/${suggestionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ corrections, finalContent }),
    });

    if (!response.ok) {
      throw new Error("Failed to update suggestion");
    }

    const { suggestion } = await response.json();

    // Update local state
    setAgentSuggestions((prev) => ({
      ...prev,
      [agentId]: (prev[agentId] || []).map((s) =>
        s._id === suggestionId ? { ...s, ...suggestion } : s
      ),
    }));

    return suggestion;
  }, [agentId, setAgentSuggestions]);

  /**
   * Approve a suggestion
   */
  const approveSuggestion = useCallback(async (suggestionId) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/dev/agents/${agentId}/suggestions/${suggestionId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to approve suggestion");
    }

    const { suggestion } = await response.json();

    // Update local state
    setAgentSuggestions((prev) => ({
      ...prev,
      [agentId]: (prev[agentId] || []).map((s) =>
        s._id === suggestionId ? { ...s, status: "approved" } : s
      ),
    }));

    addActivity({
      type: "suggestion_approved",
      agentId,
      message: "Suggestion approved, starting generation",
      level: "success",
    });

    return suggestion;
  }, [agentId, setAgentSuggestions, addActivity]);

  /**
   * Reject a suggestion
   */
  const rejectSuggestion = useCallback(async (suggestionId, reason) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/dev/agents/${agentId}/suggestions/${suggestionId}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error("Failed to reject suggestion");
    }

    const { suggestion } = await response.json();

    // Update local state
    setAgentSuggestions((prev) => ({
      ...prev,
      [agentId]: (prev[agentId] || []).map((s) =>
        s._id === suggestionId ? { ...s, status: "rejected" } : s
      ),
    }));

    return suggestion;
  }, [agentId, setAgentSuggestions]);

  /**
   * Fetch suggestions for this agent
   */
  const fetchSuggestions = useCallback(async (options = {}) => {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams(options);

    const response = await fetch(`${API_URL}/dev/agents/${agentId}/suggestions?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch suggestions");
    }

    const { suggestions: fetchedSuggestions } = await response.json();

    setAgentSuggestions((prev) => ({
      ...prev,
      [agentId]: fetchedSuggestions,
    }));

    return fetchedSuggestions;
  }, [agentId, setAgentSuggestions]);

  return {
    // Connection status
    isSubscribed,
    socketConnected,

    // Data
    suggestions,
    generations,

    // Actions
    generateSuggestions,
    correctSuggestion,
    approveSuggestion,
    rejectSuggestion,
    fetchSuggestions,
  };
};

export default useAgentSocket;
