/**
 * CorrectionPanel
 *
 * Allows editing and correcting the AI-generated suggestion.
 * Tracks changes for ML training data.
 */
import { useState, useCallback, useEffect } from "react";
import "./FlameTerminal.css";

const CorrectionPanel = ({
  content,
  originalContent,
  agentType,
  onSave,
  onCancel,
}) => {
  const [editedPrompt, setEditedPrompt] = useState("");
  const [editedStyle, setEditedStyle] = useState("vivid");
  const [editedSize, setEditedSize] = useState("1024x1024");
  const [editedQuality, setEditedQuality] = useState("standard");
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize from content
  useEffect(() => {
    if (content) {
      setEditedPrompt(content.prompt || "");
      setEditedStyle(content.style || "vivid");
      setEditedSize(content.size || "1024x1024");
      setEditedQuality(content.quality || "standard");
    }
  }, [content]);

  // Track changes
  useEffect(() => {
    if (content) {
      const changed =
        editedPrompt !== (content.prompt || "") ||
        editedStyle !== (content.style || "vivid") ||
        editedSize !== (content.size || "1024x1024") ||
        editedQuality !== (content.quality || "standard");
      setHasChanges(changed);
    }
  }, [content, editedPrompt, editedStyle, editedSize, editedQuality]);

  const handleSave = useCallback(() => {
    const newContent = {
      prompt: editedPrompt,
      style: editedStyle,
      size: editedSize,
      quality: editedQuality,
    };
    onSave(newContent);
  }, [editedPrompt, editedStyle, editedSize, editedQuality, onSave]);

  const handleReset = useCallback(() => {
    if (content) {
      setEditedPrompt(content.prompt || "");
      setEditedStyle(content.style || "vivid");
      setEditedSize(content.size || "1024x1024");
      setEditedQuality(content.quality || "standard");
    }
  }, [content]);

  // Size options based on agent type
  const sizeOptions = agentType === "image"
    ? ["1024x1024", "1792x1024", "1024x1792"]
    : ["1024x1024"];

  return (
    <div className="correction-panel">
      <div className="correction-header">
        <span className="correction-title">Edit Suggestion</span>
        {hasChanges && <span className="changes-badge">Modified</span>}
      </div>

      {/* Prompt editor */}
      <div className="correction-field">
        <label className="field-label">Prompt</label>
        <textarea
          className="field-textarea"
          value={editedPrompt}
          onChange={(e) => setEditedPrompt(e.target.value)}
          rows={6}
          placeholder="Enter your prompt..."
        />
        <div className="field-help">
          Be specific with details, colors, composition, and style references.
        </div>
      </div>

      {/* Settings for image generation */}
      {agentType === "image" && (
        <div className="correction-settings">
          {/* Style */}
          <div className="correction-field">
            <label className="field-label">Style</label>
            <div className="field-options">
              <button
                className={`option-btn ${editedStyle === "vivid" ? "selected" : ""}`}
                onClick={() => setEditedStyle("vivid")}
              >
                🎨 Vivid
              </button>
              <button
                className={`option-btn ${editedStyle === "natural" ? "selected" : ""}`}
                onClick={() => setEditedStyle("natural")}
              >
                🌿 Natural
              </button>
            </div>
          </div>

          {/* Size */}
          <div className="correction-field">
            <label className="field-label">Size</label>
            <div className="field-options">
              {sizeOptions.map((size) => (
                <button
                  key={size}
                  className={`option-btn ${editedSize === size ? "selected" : ""}`}
                  onClick={() => setEditedSize(size)}
                >
                  {size === "1024x1024" && "⬜ Square"}
                  {size === "1792x1024" && "▬ Wide"}
                  {size === "1024x1792" && "▯ Tall"}
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div className="correction-field">
            <label className="field-label">Quality</label>
            <div className="field-options">
              <button
                className={`option-btn ${editedQuality === "standard" ? "selected" : ""}`}
                onClick={() => setEditedQuality("standard")}
              >
                ⚡ Standard
              </button>
              <button
                className={`option-btn ${editedQuality === "hd" ? "selected" : ""}`}
                onClick={() => setEditedQuality("hd")}
              >
                ✨ HD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diff preview */}
      {hasChanges && originalContent && (
        <div className="correction-diff">
          <div className="diff-label">Changes from original</div>
          <div className="diff-content">
            {editedPrompt !== (originalContent.prompt || "") && (
              <div className="diff-item">
                <span className="diff-field">Prompt:</span>
                <span className="diff-change">Modified</span>
              </div>
            )}
            {editedStyle !== (originalContent.style || "vivid") && (
              <div className="diff-item">
                <span className="diff-field">Style:</span>
                <span className="diff-old">{originalContent.style || "vivid"}</span>
                <span className="diff-arrow">→</span>
                <span className="diff-new">{editedStyle}</span>
              </div>
            )}
            {editedSize !== (originalContent.size || "1024x1024") && (
              <div className="diff-item">
                <span className="diff-field">Size:</span>
                <span className="diff-old">{originalContent.size || "1024x1024"}</span>
                <span className="diff-arrow">→</span>
                <span className="diff-new">{editedSize}</span>
              </div>
            )}
            {editedQuality !== (originalContent.quality || "standard") && (
              <div className="diff-item">
                <span className="diff-field">Quality:</span>
                <span className="diff-old">{originalContent.quality || "standard"}</span>
                <span className="diff-arrow">→</span>
                <span className="diff-new">{editedQuality}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="correction-actions">
        <button className="action-btn secondary" onClick={onCancel}>
          Cancel
        </button>
        {hasChanges && (
          <button className="action-btn secondary" onClick={handleReset}>
            Reset
          </button>
        )}
        <button
          className="action-btn primary"
          onClick={handleSave}
          disabled={!editedPrompt.trim()}
        >
          {hasChanges ? "💾 Save Changes" : "Continue →"}
        </button>
      </div>
    </div>
  );
};

export default CorrectionPanel;
