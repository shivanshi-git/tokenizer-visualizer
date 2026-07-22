import React from 'react';

export default function Step3TokenIds({ tokens, activeHoverIdx, setActiveHoverIdx }) {
  return (
    <div className="stage-content active" id="stage-token-ids">
      <div className="card stage-card">
        <div className="card-header">
          <h2>Step 3: Vocabulary Mapping (Token IDs)</h2>
          <span className="stage-badge">Translation</span>
        </div>
        <p className="stage-description">
          Neural networks do not read text directly. Each token is translated into its matching integer <strong>Token ID</strong> index from the model's vocabulary list.
        </p>

        <div className="id-stream-grid">
          {tokens.map((token, idx) => {
            const isHighlighted = activeHoverIdx === idx;
            const displayName = token.text.trim() === '' ? (token.isSpace ? 'space' : 'newline') : token.text;
            
            return (
              <div
                key={idx}
                className={`id-card ${isHighlighted ? 'highlighted' : ''}`}
                onMouseEnter={() => setActiveHoverIdx(idx)}
                onMouseLeave={() => setActiveHoverIdx(null)}
              >
                <span className="id-token">{displayName}</span>
                <span className="id-number">{token.id}</span>
                <span className="id-idx">#{idx}</span>
              </div>
            );
          })}
          {tokens.length === 0 && (
            <div className="empty-msg">No token IDs to show.</div>
          )}
        </div>
      </div>
    </div>
  );
}
