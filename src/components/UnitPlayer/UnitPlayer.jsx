import { useState, useEffect } from 'react';
import { api } from '../../api';
import LessonLevel from './LessonLevel';
import QuestionLevel from './QuestionLevel';

export default function UnitPlayer({ unitId, user, onUnitComplete }) {
  const [unit, setUnit] = useState(null);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [levelProgress, setLevelProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUnit();
  }, [unitId]);

  const loadUnit = async () => {
    try {
      setLoading(true);
      setError(null);
      // In a real app, would call: const data = await api.getUnit(unitId);
      // For now, mock the data
      const mockUnit = {
        id: unitId,
        name: 'Present Tense: Avoir & Aller',
        topic: 'verb_conjugation',
        difficulty: 'Y7',
        levels: [
          {
            id: 'level-1',
            type: 'lesson',
            title: 'Understanding Present Tense',
            content: `
              <h3>Present Tense Conjugation</h3>
              <p>In French, present tense verbs change based on the subject:</p>
              <h4>Avoir (to have):</h4>
              <ul>
                <li>Je ai → <strong>J'ai</strong> (I have)</li>
                <li>Tu as (You have)</li>
                <li>Il/Elle a (He/She has)</li>
                <li>Nous avons (We have)</li>
                <li>Vous avez (You have - formal)</li>
                <li>Ils/Elles ont (They have)</li>
              </ul>
              <h4>Aller (to go):</h4>
              <ul>
                <li>Je vais (I go)</li>
                <li>Tu vas (You go)</li>
                <li>Il/Elle va (He/She goes)</li>
                <li>Nous allons (We go)</li>
                <li>Vous allez (You go - formal)</li>
                <li>Ils/Elles vont (They go)</li>
              </ul>
            `
          },
          {
            id: 'level-2',
            type: 'question',
            question_type: 'mcq',
            title: 'Question 1: Avoir Conjugation',
            content: 'How do you say "I have" in French?',
            options: ['J\'ai', 'Tu as', 'Il a', 'Nous avons'],
            correctAnswer: 0
          },
          {
            id: 'level-3',
            type: 'question',
            question_type: 'fill',
            title: 'Question 2: Fill in the blank',
            content: 'Complete: "Tu __ une maison." (You have a house.)',
            correctAnswer: 'as'
          }
        ]
      };
      setUnit(mockUnit);
    } catch (err) {
      console.error('Failed to load unit:', err);
      setError('Failed to load unit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLevelComplete = (levelId, isCorrect) => {
    setLevelProgress((prev) => ({
      ...prev,
      [levelId]: { completed: true, correct: isCorrect }
    }));

    // Move to next level after short delay
    setTimeout(() => {
      if (currentLevelIndex < unit.levels.length - 1) {
        setCurrentLevelIndex(currentLevelIndex + 1);
      } else {
        // Unit complete!
        onUnitComplete?.({
          unitId,
          completedAt: new Date().toISOString(),
          levelProgress
        });
      }
    }, 1000);
  };

  const handleSkip = () => {
    if (currentLevelIndex < unit.levels.length - 1) {
      setCurrentLevelIndex(currentLevelIndex + 1);
    } else {
      onUnitComplete?.({
        unitId,
        completedAt: new Date().toISOString(),
        levelProgress,
        skipped: true
      });
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading unit...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <p>{error}</p>
          <button onClick={loadUnit} style={styles.retryBtn}>Retry</button>
        </div>
      </div>
    );
  }

  const currentLevel = unit.levels[currentLevelIndex];
  const progress = ((currentLevelIndex + 1) / unit.levels.length) * 100;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2>{unit.name}</h2>
          <p style={styles.difficulty}>Difficulty: {unit.difficulty}</p>
        </div>
        <div style={styles.controls}>
          <button onClick={() => onUnitComplete?.()} style={styles.exitBtn}>
            Exit Unit
          </button>
        </div>
      </div>

      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progress}%`
            }}
          />
        </div>
        <span style={styles.progressText}>
          Level {currentLevelIndex + 1} of {unit.levels.length}
        </span>
      </div>

      <div style={styles.content}>
        {currentLevel.type === 'lesson' ? (
          <LessonLevel
            level={currentLevel}
            onComplete={() => handleLevelComplete(currentLevel.id, true)}
          />
        ) : (
          <QuestionLevel
            level={currentLevel}
            onComplete={(isCorrect) => handleLevelComplete(currentLevel.id, isCorrect)}
          />
        )}
      </div>

      <div style={styles.footer}>
        <button onClick={handleSkip} style={styles.skipBtn}>
          Skip
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#f9f9f9'
  },
  header: {
    background: 'white',
    padding: '24px 30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #eee'
  },
  difficulty: {
    fontSize: '13px',
    color: '#666',
    margin: '6px 0 0 0'
  },
  controls: {
    display: 'flex',
    gap: '10px'
  },
  exitBtn: {
    padding: '10px 20px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  progressContainer: {
    background: 'white',
    padding: '16px 30px',
    borderBottom: '1px solid #eee'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: '#e9ecef',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #28a745, #20c997)',
    transition: 'width 0.3s ease'
  },
  progressText: {
    fontSize: '13px',
    color: '#666',
    fontWeight: '500'
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '30px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  footer: {
    background: 'white',
    padding: '20px 30px',
    borderTop: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  skipBtn: {
    padding: '10px 20px',
    background: '#e9ecef',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    fontSize: '18px',
    color: '#666'
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    textAlign: 'center',
    color: '#dc3545'
  },
  retryBtn: {
    marginTop: '16px',
    padding: '10px 20px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
};
