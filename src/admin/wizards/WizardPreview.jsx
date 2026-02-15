import { useState } from 'react';
import WizardRenderer from '../../components/WizardRenderer/WizardRenderer';

export default function WizardPreview({ wizard }) {
  const [showPreview, setShowPreview] = useState(true);
  const [formData, setFormData] = useState({});
  const [completedData, setCompletedData] = useState(null);

  const handleComplete = (data) => {
    setCompletedData(data);
    setShowPreview(false);
  };

  const handleRestart = () => {
    setFormData({});
    setCompletedData(null);
    setShowPreview(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Preview Area */}
      <div className="bg-slate-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 min-h-96 flex items-center justify-center">
          {showPreview ? (
            <div className="w-full">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                {/* Simulate WizardRenderer output */}
                <WizardRenderer
                  wizardKey={wizard.key}
                  isOpen={true}
                  onComplete={handleComplete}
                  onCancel={() => {}}
                />
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h4 className="text-xl font-semibold text-white mb-2">
                Wizard Completed
              </h4>
              <p className="text-slate-300 mb-4">
                Form data was captured successfully
              </p>
              <button
                onClick={handleRestart}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition-colors"
              >
                Restart Preview
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Config & Data Display */}
      <div className="space-y-4">
        {/* Wizard Config */}
        <div className="bg-slate-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
          <div className="bg-slate-800 rounded p-4 text-slate-100 font-mono text-sm overflow-auto max-h-96">
            <pre>{JSON.stringify(wizard, null, 2)}</pre>
          </div>
        </div>

        {/* Captured Data */}
        {completedData && (
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              📊 Captured Data
            </h3>
            <div className="bg-green-900 rounded p-4 text-green-100 font-mono text-sm overflow-auto max-h-96 border border-green-700">
              <pre>{JSON.stringify(completedData, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Test Info */}
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-200 mb-2">💡 Preview Tips</h4>
          <ul className="text-xs text-blue-200 space-y-1">
            <li>• Test all steps and conditional logic</li>
            <li>• Verify validation works (required fields)</li>
            <li>• Check step branching and next-step logic</li>
            <li>• Review captured form data</li>
            <li>• Test on different screen sizes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
