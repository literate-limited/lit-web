import { Link } from 'react-router-dom';
import styles from '../styles/lawlore.module.css';

export default function SearchResults({ results }) {
  if (!results || results.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No results found</p>
      </div>
    );
  }

  return (
    <div className={styles.resultsList}>
      {results.map(result => (
        <Link
          key={result.id}
          to={result.type === 'statute' ? `/statute/${result.id}` : `/case/${result.id}`}
          className={styles.resultItemLink}
        >
          <div className={styles.resultItem}>
            <h3 className={styles.resultTitle}>{result.title}</h3>
            <div className={styles.resultMeta}>
              <span className={styles.resultBadge}>
                {result.type === 'statute' ? 'Statute' : 'Case'}
              </span>
              {result.jurisdiction && (
                <span className={styles.resultBadge}>{result.jurisdiction}</span>
              )}
              {result.year && <span>{result.year}</span>}
            </div>
            {result.excerpt && (
              <p className={styles.resultExcerpt}>{result.excerpt}</p>
            )}
            {result.citation && (
              <p className={styles.resultCitation}>
                {result.type === 'statute' ? 'Citation: ' : ''}{result.citation}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
