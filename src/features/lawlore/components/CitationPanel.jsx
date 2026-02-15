import { Link } from 'react-router-dom';
import styles from '../styles/lawlore.module.css';

export default function CitationPanel({ citations, title }) {
  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div className={styles.citationPanel}>
      <h3 className={styles.citationPanelTitle}>{title}</h3>
      <div>
        {citations.slice(0, 10).map((citation, idx) => (
          <Link
            key={idx}
            to={citation.type === 'statute' ? `/statute/${citation.id}` : `/case/${citation.id}`}
            style={{ textDecoration: 'none' }}
          >
            <div className={styles.citationItem}>
              <div className={styles.citationItemTitle}>{citation.title}</div>
              <div className={styles.citationItemCitation}>
                {citation.citation || citation.title}
              </div>
              {citation.year && (
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                  {citation.year}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
      {citations.length > 10 && (
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.75rem', textAlign: 'center' }}>
          +{citations.length - 10} more
        </p>
      )}
    </div>
  );
}
