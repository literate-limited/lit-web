import { useState, useEffect } from 'react';
import axios from 'axios';
import WizardLibrary from '../wizards/WizardLibrary';
import WizardEditor from '../wizards/WizardEditor';
import VersionHistory from '../wizards/VersionHistory';

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminWizardManager() {
  const [activeTab, setActiveTab] = useState('library');
  const [wizards, setWizards] = useState([]);
  const [selectedWizard, setSelectedWizard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  // Fetch all wizards
  const fetchWizards = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/wizards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWizards(res.data.wizards || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load wizards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWizards();
  }, []);

  const handleCreateNew = () => {
    setSelectedWizard(null);
    setActiveTab('editor');
  };

  const handleSelectWizard = (wizard) => {
    setSelectedWizard(wizard);
    setActiveTab('editor');
  };

  const handleWizardSaved = () => {
    fetchWizards();
    setActiveTab('library');
  };

  const handleDeleteWizard = async (wizardKey) => {
    if (!window.confirm('Are you sure you want to archive this wizard?')) return;

    try {
      await axios.post(`${API_URL}/wizards/${wizardKey}/archive`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchWizards();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to archive wizard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Wizard Manager</h1>
          <p className="text-slate-400">
            Create, edit, and manage wizards without code deployments
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'library'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            📚 Wizard Library
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'editor'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            ✏️ Editor
          </button>
          <button
            onClick={() => {
              if (selectedWizard) setActiveTab('versions');
            }}
            disabled={!selectedWizard}
            className={`px-6 py-3 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              activeTab === 'versions'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            📜 Version History
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tab Content */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          {activeTab === 'library' && (
            <WizardLibrary
              wizards={wizards}
              loading={loading}
              onCreateNew={handleCreateNew}
              onSelectWizard={handleSelectWizard}
              onDeleteWizard={handleDeleteWizard}
            />
          )}

          {activeTab === 'editor' && (
            <WizardEditor
              wizard={selectedWizard}
              onSave={handleWizardSaved}
              onCancel={() => setActiveTab('library')}
            />
          )}

          {activeTab === 'versions' && selectedWizard && (
            <VersionHistory
              wizardKey={selectedWizard.key}
              onRollback={() => {
                fetchWizards();
                setSelectedWizard(null);
                setActiveTab('library');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
