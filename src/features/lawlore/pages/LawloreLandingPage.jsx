import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/lawlore.module.css';

export default function LawloreLandingPage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [showLearningPath, setShowLearningPath] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem('token'));

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search/results?q=${encodeURIComponent(query)}&type=${type}`);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <div className={styles.landingPage}>
        <div className={styles.container}>
          <div className={styles.heroSection}>
            <h1 className={styles.heroTitle}>Australian Legal Research</h1>
            <p className={styles.heroSubtitle}>
              Search Commonwealth legislation and High Court of Australia cases
            </p>

            <form onSubmit={handleSearch}>
              <div className={styles.heroSearchContainer}>
                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search statutes, cases, or legal concepts..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ color: 'white', background: 'rgba(255,255,255,0.2)' }}
                  />
                  <div className={styles.typeToggle}>
                    {['all', 'statute', 'case'].map(t => (
                      <button
                        key={t}
                        type="button"
                        className={`${styles.typeToggleButton} ${type === t ? styles.active : ''}`}
                        onClick={() => setType(t)}
                        style={type === t ? { background: '#1e40af' } : { background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
                      >
                        {t === 'all' ? 'All' : t === 'statute' ? 'Statutes' : 'Cases'}
                      </button>
                    ))}
                  </div>
                  <button type="submit" className={styles.searchButton}>
                    Search
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Learning Path Section */}
          {!showLearningPath && (
            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
              <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Want to Learn Law?</h3>
              <button
                onClick={() => setShowLearningPath(true)}
                style={{
                  background: '#0f766e',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                Start Your Legal Education
              </button>
            </div>
          )}

          {/* Learning Path Cards */}
          {showLearningPath && (
            <div className={styles.featureGrid}>
              <div className={styles.featureCard} style={{ cursor: 'pointer' }} onClick={() => navigate('/law')}>
                <h3>📚 Structured Curriculum</h3>
                <p>Master criminal law, contracts, constitutional law, evidence, and more with a guided curriculum.</p>
                <button style={{ marginTop: '10px', width: '100%', padding: '8px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '4px' }}>
                  Browse Curriculum
                </button>
              </div>
              <div className={styles.featureCard} style={{ cursor: 'pointer' }} onClick={() => isLoggedIn ? navigate('/law/assessment') : navigate('/login')}>
                <h3>📊 Track Progress</h3>
                <p>Monitor your learning journey with detailed assessments and competency tracking.</p>
                <button style={{ marginTop: '10px', width: '100%', padding: '8px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '4px' }}>
                  {isLoggedIn ? 'View Progress' : 'Login to View'}
                </button>
              </div>
              <div className={styles.featureCard}>
                <h3>🔍 Research Tools</h3>
                <p>Access all current Commonwealth acts and regulations with full-text search.</p>
              </div>
              <div className={styles.featureCard}>
                <h3>💾 Save & Resume</h3>
                <p>Create an account to save searches, track your learning, and resume where you left off.</p>
              </div>
            </div>
          )}

          {/* Original Features Grid */}
          {!showLearningPath && (
            <div className={styles.featureGrid}>
              <div className={styles.featureCard}>
                <h3>Commonwealth Legislation</h3>
                <p>Access all current Commonwealth acts and regulations with full-text search.</p>
              </div>
              <div className={styles.featureCard}>
                <h3>High Court Cases</h3>
                <p>Search landmark decisions from the High Court of Australia with full judgments.</p>
              </div>
              <div className={styles.featureCard}>
                <h3>Citation Links</h3>
                <p>Discover which statutes are cited by cases and which cases apply statutes.</p>
              </div>
              <div className={styles.featureCard}>
                <h3>Save Searches</h3>
                <p>Create an account to save and re-run your favorite legal research queries.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className={styles.container} style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem', color: '#1e3a8a' }}>
            How to Use Lawlore
          </h2>
          <ol style={{ lineHeight: 1.8, color: '#374151' }}>
            <li style={{ marginBottom: '1rem' }}>
              <strong>Search:</strong> Enter a statute name, case citation, or legal concept in the search box.
            </li>
            <li style={{ marginBottom: '1rem' }}>
              <strong>Filter:</strong> Refine results by document type (statute or case), jurisdiction, and year.
            </li>
            <li style={{ marginBottom: '1rem' }}>
              <strong>Explore:</strong> Click any result to view the full text and discover related documents.
            </li>
            <li style={{ marginBottom: '1rem' }}>
              <strong>Save:</strong> Create an account to save your research and easily return to important searches.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
