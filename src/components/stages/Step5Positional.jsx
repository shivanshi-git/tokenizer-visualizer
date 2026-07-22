import React, { useMemo } from 'react';
import { getEmbeddingVector, getPositionalVector } from '../../utils/vectors';

export default function Step5Positional({
  tokens,
  theme,
  activeHoverIdx,
  setActiveHoverIdx,
  activePosIdx,
  setActivePosIdx
}) {
  const selectedToken = tokens[activePosIdx] || tokens[0];

  // Helper to build gradient string based on vector values
  const gradientString = useMemo(() => {
    if (!selectedToken) return { semantic: '', positional: '', combined: '' };

    const semanticVec = getEmbeddingVector(selectedToken.text, 64);
    const positionalVec = getPositionalVector(activePosIdx, 64);
    const combinedVec = semanticVec.map((v, i) => v + positionalVec[i]);

    const buildGradient = (vector) => {
      const stops = [];
      const step = Math.floor(vector.length / 6); // Sample 6 points
      for (let i = 0; i < vector.length; i += step) {
        const val = vector[Math.min(i, vector.length - 1)];
        const normalized = Math.max(-1, Math.min(1, val));
        const pct = Math.round((normalized + 1) * 50);

        let color;
        if (theme === 'cyber') {
          color = `hsl(${280 - (pct * 1.8)}, 85%, 50%)`;
        } else {
          color = `hsl(${220 - (pct * 2.2)}, 75%, 50%)`;
        }
        stops.push(color);
      }
      return `linear-gradient(to right, ${stops.join(', ')})`;
    };

    return {
      semantic: buildGradient(semanticVec),
      positional: buildGradient(positionalVec),
      combined: buildGradient(combinedVec)
    };
  }, [selectedToken, activePosIdx, theme]);

  return (
    <div className="stage-content active" id="stage-positional">
      <div className="card stage-card">
        <div className="card-header">
          <h2>Step 5: Positional Embeddings</h2>
          <span className="stage-badge">Contextualization</span>
        </div>
        <p className="stage-description">
          Since Transformers process all tokens simultaneously (in parallel), they have no native sense of sequence order. To fix this, a **Positional Embedding** (using sine/cosine frequencies or learned indexes) is added element-wise to each token's semantic embedding.
        </p>

        <div className="positional-formula-container">
          <div className="vector-sum-formula">
            <div className="formula-term">
              <span className="term-title">Token Embedding</span>
              <div 
                className="vector-preview-bar semantic-color" 
                style={{ background: gradientString.semantic }}
              />
              <span className="term-desc">Semantic context</span>
            </div>
            
            <span className="formula-operator">+</span>
            
            <div className="formula-term">
              <span className="term-title">Positional Embedding</span>
              <div 
                className="vector-preview-bar positional-color" 
                style={{ background: gradientString.positional }}
              />
              <span className="term-desc">Sequence position</span>
            </div>
            
            <span className="formula-operator">=</span>
            
            <div className="formula-term">
              <span className="term-title">Transformer Input</span>
              <div 
                className="vector-preview-bar combined-color" 
                style={{ background: gradientString.combined }}
              />
              <span className="term-desc">Complete representation</span>
            </div>
          </div>

          <div className="positional-token-selector-row">
            {tokens.map((token, idx) => {
              const isSelected = idx === activePosIdx;
              const isGlobalHovered = idx === activeHoverIdx;
              const cleanText = token.text.replace(/ /g, '␣');

              return (
                <button
                  key={idx}
                  className={`pos-token-btn ${isSelected || isGlobalHovered ? 'active' : ''}`}
                  onClick={() => setActivePosIdx(idx)}
                  onMouseEnter={() => setActiveHoverIdx(idx)}
                  onMouseLeave={() => setActiveHoverIdx(null)}
                >
                  {cleanText} ({idx})
                </button>
              );
            })}
            {tokens.length === 0 && (
              <div className="empty-msg">No tokens to show.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
