import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../../api';
import styles from '../styles/lawlore.module.css';

export default function LawCurriculumPage() {
  const navigate = useNavigate();
  const [curriculum, setCurriculum] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCurriculum();
  }, []);

  const fetchCurriculum = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/law/curriculum`);
      if (!response.ok) throw new Error('Failed to fetch curriculum');

      const data = await response.json();
      setCurriculum(data.topics || []);
    } catch (err) {
      console.error('Curriculum fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartUnit = (unitId) => {
    navigate(`/law/unit/${unitId}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Loading law curriculum...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div style={{ color: 'red', padding: '20px' }}>
          Error loading curriculum: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.curriculumHeader}>
        <h1>Law Curriculum</h1>
        <p>Master Australian legal principles through structured learning</p>
      </div>

      <div className={styles.topicsGrid}>
        {curriculum.map((topic) => (
          <div
            key={topic.id}
            className={styles.topicCard}
            onClick={() => setSelectedTopic(selectedTopic === topic.id ? null : topic.id)}
          >
            <h2>{topic.name}</h2>
            <p className={styles.description}>{topic.description}</p>
            <p className={styles.unitCount}>{topic.units?.length || 0} units</p>

            {selectedTopic === topic.id && (
              <div className={styles.unitsList}>
                {topic.units?.map((unit) => (
                  <div key={unit.id} className={styles.unitItem}>
                    <div className={styles.unitInfo}>
                      <h3>{unit.name}</h3>
                      <p>{unit.description}</p>
                      <span className={`${styles.badge} ${styles[unit.difficulty_level]}`}>
                        {unit.difficulty_level}
                      </span>
                      <span className={styles.time}>
                        ~{unit.required_time_minutes || 45} min
                      </span>
                    </div>
                    <button
                      className={styles.startButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartUnit(unit.id);
                      }}
                    >
                      Start Unit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
