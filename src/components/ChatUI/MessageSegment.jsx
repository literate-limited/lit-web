import { useState } from 'react';

export default function MessageSegment({ segment }) {
  const [flipped, setFlipped] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Convert is_error to boolean (comes from SQLite as 0 or 1)
  const isError = Boolean(segment.is_error);

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  return (
    <span
      style={{
        ...styles.segment,
        ...(isError ? styles.errorSegment : {}),
        backgroundColor: flipped ? '#fff3cd' : 'transparent',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease'
      }}
      onClick={handleFlip}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {flipped && segment.correction ? (
        <span style={{ ...styles.text, fontStyle: 'italic', color: '#28a745' }}>
          {segment.correction}
        </span>
      ) : (
        <span
          style={{
            ...styles.text,
            ...(segment.language === 'en' ? styles.englishText : {}),
            ...(isError ? styles.errorText : {})
          }}
        >
          {segment.text}
        </span>
      )}

      {showTooltip && (
        <div style={styles.tooltip}>
          {isError ? (
            <div>
              <div style={styles.tooltipLabel}>Error: {segment.error_type}</div>
              <div style={styles.tooltipCorrection}>
                Should be: <strong>{segment.correction}</strong>
              </div>
              {segment.error_explanation && (
                <div style={styles.tooltipExplanation}>
                  {segment.error_explanation}
                </div>
              )}
            </div>
          ) : segment.language === 'en' ? (
            <div style={styles.tooltipLabel}>English (target: French)</div>
          ) : (
            <div style={styles.tooltipLabel}>French ✓</div>
          )}
        </div>
      )}

      {isError && <span style={styles.errorIndicator}>✗</span>}
    </span>
  );
}

const styles = {
  segment: {
    position: 'relative',
    display: 'inline-block',
    padding: '2px 4px',
    borderRadius: '3px',
    margin: '0 2px'
  },
  text: {
    fontSize: 'inherit',
    lineHeight: 'inherit'
  },
  errorSegment: {
    backgroundColor: '#ffe6e6',
    borderBottom: '2px wavy #dc3545'
  },
  englishText: {
    color: '#0066cc',
    backgroundColor: '#e6f2ff'
  },
  errorText: {
    color: '#dc3545',
    fontWeight: '600'
  },
  errorIndicator: {
    marginLeft: '4px',
    color: '#dc3545',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#333',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    marginBottom: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    pointerEvents: 'none'
  },
  tooltipLabel: {
    fontSize: '11px',
    fontWeight: '600',
    marginBottom: '4px'
  },
  tooltipCorrection: {
    fontSize: '13px',
    color: '#90ee90',
    marginBottom: '4px'
  },
  tooltipExplanation: {
    fontSize: '11px',
    marginTop: '6px',
    maxWidth: '200px',
    lineHeight: '1.4'
  }
};
