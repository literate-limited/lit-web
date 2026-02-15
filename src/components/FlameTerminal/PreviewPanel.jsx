/**
 * PreviewPanel
 *
 * Final preview before generation approval.
 * Shows generation progress and results.
 */
import { useState, useCallback } from "react";
import "./FlameTerminal.css";

const PreviewPanel = ({
  suggestion,
  content,
  generation,
  agentType,
  onApprove,
  onEdit,
  onReject,
  onStartNew,
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const status = suggestion?.status || "pending";
  const isGenerating = generation?.status === "processing";
  const isComplete = generation?.status === "completed";
  const hasError = generation?.status === "error";

  const handleApprove = useCallback(async () => {
    if (isApproving) return;
    setIsApproving(true);
    try {
      await onApprove();
    } finally {
      setIsApproving(false);
    }
  }, [isApproving, onApprove]);

  const handleReject = useCallback(() => {
    onReject(rejectReason || "User rejected");
    setShowRejectDialog(false);
    setRejectReason("");
  }, [onReject, rejectReason]);

  return (
    <div className="preview-panel">
      {/* Content preview */}
      <div className="preview-content">
        <div className="preview-label">Final Prompt</div>
        <div className="preview-prompt">
          {content?.prompt || "No prompt"}
        </div>

        {/* Settings summary */}
        <div className="preview-settings">
          {content?.style && (
            <span className="preview-setting">
              <span className="setting-icon">🎨</span>
              {content.style}
            </span>
          )}
          {content?.size && (
            <span className="preview-setting">
              <span className="setting-icon">📐</span>
              {content.size}
            </span>
          )}
          {content?.quality && (
            <span className="preview-setting">
              <span className="setting-icon">✨</span>
              {content.quality}
            </span>
          )}
        </div>
      </div>

      {/* Generation status */}
      {status === "approved" && (
        <div className="preview-generation">
          {isGenerating && (
            <div className="generation-status generating">
              <div className="generation-spinner">
                <div className="spinner" />
              </div>
              <div className="generation-info">
                <span className="gen-label">Generating...</span>
                <span className="gen-progress">{generation?.progress || 0}%</span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${generation?.progress || 0}%` }}
                />
              </div>
            </div>
          )}

          {isComplete && generation?.result && (
            <div className="generation-result">
              <div className="result-label">Generated Image</div>
              {agentType === "image" && generation.result.url && (
                <div className="result-image-container">
                  <img
                    src={generation.result.url}
                    alt="Generated"
                    className="result-image"
                  />
                  <div className="result-actions">
                    <a
                      href={generation.result.url}
                      target="_blank"
                      rel="noreferrer"
                      className="result-action-btn"
                    >
                      🔗 Open Full
                    </a>
                    <button
                      className="result-action-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(generation.result.url);
                      }}
                    >
                      📋 Copy URL
                    </button>
                  </div>
                </div>
              )}

              {generation.result.revisedPrompt && (
                <div className="revised-prompt">
                  <span className="revised-label">DALL-E Revised Prompt:</span>
                  <span className="revised-text">{generation.result.revisedPrompt}</span>
                </div>
              )}
            </div>
          )}

          {hasError && (
            <div className="generation-error">
              <span className="error-icon">❌</span>
              <span className="error-message">
                {generation?.error?.message || "Generation failed"}
              </span>
              <button
                className="retry-btn"
                onClick={handleApprove}
                disabled={isApproving}
              >
                🔄 Retry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="preview-actions">
        {status === "pending" && (
          <>
            <button className="action-btn secondary" onClick={onEdit}>
              ✏️ Edit
            </button>
            <button
              className="action-btn secondary"
              onClick={() => setShowRejectDialog(true)}
            >
              ❌ Reject
            </button>
            <button
              className="action-btn success"
              onClick={handleApprove}
              disabled={isApproving}
            >
              {isApproving ? "⏳ Approving..." : "✅ Approve & Generate"}
            </button>
          </>
        )}

        {(isComplete || hasError) && (
          <>
            <button className="action-btn primary" onClick={onStartNew}>
              🔄 New Generation
            </button>
          </>
        )}

        {isGenerating && (
          <div className="generating-notice">
            Generation in progress...
          </div>
        )}
      </div>

      {/* Reject dialog */}
      {showRejectDialog && (
        <div className="reject-dialog-overlay">
          <div className="reject-dialog">
            <div className="dialog-header">Reject Suggestion</div>
            <div className="dialog-content">
              <label className="dialog-label">Reason (optional):</label>
              <textarea
                className="dialog-textarea"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Why are you rejecting this suggestion?"
                rows={3}
              />
            </div>
            <div className="dialog-actions">
              <button
                className="action-btn secondary"
                onClick={() => setShowRejectDialog(false)}
              >
                Cancel
              </button>
              <button className="action-btn danger" onClick={handleReject}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;
