/**
 * TeleprompTV Dashboard Page
 *
 * Main dashboard with quick actions and recent activity.
 */

import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { scripts, videos, exports as exportsApi } from '../api';

export default function TelepromptTVPage() {
  const { creditBalance } = useOutletContext();
  const [recentScripts, setRecentScripts] = useState([]);
  const [recentVideos, setRecentVideos] = useState([]);
  const [recentExports, setRecentExports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [scriptsData, videosData, exportsData] = await Promise.all([
        scripts.list({ limit: 5 }),
        videos.list({ limit: 5 }),
        exportsApi.list({ limit: 5 })
      ]);

      setRecentScripts(scriptsData.scripts || []);
      setRecentVideos(videosData.videos || []);
      setRecentExports(exportsData.exports || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
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
        <h1 className="ttv-page-title">Dashboard</h1>
        <p className="ttv-page-subtitle">Welcome to TeleprompTV</p>
      </div>

      {/* Quick Actions */}
      <div className="ttv-card">
        <h2 className="ttv-card-title">Quick Actions</h2>
        <div className="ttv-grid">
          <Link to="/ttv/scripts/new" className="ttv-quick-action">
            <span className="ttv-quick-icon">📝</span>
            <h3>New Script</h3>
            <p>Create a new teleprompt script</p>
          </Link>

          <Link to="/ttv/film" className="ttv-quick-action">
            <span className="ttv-quick-icon">🎥</span>
            <h3>Film Script</h3>
            <p>Record a video with teleprompter</p>
          </Link>

          <Link to="/ttv/videos" className="ttv-quick-action">
            <span className="ttv-quick-icon">⬆️</span>
            <h3>Upload Video</h3>
            <p>Upload and transcribe videos</p>
          </Link>

          <Link to="/ttv/credits" className="ttv-quick-action">
            <span className="ttv-quick-icon">💳</span>
            <h3>Buy Credits</h3>
            <p>{creditBalance} credits available</p>
          </Link>
        </div>
      </div>

      {/* Recent Scripts */}
      <div className="ttv-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="ttv-card-title" style={{ margin: 0 }}>Recent Scripts</h2>
          <Link to="/ttv/scripts" className="ttv-button ttv-button-secondary">
            View All
          </Link>
        </div>

        {recentScripts.length === 0 ? (
          <div className="ttv-empty-state">
            <div className="ttv-empty-icon">📝</div>
            <p className="ttv-empty-title">No scripts yet</p>
            <p className="ttv-empty-description">Create your first script to get started</p>
            <Link to="/ttv/scripts/new" className="ttv-button">
              Create Script
            </Link>
          </div>
        ) : (
          <ul className="ttv-list">
            {recentScripts.map((script) => (
              <li key={script.id} className="ttv-list-item">
                <Link to={`/ttv/scripts/${script.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h3 style={{ margin: '0 0 8px', color: '#F1F5F9' }}>{script.title}</h3>
                  <div style={{ fontSize: '14px', color: '#94A3B8' }}>
                    {script.script_type} • {new Date(script.created_at).toLocaleDateString()}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent Videos */}
      <div className="ttv-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="ttv-card-title" style={{ margin: 0 }}>Recent Videos</h2>
          <Link to="/ttv/videos" className="ttv-button ttv-button-secondary">
            View All
          </Link>
        </div>

        {recentVideos.length === 0 ? (
          <div className="ttv-empty-state">
            <div className="ttv-empty-icon">🎬</div>
            <p className="ttv-empty-title">No videos yet</p>
            <p className="ttv-empty-description">Upload or record your first video</p>
          </div>
        ) : (
          <ul className="ttv-list">
            {recentVideos.map((video) => (
              <li key={video.id} className="ttv-list-item">
                <h3 style={{ margin: '0 0 8px', color: '#F1F5F9' }}>{video.title}</h3>
                <div style={{ fontSize: '14px', color: '#94A3B8' }}>
                  {video.duration_seconds ? `${Math.round(video.duration_seconds)}s` : 'Duration unknown'} •
                  {' '}{new Date(video.created_at).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent Exports */}
      {recentExports.length > 0 && (
        <div className="ttv-card">
          <h2 className="ttv-card-title">Recent Exports</h2>
          <ul className="ttv-list">
            {recentExports.map((exp) => (
              <li key={exp.id} className="ttv-list-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px', color: '#F1F5F9' }}>
                      Export #{exp.id.slice(0, 8)}
                    </h3>
                    <div style={{ fontSize: '14px', color: '#94A3B8' }}>
                      {exp.resolution} • {exp.export_status}
                    </div>
                  </div>
                  {exp.export_status === 'complete' && (
                    <Link to={`/ttv/exports/${exp.id}`} className="ttv-button">
                      Download
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
