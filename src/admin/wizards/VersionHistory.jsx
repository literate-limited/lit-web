import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function VersionHistory({ wizardKey, onRollback }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [rolling, setRolling] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchVersions();
  }, [wizardKey]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/wizards/${wizardKey}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVersions(res.data.versions || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (versionNumber) => {
    if (
      !window.confirm(
        `Are you sure you want to rollback to version ${versionNumber}? This will create a new version with the old configuration.`
      )
    ) {
      return;
    }

    setRolling(true);
    try {
      await axios.post(
        `${API_URL}/wizards/${wizardKey}/versions/${versionNumber}/rollback`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchVersions();
      onRollback?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to rollback');
    } finally {
      setRolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Version Timeline */}
      <div className="lg:col-span-1">
        <h3 className="text-lg font-semibold text-white mb-4">Version Timeline</h3>
        {versions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No versions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map((version, index) => (
              <div
                key={version._id}
                onClick={() => setSelectedVersion(version)}
                className={`p-3 rounded cursor-pointer border transition-all ${
                  selectedVersion?._id === version._id
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-slate-700 border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-white">v{version.version}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(version.createdAt).toLocaleDateString()} at{' '}
                      {new Date(version.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  {index === 0 && (
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                      Current
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Version Details */}
      <div className="lg:col-span-2">
        {error && (
          <div className="mb-4 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {selectedVersion ? (
          <div className="space-y-4">
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-white">
                    Version {selectedVersion.version}
                  </h4>
                  <p className="text-sm text-slate-400">
                    Created: {new Date(selectedVersion.createdAt).toLocaleString()}
                  </p>
                </div>
                {versions.indexOf(selectedVersion) !== 0 && (
                  <button
                    onClick={() => handleRollback(selectedVersion.version)}
                    disabled={rolling}
                    className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded transition-colors"
                  >
                    {rolling ? 'Rolling back...' : '⏮️ Rollback'}
                  </button>
                )}
              </div>

              <div className="bg-slate-800 rounded p-4 text-slate-100 font-mono text-sm overflow-auto max-h-96">
                <pre>{JSON.stringify(selectedVersion.config, null, 2)}</pre>
              </div>
            </div>

            {/* Version Info */}
            <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-blue-200 mb-2">
                📋 Version Info
              </h5>
              <div className="text-xs text-blue-200 space-y-1">
                <p>
                  <strong>Steps:</strong> {selectedVersion.config.steps?.length || 0}
                </p>
                <p>
                  <strong>Version:</strong> {selectedVersion.version}
                </p>
                <p>
                  <strong>Created:</strong>{' '}
                  {new Date(selectedVersion.createdAt).toLocaleDateString()}
                </p>
                {selectedVersion.createdBy && (
                  <p>
                    <strong>Created By:</strong> {selectedVersion.createdBy}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <p>Select a version to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
