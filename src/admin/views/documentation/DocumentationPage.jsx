/**
 * Documentation Page
 *
 * Main container for the documentation system
 * Shows Data and APIs tabs with content switching
 */

import { useState } from 'react';
import DataTab from './DataTab';
import APIsTab from './APIsTab';

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState('data');

  const tabs = [
    {
      label: 'Data',
      key: 'data',
      description: 'Database schema visualization'
    },
    {
      label: 'APIs',
      key: 'apis',
      description: 'API endpoint catalog'
    }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="flex items-center">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-4 font-semibold transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              title={tab.description}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {activeTab === 'data' ? <DataTab /> : <APIsTab />}
      </div>
    </div>
  );
}
