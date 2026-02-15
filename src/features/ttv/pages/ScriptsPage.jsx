/**
 * Scripts Page
 *
 * List and manage teleprompt scripts.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { scripts } from '../api';

export default function ScriptsPage() {
  const navigate = useNavigate();
  const [scriptsList, setScriptsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newScript, setNewScript] = useState({
    title: '',
    scriptType: 'other',
    rawScript: ''
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    try {
      setLoading(true);
      const result = await scripts.list();
      setScriptsList(result.scripts || []);
    } catch (error) {
      console.error('Failed to load scripts:', error);
      setError('Failed to load scripts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScript = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError(null);

      const result = await scripts.create(newScript);

      // Navigate to the new script
      navigate(`/ttv/scripts/${result.script.id}`);
    } catch (error) {
      console.error('Failed to create script:', error);
      setError(error.message || 'Failed to create script');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteScript = async (scriptId) => {
    if (!confirm('Are you sure you want to delete this script?')) {
      return;
    }

    try {
      await scripts.delete(scriptId);
      loadScripts();
    } catch (error) {
      console.error('Failed to delete script:', error);
      setError('Failed to delete script');
    }
  };

  if (loading) {
    return (
      <div className="ttv-page">
        <div className="ttv-loading">
          <div className="ttv-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="ttv-page">
      <div className="ttv-page-header">
        <h1 className="ttv-page-title">Scripts</h1>
        <p className="ttv-page-subtitle">Manage your teleprompt scripts</p>
      </div>

      {error && (
        <div className="ttv-alert ttv-alert-error">
          {error}
        </div>
      )}

      {/* New Script Form */}
      {showNewForm ? (
        <div className="ttv-card">
          <h2 className="ttv-card-title">Create New Script</h2>
          <form onSubmit={handleCreateScript}>
            <div className="ttv-form-group">
              <label className="ttv-label">Title</label>
              <input
                type="text"
                className="ttv-input"
                value={newScript.title}
                onChange={(e) => setNewScript({ ...newScript, title: e.target.value })}
                required
                placeholder="Enter script title"
              />
            </div>

            <div className="ttv-form-group">
              <label className="ttv-label">Type</label>
              <select
                className="ttv-select"
                value={newScript.scriptType}
                onChange={(e) => setNewScript({ ...newScript, scriptType: e.target.value })}
              >
                <option value="other">Other</option>
                <option value="voiceover">Voiceover</option>
                <option value="sync">Sync</option>
              </select>
            </div>

            <div className="ttv-form-group">
              <label className="ttv-label">Script Text</label>
              <textarea
                className="ttv-textarea"
                value={newScript.rawScript}
                onChange={(e) => setNewScript({ ...newScript, rawScript: e.target.value })}
                placeholder="Enter your script text here..."
                style={{ minHeight: '200px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                className="ttv-button"
                disabled={creating || !newScript.title}
              >
                {creating ? 'Creating...' : 'Create Script'}
              </button>
              <button
                type="button"
                className="ttv-button ttv-button-secondary"
                onClick={() => setShowNewForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ marginBottom: '24px' }}>
          <button className="ttv-button" onClick={() => setShowNewForm(true)}>
            + New Script
          </button>
        </div>
      )}

      {/* Scripts List */}
      {scriptsList.length === 0 ? (
        <div className="ttv-card">
          <div className="ttv-empty-state">
            <div className="ttv-empty-icon">📝</div>
            <p className="ttv-empty-title">No scripts yet</p>
            <p className="ttv-empty-description">
              Create your first teleprompt script to get started
            </p>
            <button className="ttv-button" onClick={() => setShowNewForm(true)}>
              Create Your First Script
            </button>
          </div>
        </div>
      ) : (
        <div className="ttv-card">
          <h2 className="ttv-card-title">All Scripts ({scriptsList.length})</h2>
          <ul className="ttv-list">
            {scriptsList.map((script) => (
              <li key={script.id} className="ttv-list-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <Link
                      to={`/ttv/scripts/${script.id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <h3 style={{ margin: '0 0 8px', color: '#F1F5F9' }}>{script.title}</h3>
                      <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '8px' }}>
                        {script.script_type} • {script.status} •
                        {' '}{new Date(script.created_at).toLocaleDateString()}
                      </div>
                      {script.raw_script && (
                        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
                          {script.raw_script.substring(0, 150)}
                          {script.raw_script.length > 150 ? '...' : ''}
                        </p>
                      )}
                    </Link>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                    <Link to={`/ttv/scripts/${script.id}`} className="ttv-button ttv-button-secondary">
                      Edit
                    </Link>
                    <button
                      className="ttv-button ttv-button-danger"
                      onClick={() => handleDeleteScript(script.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
