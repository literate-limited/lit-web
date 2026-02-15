import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lawApi } from '../api/lawApi.js';
import styles from '../styles/lawlore.module.css';

export default function SaveSearch({ query, type, filters = {} }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Please enter a name for this search' });
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setMessage({ type: 'error', text: 'You must be logged in to save searches' });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await lawApi.saveSavedSearch(name, query, {
        type,
        ...filters
      });
      setMessage({ type: 'success', text: 'Search saved successfully!' });
      setName('');
    } catch (err) {
      console.error('Error saving search:', err);
      setMessage({ type: 'error', text: `Error saving search: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className={styles.saveSearchContainer}>
      <label className={styles.saveSearchLabel}>Save This Search</label>
      <input
        type="text"
        className={styles.saveSearchInput}
        placeholder="Name for this search..."
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        type="submit"
        className={styles.saveSearchButton}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
      {message && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.75rem',
          borderRadius: '0.375rem',
          background: message.type === 'success' ? '#efe' : '#fee',
          color: message.type === 'success' ? '#060' : '#c00',
          fontSize: '0.9rem'
        }}>
          {message.text}
        </div>
      )}
    </form>
  );
}
