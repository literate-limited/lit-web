import { useState } from 'react';

export default function LessonLevel({ level, onComplete }) {
  const [isDone, setIsDone] = useState(false);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h3 style={styles.title}>{level.title}</h3>
        <div
          style={styles.lessonContent}
          dangerouslySetInnerHTML={{ __html: level.content }}
        />

        {!isDone ? (
          <button
            onClick={() => setIsDone(true)}
            style={styles.continueBtn}
          >
            Continue
          </button>
        ) : (
          <div style={styles.summary}>
            <p style={styles.summaryText}>
              ✓ Lesson completed! Click the button below to continue to the next level.
            </p>
            <button
              onClick={() => onComplete()}
              style={styles.nextBtn}
            >
              Next Level
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto'
  },
  content: {
    background: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '24px',
    marginBottom: '24px',
    color: '#333'
  },
  lessonContent: {
    fontSize: '16px',
    lineHeight: '1.8',
    color: '#444',
    marginBottom: '30px'
  },
  continueBtn: {
    padding: '14px 32px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  summary: {
    textAlign: 'center'
  },
  summaryText: {
    fontSize: '16px',
    color: '#28a745',
    marginBottom: '20px',
    fontWeight: '500'
  },
  nextBtn: {
    padding: '14px 32px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  }
};
