import styles from '../styles/lawlore.module.css';

export default function SearchFilters({ facets, filters, onFilterChange }) {
  const jurisdictions = facets?.jurisdictions || [];
  const yearRange = facets?.years || { min: null, max: null };

  return (
    <aside className={styles.sidebar}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', color: '#1e3a8a' }}>
        Filters
      </h2>

      {/* Document Type */}
      <div className={styles.filterSection}>
        <h3 className={styles.filterTitle}>Document Type</h3>
        <div className={styles.filterOptions}>
          {['all', 'statute', 'case'].map(type => (
            <div key={type} className={styles.filterOption}>
              <input
                type="radio"
                id={`type-${type}`}
                name="type"
                value={type}
                checked={filters.type === type}
                onChange={() => onFilterChange('type', type)}
              />
              <label htmlFor={`type-${type}`}>
                {type === 'all' ? 'All Documents' : type === 'statute' ? 'Statutes' : 'Cases'}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Jurisdiction */}
      {jurisdictions.length > 0 && (
        <div className={styles.filterSection}>
          <h3 className={styles.filterTitle}>Jurisdiction</h3>
          <div className={styles.filterOptions}>
            {jurisdictions.map(jurisdiction => (
              <div key={jurisdiction.code} className={styles.filterOption}>
                <input
                  type="checkbox"
                  id={`jurisdiction-${jurisdiction.code}`}
                  checked={filters.jurisdiction === jurisdiction.code}
                  onChange={() => onFilterChange(
                    'jurisdiction',
                    filters.jurisdiction === jurisdiction.code ? null : jurisdiction.code
                  )}
                />
                <label htmlFor={`jurisdiction-${jurisdiction.code}`}>
                  {jurisdiction.name}
                </label>
                <span className={styles.count}>{jurisdiction.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Year Range */}
      {yearRange.min !== null && yearRange.max !== null && (
        <div className={styles.filterSection}>
          <h3 className={styles.filterTitle}>Year Range</h3>
          <div className={styles.yearRangeContainer}>
            <input
              type="number"
              className={styles.yearInput}
              placeholder="From"
              min={yearRange.min}
              max={yearRange.max}
              value={filters.yearFrom || ''}
              onChange={(e) => onFilterChange('yearFrom', e.target.value ? parseInt(e.target.value) : null)}
            />
            <input
              type="number"
              className={styles.yearInput}
              placeholder="To"
              min={yearRange.min}
              max={yearRange.max}
              value={filters.yearTo || ''}
              onChange={(e) => onFilterChange('yearTo', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
        </div>
      )}
    </aside>
  );
}
