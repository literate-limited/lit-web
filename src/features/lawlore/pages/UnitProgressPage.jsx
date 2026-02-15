import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../../../api';
import styles from '../styles/lawlore.module.css';

export default function UnitProgressPage() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUnit();
    loadProgress();
  }, [unitId]);

  const fetchUnit = async () => {
    try {
      const response = await fetch(`${API_URL}/api/law/units/${unitId}`);
      if (!response.ok) throw new Error('Failed to fetch unit');

      const data = await response.json();
      setUnit(data);
    } catch (err) {
      console.error('Unit fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/progress/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Update completed lessons based on progress data
        // This is simplified - in production, would track per-unit
      }
    } catch (err) {
      console.error('Progress load error:', err);
    }
  };

  const handleStartLesson = (levelId) => {
    navigate(`/law/lesson/${levelId}`);
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading unit...</div>;
  }

  if (error || !unit) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  const progressPercent = unit.levels
    ? Math.round((completedLessons.size / unit.levels.length) * 100)
    : 0;

  return (
    <div className={styles.container}>
      <div className={styles.unitHeader}>
        <h1>{unit.name}</h1>
        <p className={styles.description}>{unit.description}</p>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className={styles.progressText}>
          {completedLessons.size} of {unit.levels?.length || 0} lessons completed ({progressPercent}%)
        </p>
      </div>

      <div className={styles.lessonsList}>
        {unit.levels?.map((level, index) => {
          const isCompleted = completedLessons.has(level.id);
          const levelType = level.level_type || 'lesson';

          return (
            <div
              key={level.id}
              className={`${styles.lessonItem} ${isCompleted ? styles.completed : ''}`}
            >
              <div className={styles.lessonNumber}>
                {index + 1}
              </div>
              <div className={styles.lessonContent}>
                <h3>{level.name}</h3>
                <p>{level.description}</p>
                <div className={styles.lessonMeta}>
                  <span className={`${styles.badge} ${styles[levelType]}`}>
                    {levelType}
                  </span>
                  <span className={styles.time}>
                    ~{level.time_estimate_minutes || 15} min
                  </span>
                  {isCompleted && <span className={styles.completedBadge}>✓ Completed</span>}
                </div>
              </div>
              <button
                className={styles.lessonButton}
                onClick={() => handleStartLesson(level.id)}
              >
                {isCompleted ? 'Review' : 'Start'}
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.unitActions}>
        <button
          className={styles.backButton}
          onClick={() => navigate('/law')}
        >
          Back to Curriculum
        </button>
      </div>
    </div>
  );
}
