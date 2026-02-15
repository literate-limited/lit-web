import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { lawApi } from '../api/lawApi.js';
import CitationPanel from '../components/CitationPanel.jsx';
import SaveSearch from '../components/SaveSearch.jsx';
import styles from '../styles/lawlore.module.css';

export default function StatuteDetailPage() {
  const { id } = useParams();
  const [statute, setStatute] = useState(null);
  const [citations, setCitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStatute() {
      try {
        setLoading(true);
        const statuteData = await lawApi.getStatute(id);
        setStatute(statuteData);

        const citationData = await lawApi.getCitations(id, 'statute');
        setCitations(citationData.citations || []);
      } catch (err) {
        console.error('Error loading statute:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadStatute();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.container} style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className={styles.emptyState}>
          <div className={styles.loadingSpinner}></div>
          <p style={{ marginTop: '1rem' }}>Loading statute...</p>
        </div>
      </div>
    );
  }

  if (error || !statute) {
    return (
      <div className={styles.container} style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div style={{
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '0.5rem',
          padding: '2rem',
          color: '#c00',
          textAlign: 'center'
        }}>
          <h2>Error loading statute</h2>
          <p>{error || 'Statute not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        <div>
          <div className={styles.detailPage}>
            <div className={styles.detailHeader}>
              <h1 className={styles.detailTitle}>{statute.title}</h1>
              <div className={styles.detailMeta}>
                <div>
                  <strong>Short Title:</strong> {statute.shortTitle || 'N/A'}
                </div>
                <div>
                  <strong>Year:</strong> {statute.year || 'N/A'}
                </div>
                <div>
                  <strong>Status:</strong> <span className={styles.resultBadge}>{statute.status}</span>
                </div>
                <div>
                  <strong>Jurisdiction:</strong> {statute.jurisdiction}
                </div>
              </div>
              {statute.effectiveDate && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.95rem', color: '#6b7280' }}>
                  <strong>Effective:</strong> {new Date(statute.effectiveDate).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className={styles.detailContent}>
              {statute.content}
            </div>
          </div>

          {statute.sections && statute.sections.length > 0 && (
            <div className={styles.section} style={{ marginTop: '2rem' }}>
              <h2 className={styles.sectionTitle}>Sections</h2>
              <ul style={{ marginLeft: '1.5rem' }}>
                {statute.sections.map((section, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>
                    {typeof section === 'string' ? section : section.number}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {statute.amendments && statute.amendments.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Recent Amendments</h2>
              <ul style={{ marginLeft: '1.5rem' }}>
                {statute.amendments.map((amendment, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>
                    {typeof amendment === 'string' ? amendment : amendment.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <SaveSearch
            query={statute.title}
            type="statute"
          />
          <CitationPanel citations={citations} title="Cases Citing This Statute" />
        </div>
      </div>
    </div>
  );
}
