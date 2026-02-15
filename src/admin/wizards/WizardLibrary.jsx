import { useState } from 'react';

export default function WizardLibrary({
  wizards,
  loading,
  onCreateNew,
  onSelectWizard,
  onDeleteWizard,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = wizards.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-900 text-green-200 border-green-700';
      case 'draft':
        return 'bg-yellow-900 text-yellow-200 border-yellow-700';
      case 'archived':
        return 'bg-gray-700 text-gray-300 border-gray-600';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'onboarding':
        return '👋';
      case 'setup':
        return '⚙️';
      case 'process':
        return '🔄';
      default:
        return '📋';
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
    <div>
      {/* Header with Create Button */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Wizards</h2>
        <button
          onClick={onCreateNew}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          + New Wizard
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search wizards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Wizards List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg mb-4">
            {wizards.length === 0 ? 'No wizards yet' : 'No wizards match your filters'}
          </p>
          {wizards.length === 0 && (
            <button
              onClick={onCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Create Your First Wizard
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((wizard) => (
            <div
              key={wizard.key}
              className="bg-slate-700 border border-slate-600 rounded-lg p-4 hover:border-slate-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getTypeIcon(wizard.type)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {wizard.name}
                      </h3>
                      <p className="text-sm text-slate-400 font-mono">
                        {wizard.key}
                      </p>
                    </div>
                  </div>
                  {wizard.description && (
                    <p className="text-slate-400 text-sm mb-3">
                      {wizard.description}
                    </p>
                  )}
                  <div className="flex gap-2 items-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(wizard.status)}`}>
                      {wizard.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      v{wizard.version}
                    </span>
                    {wizard.publishedAt && (
                      <span className="text-xs text-slate-500">
                        Published: {new Date(wizard.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => onSelectWizard(wizard)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    Edit
                  </button>
                  {wizard.status !== 'archived' && (
                    <button
                      onClick={() => onDeleteWizard(wizard.key)}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
