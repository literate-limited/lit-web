import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { lawApi } from '../api/lawApi.js';
import CitationPanel from '../components/CitationPanel.jsx';
import SaveSearch from '../components/SaveSearch.jsx';
import styles from '../styles/lawlore.module.css';

export default function CaseDetailPage() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [citations, setCitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCase() {
      try {
        setLoading(true);
        const caseDetails = await lawApi.getCase(id);
        setCaseData(caseDetails);

        const citationData = await lawApi.getCitations(id, 'case');
        setCitations(citationData.citations || []);
      } catch (err) {
        console.error('Error loading case:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCase();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.container} style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className={styles.emptyState}>
          <div className={styles.loadingSpinner}></div>
          <p style={{ marginTop: '1rem' }}>Loading case...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
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
          <h2>Error loading case</h2>
          <p>{error || 'Case not found'}</p>
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
              <h1 className={styles.detailTitle}>{caseData.title}</h1>
              <div className={styles.detailMeta}>
                <div>
                  <strong>Citation:</strong> <span className={styles.resultCitation}>{caseData.citation}</span>
                </div>
                <div>
                  <strong>Year:</strong> {caseData.year}
                </div>
                <div>
                  <strong>Court:</strong> {caseData.court}
                </div>
                <div>
                  <strong>Jurisdiction:</strong> {caseData.jurisdiction}
                </div>
              </div>
              {caseData.judges && caseData.judges.length > 0 && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.95rem', color: '#6b7280' }}>
                  <strong>Judges:</strong> {Array.isArray(caseData.judges) ? caseData.judges.join(', ') : caseData.judges}
                </div>
              )}
            </div>

            {caseData.headnotes && (
              <div style={{ padding: '1.5rem', background: '#f0f9ff', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e3a8a', marginBottom: '0.75rem' }}>
                  Headnotes
                </h3>
                <p style={{ color: '#374151', lineHeight: 1.6 }}>{caseData.headnotes}</p>
              </div>
            )}

            <div className={styles.detailContent}>
              {caseData.content}
            </div>

            {caseData.holding && (
              <div style={{ padding: '1.5rem', background: '#f0f9ff', borderTop: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e3a8a', marginBottom: '0.75rem' }}>
                  Holding
                </h3>
                <p style={{ color: '#374151', lineHeight: 1.6 }}>{caseData.holding}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <SaveSearch query={caseData.citation} type="case" />
          <CitationPanel citations={citations} title="Statutes Cited" />
        </div>
      </div>
    </div>
  );
}
