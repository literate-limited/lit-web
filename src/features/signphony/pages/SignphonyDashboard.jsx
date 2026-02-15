/**
 * Signphony Dashboard Page
 */

import React, { useState, useEffect } from 'react';
import { useSignphony } from '../hooks/useSignphony';

const SignphonyDashboard = () => {
  const { api } = useSignphony();
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsData, leaderboardData] = await Promise.all([
        api.getUserStats(),
        api.getLeaderboard()
      ]);

      setStats(statsData);
      setLeaderboard(leaderboardData.leaderboard || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signphony-dashboard">
      <h1>📊 Dashboard</h1>

      {loading && <p>Loading dashboard...</p>}

      {!loading && stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Signs Learned</h3>
              <p className="stat-value">{stats.signs_completed || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Average Score</h3>
              <p className="stat-value">{stats.average_score?.toFixed(1) || 0}%</p>
            </div>
            <div className="stat-card">
              <h3>Total Attempts</h3>
              <p className="stat-value">{stats.total_attempts || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Best Score</h3>
              <p className="stat-value">{stats.best_score?.toFixed(1) || 0}%</p>
            </div>
          </div>

          <div className="leaderboard">
            <h2>🏆 Leaderboard</h2>
            {leaderboard.map((entry, idx) => (
              <div key={idx} className="leaderboard-entry">
                <span className="rank">#{idx + 1}</span>
                <span className="user">{entry.user_id}</span>
                <span className="score">{entry.average_score?.toFixed(1)}%</span>
                <span className="signs">{entry.signs_completed} signs</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SignphonyDashboard;
