import React, { useState, useMemo } from 'react';

export default function Step6Attention({
  tokens,
  theme,
  activeHoverIdx,
  setActiveHoverIdx,
  attentionHead,
  setAttentionHead
}) {
  const [hoveredCell, setHoveredCell] = useState(null); // { row, col }

  const N = tokens.length;

  // Compute NxN attention matrix weights
  const attentionWeights = useMemo(() => {
    const matrix = [];
    if (N === 0) return matrix;

    for (let i = 0; i < N; i++) {
      const rowLogits = [];
      for (let j = 0; j < N; j++) {
        let score = 0;

        if (attentionHead === 1) {
          // Head 1: Local attention (band diagonal)
          score = -Math.abs(i - j) * 1.8;
        } else if (attentionHead === 2) {
          // Head 2: Broadcast first token
          score = j === 0 ? 3.0 : (i === j ? 1.0 : -2.0);
        } else {
          // Head 3: Key-Value letters association
          const tI = tokens[i].text.toLowerCase();
          const tJ = tokens[j].text.toLowerCase();

          if (tI[0] === tJ[0]) {
            score += 2.0;
          }
          if (tI.length === tJ.length) {
            score += 1.0;
          }
          if (i === j) {
            score += 1.5; // Self-attention bias
          }
          score -= Math.abs(i - j) * 0.3; // Distance penalty
        }
        rowLogits.push(score);
      }

      // Compute Softmax
      const maxLogit = Math.max(...rowLogits);
      const exps = rowLogits.map(l => Math.exp(l - maxLogit));
      const sumExps = exps.reduce((a, b) => a + b, 0);
      const weights = exps.map(e => (sumExps > 0 ? e / sumExps : 0));
      matrix.push(weights);
    }
    return matrix;
  }, [tokens, attentionHead, N]);

  // Create formatted labels for display
  const labels = useMemo(() => {
    return tokens.map(token => token.text.replace(/ /g, '␣').replace(/\n/g, '↵'));
  }, [tokens]);

  return (
    <div className="stage-content active" id="stage-attention">
      <div className="card stage-card">
        <div className="card-header">
          <h2>Step 6: Self-Attention Weight Visualization</h2>
          <span className="stage-badge">Relationships</span>
        </div>
        <p className="stage-description">
          Self-Attention allows tokens to "look" at other tokens in the sequence to build context. The matrix below shows how much attention each token (row) pays to other tokens (column). Change heads to see different focus patterns!
        </p>

        <div className="attention-controls">
          <div className="control-label-group">
            <span>Select Attention Head:</span>
            <div className="segmented-control mini-control">
              <button
                className={`segment-btn mini ${attentionHead === 1 ? 'active' : ''}`}
                onClick={() => setAttentionHead(1)}
              >
                Head 1: Local Context
              </button>
              <button
                className={`segment-btn mini ${attentionHead === 2 ? 'active' : ''}`}
                onClick={() => setAttentionHead(2)}
              >
                Head 2: Broadcast First
              </button>
              <button
                className={`segment-btn mini ${attentionHead === 3 ? 'active' : ''}`}
                onClick={() => setAttentionHead(3)}
              >
                Head 3: Key-Value Associations
              </button>
            </div>
          </div>
        </div>

        <div className="matrix-wrapper">
          {N > 0 ? (
            <div className="attention-matrix-container">
              {/* Row labels (Y-axis) */}
              <div className="matrix-y-axis" id="matrix-y-labels">
                {labels.map((lbl, idx) => (
                  <div key={idx} className="matrix-y-label">
                    {lbl}
                  </div>
                ))}
              </div>

              <div className="matrix-main-section">
                {/* Column labels (X-axis) */}
                <div className="matrix-x-axis" id="matrix-x-labels">
                  {labels.map((lbl, idx) => (
                    <div key={idx} className="matrix-x-label">
                      {lbl}
                    </div>
                  ))}
                </div>

                {/* Matrix Grid */}
                <div className="matrix-grid-viewport">
                  <div
                    className="matrix-grid"
                    style={{
                      gridTemplateColumns: `repeat(${N}, 32px)`,
                      gridTemplateRows: `repeat(${N}, 32px)`
                    }}
                  >
                    {attentionWeights.map((row, i) =>
                      row.map((weight, j) => {
                        const isRowHighlighted = hoveredCell && hoveredCell.row === i;
                        const isColHighlighted = hoveredCell && hoveredCell.col === j;
                        
                        let cellBg;
                        if (theme === 'cyber') {
                          cellBg = `rgba(99, 102, 241, ${weight})`;
                        } else {
                          cellBg = `rgba(193, 92, 46, ${weight})`;
                        }

                        return (
                          <div
                            key={`${i}-${j}`}
                            className={`matrix-cell 
                              ${isRowHighlighted ? 'highlighted-row' : ''} 
                              ${isColHighlighted ? 'highlighted-col' : ''}
                            `}
                            style={{ backgroundColor: cellBg }}
                            onMouseEnter={() => {
                              setHoveredCell({ row: i, col: j });
                              setActiveHoverIdx(i);
                            }}
                            onMouseLeave={() => {
                              setHoveredCell(null);
                              setActiveHoverIdx(null);
                            }}
                            title={`Row: ${labels[i]}, Col: ${labels[j]}, Weight: ${(weight * 100).toFixed(1)}%`}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-msg">No tokens. Enter text to visualize attention.</div>
          )}

          <div className="attention-details-overlay" id="attention-tooltip">
            {hoveredCell ? (
              <>
                Token <strong>"{labels[hoveredCell.row]}"</strong> attends to{' '}
                <strong>"{labels[hoveredCell.col]}"</strong> with weight{' '}
                <code className="accent-text">
                  {(attentionWeights[hoveredCell.row][hoveredCell.col] * 100).toFixed(1)}%
                </code>
              </>
            ) : (
              'Hover over a cell to see how tokens attend to each other.'
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
