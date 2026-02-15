/**
 * SuggestionPanel
 *
 * Displays AI-generated suggestion with variations.
 * Allows selecting a variation and moving to edit or preview.
 */
import { useState, useCallback } from "react";
import "./FlameTerminal.css";

const SuggestionPanel = ({
  suggestion,
  onEdit,
  onPreview,
  onReject,
  onStartNew,
}) => {
  const [selectedVariation, setSelectedVariation] = useState(null);

  const content = suggestion?.correctedContent || suggestion?.originalContent;
  const variations = suggestion?.variations || [];

  const handleSelectVariation = useCallback((index) => {
    setSelectedVariation(index);
  }, []);

  const handleUseVariation = useCallback(() => {
    if (selectedVariation !== null && variations[selectedVariation]) {
      // This would need to update the suggestion with the selected variation
      onEdit();
    }
  }, [selectedVariation, variations, onEdit]);

  if (!suggestion || !content) {
    return (
      <div className="suggestion-panel empty">
        <span>No suggestion available</span>
        <button onClick={onStartNew}>Start New</button>
      </div>
    );
  }

  return (
    <div className="suggestion-panel">
      {/* Main suggestion */}
      <div className="suggestion-main">
        <div className="suggestion-label">Generated Prompt</div>
        <div className="suggestion-content">
          {content.prompt || JSON.stringify(content, null, 2)}
        </div>

        {/* Settings preview */}
        {(content.style || content.size || content.quality) && (
          <div className="suggestion-settings">
            {content.style && (
              <span className="setting-badge">Style: {content.style}</span>
            )}
            {content.size && (
              <span className="setting-badge">Size: {content.size}</span>
            )}
            {content.quality && (
              <span className="setting-badge">Quality: {content.quality}</span>
            )}
          </div>
        )}
      </div>

      {/* Variations */}
      {variations.length > 0 && (
        <div className="suggestion-variations">
          <div className="variations-label">
            Variations ({variations.length})
          </div>
          <div className="variations-list">
            {variations.map((variation, index) => (
              <button
                key={index}
                className={`variation-item ${selectedVariation === index ? "selected" : ""}`}
                onClick={() => handleSelectVariation(index)}
              >
                <span className="variation-number">#{index + 1}</span>
                <span className="variation-preview">
                  {variation.content?.prompt?.slice(0, 100) ||
                    variation.prompt?.slice(0, 100) ||
                    "Variation"}...
                </span>
                {variation.content?.style && (
                  <span className="variation-style">{variation.content.style}</span>
                )}
              </button>
            ))}
          </div>

          {selectedVariation !== null && (
            <div className="variation-detail">
              <div className="detail-label">Selected Variation</div>
              <div className="detail-content">
                {variations[selectedVariation]?.content?.prompt ||
                  variations[selectedVariation]?.prompt ||
                  JSON.stringify(variations[selectedVariation], null, 2)}
              </div>
              <button
                className="use-variation-btn"
                onClick={handleUseVariation}
              >
                Use This Variation
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="suggestion-actions">
        <button className="action-btn secondary" onClick={onStartNew}>
          🔄 Start Over
        </button>
        <button className="action-btn secondary" onClick={() => onReject("User chose to reject")}>
          ❌ Reject
        </button>
        <button className="action-btn primary" onClick={onEdit}>
          ✏️ Edit
        </button>
        <button className="action-btn success" onClick={onPreview}>
          👁️ Preview
        </button>
      </div>
    </div>
  );
};

export default SuggestionPanel;
