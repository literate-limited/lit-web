/**
 * AgentWorkspace
 *
 * Container for agent-specific workflow:
 * Suggestion → Correction → Preview
 */
import { useState, useCallback, useEffect } from "react";
import { useAgentSocket } from "../../hooks/useAgentSocket";
import { useFlameAgents } from "../../context/FlameAgentContext";
import SuggestionPanel from "./SuggestionPanel";
import CorrectionPanel from "./CorrectionPanel";
import PreviewPanel from "./PreviewPanel";
import "./FlameTerminal.css";

const WORKFLOW_STAGES = {
  INPUT: "input",
  SUGGESTION: "suggestion",
  CORRECTION: "correction",
  PREVIEW: "preview",
};

const AgentWorkspace = ({ agentId, agentType }) => {
  const { deleteAgent, addActivity } = useFlameAgents();
  const {
    suggestions,
    generations,
    generateSuggestions,
    correctSuggestion,
    approveSuggestion,
    rejectSuggestion,
    socketConnected,
  } = useAgentSocket(agentId);

  const [stage, setStage] = useState(WORKFLOW_STAGES.INPUT);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState(null);
  const [editedContent, setEditedContent] = useState(null);
  const [error, setError] = useState(null);

  // Get the latest suggestion
  const latestSuggestion = suggestions[0] || null;

  // Get the latest generation for current suggestion
  const currentGeneration = currentSuggestion
    ? generations.find((g) => g.suggestionId === currentSuggestion._id)
    : null;

  // Update current suggestion when suggestions change
  useEffect(() => {
    if (latestSuggestion && !currentSuggestion) {
      setCurrentSuggestion(latestSuggestion);
      setEditedContent(latestSuggestion.correctedContent || latestSuggestion.originalContent);
      setStage(WORKFLOW_STAGES.SUGGESTION);
    }
  }, [latestSuggestion, currentSuggestion]);

  // Handle prompt submission
  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    try {
      setIsGenerating(true);
      setError(null);

      const result = await generateSuggestions(prompt);

      if (result) {
        setCurrentSuggestion({
          _id: result.suggestionId,
          originalContent: result.content,
          variations: result.variations,
          status: "pending",
        });
        setEditedContent(result.content);
        setStage(WORKFLOW_STAGES.SUGGESTION);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isGenerating, generateSuggestions]);

  // Handle moving to correction stage
  const handleEditSuggestion = useCallback(() => {
    setStage(WORKFLOW_STAGES.CORRECTION);
  }, []);

  // Handle saving corrections
  const handleSaveCorrections = useCallback(async (newContent) => {
    if (!currentSuggestion) return;

    try {
      await correctSuggestion(currentSuggestion._id, [], newContent);
      setEditedContent(newContent);
      setCurrentSuggestion((prev) => ({
        ...prev,
        correctedContent: newContent,
      }));
      setStage(WORKFLOW_STAGES.PREVIEW);
    } catch (err) {
      setError(err.message);
    }
  }, [currentSuggestion, correctSuggestion]);

  // Handle moving to preview without edits
  const handlePreview = useCallback(() => {
    setStage(WORKFLOW_STAGES.PREVIEW);
  }, []);

  // Handle approving suggestion
  const handleApprove = useCallback(async () => {
    if (!currentSuggestion) return;

    try {
      await approveSuggestion(currentSuggestion._id);
      setCurrentSuggestion((prev) => ({ ...prev, status: "approved" }));
    } catch (err) {
      setError(err.message);
    }
  }, [currentSuggestion, approveSuggestion]);

  // Handle rejecting suggestion
  const handleReject = useCallback(async (reason) => {
    if (!currentSuggestion) return;

    try {
      await rejectSuggestion(currentSuggestion._id, reason);
      setCurrentSuggestion(null);
      setEditedContent(null);
      setStage(WORKFLOW_STAGES.INPUT);
    } catch (err) {
      setError(err.message);
    }
  }, [currentSuggestion, rejectSuggestion]);

  // Handle starting new
  const handleStartNew = useCallback(() => {
    setCurrentSuggestion(null);
    setEditedContent(null);
    setPrompt("");
    setStage(WORKFLOW_STAGES.INPUT);
    setError(null);
  }, []);

  // Handle killing agent
  const handleKillAgent = useCallback(async () => {
    if (window.confirm("Are you sure you want to close this agent?")) {
      await deleteAgent(agentId);
    }
  }, [agentId, deleteAgent]);

  // Render based on stage
  const renderContent = () => {
    switch (stage) {
      case WORKFLOW_STAGES.INPUT:
        return (
          <div className="agent-input-stage">
            <div className="agent-prompt-container">
              <textarea
                className="agent-prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Describe what you want to ${agentType === "image" ? "generate" : "create"}...`}
                rows={4}
                disabled={isGenerating}
              />
              <button
                className="agent-generate-btn"
                onClick={handleSubmit}
                disabled={!prompt.trim() || isGenerating}
              >
                {isGenerating ? "Generating..." : "✨ Generate Suggestions"}
              </button>
            </div>

            {/* Previous suggestions */}
            {suggestions.length > 0 && (
              <div className="agent-history">
                <div className="history-header">Previous Suggestions</div>
                {suggestions.slice(0, 5).map((sug) => (
                  <button
                    key={sug._id}
                    className={`history-item ${sug.status}`}
                    onClick={() => {
                      setCurrentSuggestion(sug);
                      setEditedContent(sug.correctedContent || sug.originalContent);
                      setStage(WORKFLOW_STAGES.SUGGESTION);
                    }}
                  >
                    <span className="history-status">
                      {sug.status === "completed" ? "✅" : sug.status === "approved" ? "🔄" : "📝"}
                    </span>
                    <span className="history-prompt">
                      {sug.originalContent?.prompt?.slice(0, 50) || "..."}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case WORKFLOW_STAGES.SUGGESTION:
        return (
          <SuggestionPanel
            suggestion={currentSuggestion}
            onEdit={handleEditSuggestion}
            onPreview={handlePreview}
            onReject={handleReject}
            onStartNew={handleStartNew}
          />
        );

      case WORKFLOW_STAGES.CORRECTION:
        return (
          <CorrectionPanel
            content={editedContent}
            originalContent={currentSuggestion?.originalContent}
            agentType={agentType}
            onSave={handleSaveCorrections}
            onCancel={() => setStage(WORKFLOW_STAGES.SUGGESTION)}
          />
        );

      case WORKFLOW_STAGES.PREVIEW:
        return (
          <PreviewPanel
            suggestion={currentSuggestion}
            content={editedContent}
            generation={currentGeneration}
            agentType={agentType}
            onApprove={handleApprove}
            onEdit={() => setStage(WORKFLOW_STAGES.CORRECTION)}
            onReject={handleReject}
            onStartNew={handleStartNew}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="agent-workspace">
      {/* Header */}
      <div className="agent-workspace-header">
        <div className="workspace-info">
          <span className="workspace-type">
            {agentType === "image" ? "🖼️" : agentType === "audio" ? "🔊" : "🤖"}
          </span>
          <span className="workspace-stage">
            {stage === WORKFLOW_STAGES.INPUT && "Enter Prompt"}
            {stage === WORKFLOW_STAGES.SUGGESTION && "Review Suggestion"}
            {stage === WORKFLOW_STAGES.CORRECTION && "Edit & Correct"}
            {stage === WORKFLOW_STAGES.PREVIEW && "Preview & Approve"}
          </span>
        </div>

        <div className="workspace-actions">
          <span
            className={`socket-status ${socketConnected ? "connected" : "disconnected"}`}
            title={socketConnected ? "Live" : "Offline"}
          >
            {socketConnected ? "🟢" : "🔴"}
          </span>
          <button
            className="workspace-btn close"
            onClick={handleKillAgent}
            title="Close agent"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="agent-error">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Main content */}
      <div className="agent-workspace-content">
        {renderContent()}
      </div>

      {/* Progress indicator for generation */}
      {currentGeneration && currentGeneration.status === "processing" && (
        <div className="generation-progress">
          <div
            className="progress-bar"
            style={{ width: `${currentGeneration.progress || 0}%` }}
          />
          <span className="progress-text">
            Generating... {currentGeneration.progress || 0}%
          </span>
        </div>
      )}
    </div>
  );
};

export default AgentWorkspace;
