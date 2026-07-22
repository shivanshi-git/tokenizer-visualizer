import React from 'react';

export default function Header({ theme, toggleTheme }) {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo-area">
          <span className="logo-icon">⚡</span>
          <div>
            <h1>LLM Input Pipeline Visualizer</h1>
            <p className="subtitle">See how raw text transforms into numbers, vectors, and attention weights</p>
          </div>
        </div>
        <div className="header-actions">
          <button id="theme-toggle" className="btn btn-secondary" onClick={toggleTheme} title="Toggle theme">
            {theme === 'cyber' ? '🌙 Cyber' : '☀️ Cream'}
          </button>
        </div>
      </div>
    </header>
  );
}
