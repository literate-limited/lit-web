/**
 * Videos Page
 *
 * List and manage videos, upload new videos, trigger transcription.
 */

import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { videos as videosApi } from '../api';

export default function VideosPage() {
  const { refreshCredits } = useOutletContext();
  const [videosList, setVideosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const result = await videosApi.list();
      setVideosList(result.videos || []);
    } catch (error) {
      console.error('Failed to load videos:', error);
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      const result = await videosApi.upload(file);

      setSuccess(`Video "${result.video.title}" uploaded successfully!`);
      loadVideos();
      refreshCredits();

      // Reset file input
      e.target.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error.message || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const handleTranscribe = async (videoId) => {
    try {
      setTranscribing({ ...transcribing, [videoId]: true });
      setError(null);

      const result = await videosApi.transcribe(videoId);

      setSuccess(`Video transcribed successfully! Charged ${result.creditsCharged} credits.`);
      loadVideos();
      refreshCredits();
    } catch (error) {
      console.error('Transcription failed:', error);
      if (error.message?.includes('INSUFFICIENT_CREDITS')) {
        setError('Insufficient credits. Please purchase more credits to transcribe this video.');
      } else {
        setError(error.message || 'Failed to transcribe video');
      }
    } finally {
      setTranscribing({ ...transcribing, [videoId]: false });
    }
  };

  const handleDelete = async (videoId) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      await videosApi.delete(videoId);
      setSuccess('Video deleted successfully');
      loadVideos();
    } catch (error) {
      console.error('Delete failed:', error);
      setError('Failed to delete video');
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
        <h1 className="ttv-page-title">Videos</h1>
        <p className="ttv-page-subtitle">Upload and manage your videos</p>
      </div>

      {error && (
        <div className="ttv-alert ttv-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="ttv-alert ttv-alert-success">
          {success}
        </div>
      )}

      {/* Upload Section */}
      <div className="ttv-card">
        <h2 className="ttv-card-title">Upload Video</h2>
        <div className="ttv-form-group">
          <label className="ttv-label">
            Select Video File (max 500MB)
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="ttv-input"
            style={{ padding: '12px' }}
          />
          {uploading && (
            <div style={{ marginTop: '12px', color: '#10B981' }}>
              Uploading video...
            </div>
          )}
        </div>
      </div>

      {/* Videos List */}
      {videosList.length === 0 ? (
        <div className="ttv-card">
          <div className="ttv-empty-state">
            <div className="ttv-empty-icon">🎬</div>
            <p className="ttv-empty-title">No videos yet</p>
            <p className="ttv-empty-description">
              Upload your first video to get started
            </p>
          </div>
        </div>
      ) : (
        <div className="ttv-card">
          <h2 className="ttv-card-title">All Videos ({videosList.length})</h2>
          <ul className="ttv-list">
            {videosList.map((video) => (
              <li key={video.id} className="ttv-list-item">
                <div>
                  <h3 style={{ margin: '0 0 8px', color: '#F1F5F9' }}>{video.title}</h3>
                  <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '12px' }}>
                    {video.duration_seconds
                      ? `Duration: ${Math.round(video.duration_seconds)}s`
                      : 'Duration unknown'
                    }
                    {' '}•{' '}
                    {video.file_size_bytes
                      ? `Size: ${(video.file_size_bytes / 1024 / 1024).toFixed(2)}MB`
                      : 'Size unknown'
                    }
                    {' '}•{' '}
                    Uploaded {new Date(video.created_at).toLocaleDateString()}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className="ttv-button"
                      onClick={() => handleTranscribe(video.id)}
                      disabled={transcribing[video.id]}
                    >
                      {transcribing[video.id] ? 'Transcribing...' : '🎙️ Transcribe'}
                    </button>

                    <button
                      className="ttv-button ttv-button-danger"
                      onClick={() => handleDelete(video.id)}
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
