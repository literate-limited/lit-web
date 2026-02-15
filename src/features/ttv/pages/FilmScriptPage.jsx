/**
 * Film Script Page
 *
 * View and edit a specific script, film with teleprompter.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { scripts } from '../api';

export default function FilmScriptPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    scriptType: '',
    rawScript: '',
    status: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      loadScript();
    }
  }, [id]);

  const loadScript = async () => {
    try {
      setLoading(true);
      const result = await scripts.get(id);
      setScript(result.script);
      setEditForm({
        title: result.script.title,
        scriptType: result.script.script_type,
        rawScript: result.script.raw_script || '',
        status: result.script.status
      });
    } catch (error) {
      console.error('Failed to load script:', error);
      setError('Failed to load script');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      await scripts.update(id, {
        title: editForm.title,
        scriptType: editForm.scriptType,
        rawScript: editForm.rawScript,
        status: editForm.status
      });

      await loadScript();
      setEditing(false);
    } catch (error) {
      console.error('Failed to save script:', error);
      setError('Failed to save script');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this script?')) {
      return;
    }

    try {
      await scripts.delete(id);
      navigate('/ttv/scripts');
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

  if (!script) {
    return (
      <div className="ttv-page">
        <div className="ttv-alert ttv-alert-error">
          Script not found
        </div>
      </div>
    );
  }

  return (
    <div className="ttv-page">
      <div className="ttv-page-header">
        <h1 className="ttv-page-title">{script.title}</h1>
        <p className="ttv-page-subtitle">
          {script.script_type} • {script.status} •
          {' '}Created {new Date(script.created_at).toLocaleDateString()}
        </p>
      </div>

      {error && (
        <div className="ttv-alert ttv-alert-error">
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        {!editing ? (
          <>
            <button className="ttv-button" onClick={() => setEditing(true)}>
              Edit Script
            </button>
            <button className="ttv-button ttv-button-secondary" onClick={() => navigate('/ttv/film?script=' + id)}>
              🎥 Film with Teleprompter
            </button>
            <button className="ttv-button ttv-button-danger" onClick={handleDelete}>
              Delete
            </button>
          </>
        ) : (
          <>
            <button
              className="ttv-button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              className="ttv-button ttv-button-secondary"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Script Content */}
      <div className="ttv-card">
        {editing ? (
          <div>
            <div className="ttv-form-group">
              <label className="ttv-label">Title</label>
              <input
                type="text"
                className="ttv-input"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>

            <div className="ttv-form-group">
              <label className="ttv-label">Type</label>
              <select
                className="ttv-select"
                value={editForm.scriptType}
                onChange={(e) => setEditForm({ ...editForm, scriptType: e.target.value })}
              >
                <option value="other">Other</option>
                <option value="voiceover">Voiceover</option>
                <option value="sync">Sync</option>
              </select>
            </div>

            <div className="ttv-form-group">
              <label className="ttv-label">Status</label>
              <select
                className="ttv-select"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="ttv-form-group">
              <label className="ttv-label">Script Text</label>
              <textarea
                className="ttv-textarea"
                value={editForm.rawScript}
                onChange={(e) => setEditForm({ ...editForm, rawScript: e.target.value })}
                style={{ minHeight: '400px', fontFamily: 'monospace', fontSize: '16px', lineHeight: '1.8' }}
              />
            </div>
          </div>
        ) : (
          <div>
            <h2 className="ttv-card-title">Script</h2>
            {script.raw_script ? (
              <div style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '16px',
                lineHeight: '1.8',
                color: '#F1F5F9'
              }}>
                {script.raw_script}
              </div>
            ) : (
              <div className="ttv-empty-state">
                <p className="ttv-empty-title">No script text</p>
                <p className="ttv-empty-description">Click "Edit Script" to add text</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cuts Section */}
      {script.cuts && script.cuts.length > 0 && (
        <div className="ttv-card">
          <h2 className="ttv-card-title">Cuts ({script.cuts.length})</h2>
          <ul className="ttv-list">
            {script.cuts.map((cut, index) => (
              <li key={cut.id} className="ttv-list-item">
                <div>
                  <strong>Cut {index + 1}</strong>
                  {cut.start_time !== null && (
                    <span style={{ marginLeft: '12px', color: '#94A3B8' }}>
                      {cut.start_time}s - {cut.end_time}s
                    </span>
                  )}
                </div>
                <div style={{ marginTop: '8px', color: '#94A3B8', fontSize: '14px' }}>
                  {cut.cut_text}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
