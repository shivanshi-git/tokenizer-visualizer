import React from 'react';

export default function Step7Transformer({ tokens, activeHoverIdx }) {
  const activeToken = activeHoverIdx !== null && tokens[activeHoverIdx] ? tokens[activeHoverIdx] : null;
  
  const inputDescription = activeToken
    ? `Processing token: "${activeToken.text}" at sequence position #${activeHoverIdx}`
    : 'Tokens with positional context';

  return (
    <div className="stage-content active" id="stage-transformer">
      <div className="card stage-card">
        <div className="card-header">
          <h2>Step 7: Transformer Blocks & Feed-Forward Pipeline</h2>
          <span className="stage-badge">Computation</span>
        </div>
        <p className="stage-description">
          With embeddings and attention scores combined, the vectors flow through stackable **Transformer Blocks**. Below is the representation of one standard layer. Hover over the layers to see how the representation updates.
        </p>

        <div className="transformer-flow-diagram">
          <div className="flow-step" data-block="input">
            <div className="flow-box accent-box">
              <span className="flow-box-title">Input Vectors (X)</span>
              <span className="flow-box-desc">{inputDescription}</span>
            </div>
          </div>
          
          <div className="flow-connector">↓</div>

          <div className="flow-step" data-block="mha">
            <div className="flow-box">
              <span className="flow-box-title">Multi-Head Self Attention</span>
              <span className="flow-box-desc">Aggregate context from other tokens</span>
            </div>
          </div>

          <div className="flow-connector">↓</div>

          <div className="flow-step" data-block="add-norm-1">
            <div className="flow-box secondary-box">
              <span className="flow-box-title">Add & LayerNorm (Residual)</span>
              <span className="flow-box-desc">Stabilize training & bypass original inputs</span>
            </div>
          </div>

          <div className="flow-connector">↓</div>

          <div className="flow-step" data-block="ffn">
            <div className="flow-box">
              <span className="flow-box-title">Feed-Forward MLP Network</span>
              <span className="flow-box-desc">Compute complex token-specific features</span>
            </div>
          </div>

          <div className="flow-connector">↓</div>

          <div className="flow-step" data-block="add-norm-2">
            <div className="flow-box secondary-box">
              <span className="flow-box-title">Add & LayerNorm (Residual)</span>
              <span className="flow-box-desc">Produce final layer output vector representation</span>
            </div>
          </div>

          <div className="flow-connector">↓</div>

          <div className="flow-step" data-block="output">
            <div className="flow-box success-box">
              <span className="flow-box-title">Output Vector (Y)</span>
              <span className="flow-box-desc">Ready for next block or prediction layer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
