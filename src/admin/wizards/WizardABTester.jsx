import { useState, useEffect } from 'react';
import axios from 'axios';
import VariantManager from './ab-testing/VariantManager';
import TestRunner from './ab-testing/TestRunner';
import TestResults from './ab-testing/TestResults';

const API_URL = import.meta.env.VITE_API_URL;

export default function WizardABTester({ wizardKey }) {
  const [activeTab, setActiveTab] = useState('variants');
  const [variants, setVariants] = useState([]);
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, [wizardKey]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [variantsRes, testsRes] = await Promise.all([
        axios.get(`${API_URL}/wizards/${wizardKey}/variants`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/wizards/${wizardKey}/ab-tests`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setVariants(variantsRes.data.variants || []);
      setTests(testsRes.data.tests || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load A/B testing data');
    } finally {
      setLoading(false);
    }
  };

  const handleVariantCreated = () => {
    fetchData();
  };

  const handleTestCreated = () => {
    fetchData();
    setActiveTab('tests');
  };

  const handleTestResults = (results) => {
    setTestResults(results);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">A/B Testing Suite</h2>
        <p className="text-slate-400">
          Create wizard variants and run experiments to improve completion rates
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('variants')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'variants'
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          🎯 Variants ({variants.length})
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'tests'
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          🧪 Tests ({tests.length})
        </button>
        {testResults && (
          <button
            onClick={() => setActiveTab('results')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'results'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            📊 Results
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        {activeTab === 'variants' && (
          <VariantManager
            wizardKey={wizardKey}
            variants={variants}
            onVariantCreated={handleVariantCreated}
          />
        )}

        {activeTab === 'tests' && (
          <TestRunner
            wizardKey={wizardKey}
            variants={variants}
            tests={tests}
            onTestCreated={handleTestCreated}
            onTestSelected={(test) => {
              setSelectedTest(test);
              setActiveTab('results');
            }}
            onResultsAvailable={handleTestResults}
          />
        )}

        {activeTab === 'results' && testResults && (
          <TestResults results={testResults} onBack={() => setActiveTab('tests')} />
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-200 mb-2">🧪 How A/B Testing Works:</h4>
        <ol className="text-xs text-blue-200 space-y-1 list-decimal list-inside">
          <li>Create 2+ variants of your wizard with different designs/flows</li>
          <li>Allocate traffic percentage to each variant (e.g., 50/50 split)</li>
          <li>Run a test comparing completion rates between variants</li>
          <li>Statistical analysis determines which version performs better</li>
          <li>Promote the winner and archive the loser</li>
        </ol>
      </div>
    </div>
  );
}
