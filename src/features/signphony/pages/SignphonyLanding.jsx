/**
 * Signphony Landing Page
 * Main brand page for the sign language learning platform
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useSignphony } from '../hooks/useSignphony';
import '../styles/signphony.css';

const SignphonyLanding = () => {
  const { status, loading } = useSignphony();

  return (
    <div className="signphony-landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            🤟 Signphony
          </h1>
          <p className="hero-subtitle">
            The unified sign language platform
          </p>
          <p className="hero-description">
            Learn Auslan, translate text to sign language, train hand dexterity with magic tricks,
            and explore the beautiful symphony of motion
          </p>

          {status && (
            <div className="status-badge">
              <span className="status-indicator online"></span>
              System Online • {Object.keys(status.components || {}).filter(k => status.components[k]).length} Features Active
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="features">
        <div className="features-grid">
          {/* Sign Learning Game */}
          <Link to="/signphony/learn" className="feature-card">
            <div className="feature-icon">🎮</div>
            <h3>Learn Auslan</h3>
            <p>Interactive game with 800+ signs. Real-time feedback using AI pose detection.</p>
            <div className="feature-stats">
              <span>800+ Signs</span>
              <span>Multiple Categories</span>
            </div>
          </Link>

          {/* Translator */}
          <Link to="/signphony/translator" className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>Translator</h3>
            <p>Convert English text to Auslan sign sequences with grammar rules.</p>
            <div className="feature-stats">
              <span>Real-time Translation</span>
              <span>Batch Processing</span>
            </div>
          </Link>

          {/* Magic Tricks */}
          <Link to="/signphony/magic" className="feature-card">
            <div className="feature-icon">✨</div>
            <h3>Magic Tricks</h3>
            <p>Train hand dexterity with magic trick tutorials. Coin vanish, card force, and more.</p>
            <div className="feature-stats">
              <span>128+ Tricks</span>
              <span>Step-by-Step Scoring</span>
            </div>
          </Link>

          {/* Dashboard */}
          <Link to="/signphony/dashboard" className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Dashboard</h3>
            <p>Track your progress, view achievements, and compete on leaderboards.</p>
            <div className="feature-stats">
              <span>Progress Tracking</span>
              <span>Achievements</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Technology Section */}
      <section className="technology">
        <h2>Powered by Advanced Technology</h2>
        <div className="tech-grid">
          <div className="tech-item">
            <div className="tech-icon">🧠</div>
            <h4>AI Pose Detection</h4>
            <p>MediaPipe + PyTorch for real-time hand and body tracking</p>
          </div>
          <div className="tech-item">
            <div className="tech-icon">🎯</div>
            <h4>Hybrid Scoring</h4>
            <p>ML + DTW (Dynamic Time Warping) for accurate sign recognition</p>
          </div>
          <div className="tech-item">
            <div className="tech-icon">🔊</div>
            <h4>Speech Synthesis</h4>
            <p>Quantum CFD vocal tract simulation for natural speech</p>
          </div>
          <div className="tech-item">
            <div className="tech-icon">⚡</div>
            <h4>Real-time Feedback</h4>
            <p>WebSocket for instant scoring and progress updates</p>
          </div>
        </div>
      </section>

      {/* System Status */}
      {status && (
        <section className="system-status">
          <h3>System Status</h3>
          <div className="status-grid">
            <div className={`status-item ${status.components?.real_pose ? 'active' : 'inactive'}`}>
              <span className="status-label">Pose Detection</span>
              <span className="status-value">{status.components?.real_pose ? 'Real (MediaPipe)' : 'Simulated'}</span>
            </div>
            <div className={`status-item ${status.components?.ml_inference ? 'active' : 'inactive'}`}>
              <span className="status-label">ML Inference</span>
              <span className="status-value">{status.components?.ml_inference ? 'Active' : 'Inactive'}</span>
            </div>
            <div className={`status-item ${status.components?.speech ? 'active' : 'inactive'}`}>
              <span className="status-label">Speech Synthesis</span>
              <span className="status-value">{status.components?.speech ? 'Active' : 'Inactive'}</span>
            </div>
            <div className={`status-item ${status.components?.translator ? 'active' : 'inactive'}`}>
              <span className="status-label">Translator</span>
              <span className="status-value">{status.components?.translator ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="cta">
        <h2>Ready to Start Learning?</h2>
        <p>Join the sign language learning revolution</p>
        <div className="cta-buttons">
          <Link to="/signphony/learn" className="btn btn-primary">
            Start Learning
          </Link>
          <Link to="/signphony/dashboard" className="btn btn-secondary">
            View Dashboard
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="signphony-footer">
        <p>
          <strong>Signphony</strong> = Sign + Symphony
          <br />
          Because sign language is a beautiful symphony of motion 🎵
        </p>
      </footer>
    </div>
  );
};

export default SignphonyLanding;
