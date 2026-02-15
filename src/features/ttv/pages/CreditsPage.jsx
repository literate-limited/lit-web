/**
 * Credits Page
 *
 * View credit balance, transaction history, and purchase credits.
 */

import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { credits as creditsApi } from '../api';

export default function CreditsPage() {
  const { creditBalance, refreshCredits } = useOutletContext();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const result = await creditsApi.getHistory({ limit: 50 });
      setTransactions(result.transactions || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const creditPackages = [
    { name: 'Starter Pack', credits: 100, price: 9.99 },
    { name: 'Pro Pack', credits: 500, price: 39.99 },
    { name: 'Business Pack', credits: 2000, price: 149.99 },
    { name: 'Enterprise Pack', credits: 10000, price: 599.99 }
  ];

  return (
    <div className="ttv-page">
      <div className="ttv-page-header">
        <h1 className="ttv-page-title">Credits</h1>
        <p className="ttv-page-subtitle">Manage your credit balance</p>
      </div>

      {/* Current Balance */}
      <div className="ttv-card">
        <h2 className="ttv-card-title">Current Balance</h2>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#10B981', marginBottom: '16px' }}>
          {creditBalance !== null ? creditBalance : '...'} credits
        </div>
        <p style={{ color: '#94A3B8', margin: 0 }}>
          Credits are used for transcription, AI features, and video exports
        </p>
      </div>

      {/* Credit Packages */}
      <div className="ttv-card">
        <h2 className="ttv-card-title">Purchase Credits</h2>
        <div className="ttv-grid">
          {creditPackages.map((pkg) => (
            <div
              key={pkg.name}
              style={{
                background: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center'
              }}
            >
              <h3 style={{ margin: '0 0 8px', color: '#F1F5F9' }}>{pkg.name}</h3>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10B981', margin: '16px 0' }}>
                {pkg.credits}
              </div>
              <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '16px' }}>
                credits
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '16px' }}>
                ${pkg.price}
              </div>
              <button className="ttv-button" style={{ width: '100%' }}>
                Purchase
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Credit Costs */}
      <div className="ttv-card">
        <h2 className="ttv-card-title">Credit Costs</h2>
        <ul className="ttv-list">
          <li className="ttv-list-item">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Transcription</span>
              <strong>1 credit/minute</strong>
            </div>
          </li>
          <li className="ttv-list-item">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Video Export (SD)</span>
              <strong>2 credits</strong>
            </div>
          </li>
          <li className="ttv-list-item">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Video Export (HD)</span>
              <strong>5 credits</strong>
            </div>
          </li>
          <li className="ttv-list-item">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Video Export (4K)</span>
              <strong>10 credits</strong>
            </div>
          </li>
          <li className="ttv-list-item">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>AI Script Generation</span>
              <strong>3 credits</strong>
            </div>
          </li>
          <li className="ttv-list-item">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>AI Script Enhancement</span>
              <strong>2 credits</strong>
            </div>
          </li>
        </ul>
      </div>

      {/* Transaction History */}
      <div className="ttv-card">
        <h2 className="ttv-card-title">Transaction History</h2>
        {loading ? (
          <div className="ttv-loading">
            <div className="ttv-spinner"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="ttv-empty-state">
            <p className="ttv-empty-title">No transactions yet</p>
          </div>
        ) : (
          <ul className="ttv-list">
            {transactions.map((tx) => (
              <li key={tx.id} className="ttv-list-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '500', color: '#F1F5F9', marginBottom: '4px' }}>
                      {tx.operation}
                    </div>
                    <div style={{ fontSize: '14px', color: '#94A3B8' }}>
                      {new Date(tx.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: tx.type === 'credit' ? '#10B981' : '#EF4444'
                      }}
                    >
                      {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                    </div>
                    <div style={{ fontSize: '14px', color: '#94A3B8' }}>
                      Balance: {tx.balanceAfter}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
