import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../../api';
import styles from '../styles/lawlore.module.css';

export default function LawAssessmentPage() {
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [stats, setStats] = useState(null);
  const [mastery, setMastery] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAssessmentData();
  }, []);

  const loadAssessmentData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const [assessRes, statsRes, masteryRes, recRes] = await Promise.all([
        fetch(`${API_URL}/api/law/assessment`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/law/assessment/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/law/assessment/mastery`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/law/assessment/recommended`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (assessRes.ok) {
        setAssessment(await assessRes.json());
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (masteryRes.ok) {
        const data = await masteryRes.json();
        setMastery(data.topicMastery);
      }
      if (recRes.ok) {
        const data = await recRes.json();
        setRecommended(data.recommendedUnits || []);
      }
    } catch (err) {
      console.error('Assessment data fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading your assessment...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  const levelColors = {
    beginner: '#4ade80',
    intermediate: '#fbbf24',
    advanced: '#f87171'
  };

  return (
    <div className={styles.container}>
      <div className={styles.assessmentHeader}>
        <h1>Your Law Learning Progress</h1>
        <p>Track your legal knowledge development</p>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className={styles.overviewSection}>
          <div className={styles.assessmentCards}>
            <div className={styles.levelCard}>
              <h3>Current Level</h3>
              <div
                className={styles.levelBadge}
                style={{ backgroundColor: levelColors[assessment?.currentLevel] }}
              >
                {assessment?.currentLevel?.toUpperCase() || 'BEGINNER'}
              </div>
              <p className={styles.levelDescription}>
                {assessment?.currentLevel === 'beginner' && 'Building your legal foundation'}
                {assessment?.currentLevel === 'intermediate' && 'Developing legal expertise'}
                {assessment?.currentLevel === 'advanced' && 'Mastering legal principles'}
              </p>
            </div>

            <div className={styles.statsCard}>
              <h3>Learning Statistics</h3>
              <div className={styles.statItem}>
                <span className={styles.label}>Units Completed:</span>
                <span className={styles.value}>{stats?.unitsCompleted || 0}/{stats?.totalUnitsAvailable || 18}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.label}>Lessons Completed:</span>
                <span className={styles.value}>{stats?.lessonsCompleted || 0}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.label}>Quiz Average:</span>
                <span className={styles.value}>{Math.round(stats?.quizAverage || 0)}%</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.label}>Time Spent:</span>
                <span className={styles.value}>{Math.round((stats?.minutesSpent || 0) / 60)} hours</span>
              </div>
            </div>
          </div>

          {/* Competency Gaps */}
          {assessment?.competencyGaps && assessment.competencyGaps.length > 0 && (
            <div className={styles.gapsSection}>
              <h3>Areas for Growth</h3>
              <p>Focus on these topics to strengthen your legal knowledge:</p>
              <div className={styles.gapsList}>
                {assessment.competencyGaps.map((gap) => (
                  <div key={gap} className={styles.gapItem}>
                    {gap.replace('law:', '').replace(/_/g, ' ').toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mastery Tab */}
      {activeTab === 'mastery' && (
        <div className={styles.masterySection}>
          <h2>Topic Mastery Breakdown</h2>
          {mastery && Object.entries(mastery).map(([topicId, topic]) => (
            <div key={topicId} className={styles.topicMasteryCard}>
              <div className={styles.topicHeader}>
                <h3>{topic.topicName}</h3>
                <span className={styles.percentage}>{topic.masteryPercentage}%</span>
              </div>
              <p className={styles.description}>{topic.description}</p>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${topic.masteryPercentage}%` }}
                />
              </div>
              <p className={styles.stats}>
                {topic.unitsCompleted} of {topic.totalUnits} units completed
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Recommended Tab */}
      {activeTab === 'recommended' && (
        <div className={styles.recommendedSection}>
          <h2>Recommended Next Units</h2>
          {recommended.length > 0 ? (
            <div className={styles.unitsList}>
              {recommended.map((unit) => (
                <div key={unit.id} className={styles.recommendedUnit}>
                  <div className={styles.unitInfo}>
                    <h3>{unit.name}</h3>
                    <p>{unit.description}</p>
                    <div className={styles.unitMeta}>
                      <span className={`${styles.badge} ${styles[unit.difficulty_level]}`}>
                        {unit.difficulty_level}
                      </span>
                      <span className={styles.time}>~{unit.required_time_minutes || 45} min</span>
                    </div>
                  </div>
                  <button
                    className={styles.startButton}
                    onClick={() => navigate(`/law/unit/${unit.id}`)}
                  >
                    Start Unit
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>You've completed all recommended units! Browse the curriculum for additional learning.</p>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'mastery' ? styles.active : ''}`}
          onClick={() => setActiveTab('mastery')}
        >
          Topic Mastery
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'recommended' ? styles.active : ''}`}
          onClick={() => setActiveTab('recommended')}
        >
          Recommended
        </button>
      </div>

      <div className={styles.assessmentActions}>
        <button
          className={styles.primaryButton}
          onClick={() => navigate('/law')}
        >
          Continue Learning
        </button>
      </div>
    </div>
  );
}
