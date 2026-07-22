import React, { useMemo } from 'react';
import { getEmbeddingVector } from '../../utils/vectors';

export default function Step4Embeddings({
  tokens,
  theme,
  activeHoverIdx,
  setActiveHoverIdx,
  activeEmbedIdx,
  setActiveEmbedIdx
}) {
  // Get currently selected token
  const selectedToken = tokens[activeEmbedIdx] || tokens[0];

  // Calculate embedding vector for selected token
  const vector = useMemo(() => {
    if (!selectedToken) return [];
    return getEmbeddingVector(selectedToken.text, 64);
  }, [selectedToken]);

  const tokenDisplayName = selectedToken
    ? selectedToken.text.replace(/ /g, '[space]').replace(/\n/g, '[newline]')
    : '-';
  const tokenIdDisplay = selectedToken ? selectedToken.id : '-';

  return (
    <div className="stage-content active" id="stage-embeddings">
      <div className="card stage-card">
        <div className="card-header">
          <h2>Step 4: High-Dimensional Semantic Embeddings</h2>
          <span className="stage-badge">Representation</span>
        </div>
        <p className="stage-description">
          Each Token ID retrieves a high-dimensional vector from a pre-trained lookup matrix. This vector represents the <strong>semantic meaning</strong> of the token. Hover over any token below to view its embedding matrix representation (simulated 64-dimensional slice).
        </p>

        <div className="embedding-browser">
          <div className="embedding-tokens-sidebar" id="embed-tokens-list">
            {tokens.map((token, idx) => {
              const isSelected = idx === activeEmbedIdx;
              const isHovered = idx === activeHoverIdx;
              const displayLabel = token.text.replace(/ /g, '␣').replace(/\n/g, '↵');

              return (
                <div
                  key={idx}
                  className={`embed-sidebar-item ${isSelected ? 'active' : ''} ${isHovered ? 'highlighted' : ''}`}
                  onClick={() => setActiveEmbedIdx(idx)}
                  onMouseEnter={() => setActiveHoverIdx(idx)}
                  onMouseLeave={() => setActiveHoverIdx(null)}
                >
                  <span>{displayLabel}</span>
                  <span className="item-id">{token.id}</span>
                </div>
              );
            })}
            {tokens.length === 0 && (
              <div className="empty-msg">No tokens to show.</div>
            )}
          </div>

          <div className="embedding-visual-area">
            <div className="embedding-header">
              <span className="active-embed-label">
                Token: <strong>{tokenDisplayName}</strong>
              </span>
              <span className="active-embed-id">
                ID: <code>{tokenIdDisplay}</code>
              </span>
            </div>
            
            <div className="vector-grid-container">
              <div className="vector-grid" id="embed-vector-grid">
                {vector.map((val, idx) => {
                  const pct = Math.round((val + 1) * 50); // [-1, 1] to [0, 100]%
                  let color;
                  
                  if (theme === 'cyber') {
                    // Cyber Mode: Neon Pink/Indigo to Cyan
                    color = `hsl(${280 - (pct * 1.8)}, 85%, ${20 + (pct * 0.45)}%)`;
                  } else {
                    // Cream Mode: Blue to Red
                    color = `hsl(${220 - (pct * 2.2)}, 75%, ${90 - Math.abs(pct - 50) * 0.8}%)`;
                  }

                  const textColor = Math.abs(val) > 0.4 ? '#ffffff' : 'var(--text-primary)';

                  return (
                    <div
                      key={idx}
                      className="vector-cell"
                      style={{ backgroundColor: color, color: textColor }}
                      title={`Index ${idx}: ${val.toFixed(4)}`}
                    >
                      {val.toFixed(1)}
                    </div>
                  );
                })}
                {vector.length === 0 && (
                  <div className="empty-msg" style={{ gridColumn: 'span 8' }}>
                    Select a token to display its vector dimensions.
                  </div>
                )}
              </div>
              <div className="vector-scale">
                <span>Negative (-1.0)</span>
                <div className="gradient-bar"></div>
                <span>Positive (+1.0)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
