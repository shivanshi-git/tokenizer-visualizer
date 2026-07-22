import React from 'react';

const TOKEN_COLOR_COUNT = 8;

export default function Step2Tokens({ tokens, activeHoverIdx, setActiveHoverIdx }) {
  return (
    <div className="stage-content active" id="stage-tokenization">
      <div className="card stage-card">
        <div className="card-header">
          <h2>Step 2: Tokenization Breakdown</h2>
          <span className="stage-badge">Processing</span>
        </div>
        <p className="stage-description">
          Text is split into discrete chunks called <strong>tokens</strong>. The selected tokenizer breaks down the text stream. Hover over a token block to highlight its characters in the input text.
        </p>
        
        <div className="visualizer-output-container">
          <div className="visualizer-title">Token Output Stream</div>
          <div className="token-container">
            {tokens.map((token, idx) => {
              const colorClass = `token-${idx % TOKEN_COLOR_COUNT}`;
              const isHighlighted = activeHoverIdx === idx;
              
              let displayText = token.text;
              let isSpaceToken = false;

              if (token.isSpace) {
                displayText = '␣';
                isSpaceToken = true;
              } else {
                displayText = displayText.replace(/ /g, '␣').replace(/\n/g, '↵');
              }

              return (
                <div
                  key={idx}
                  className={`token-block ${colorClass} ${isSpaceToken ? 'space-token' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                  onMouseEnter={() => setActiveHoverIdx(idx)}
                  onMouseLeave={() => setActiveHoverIdx(null)}
                >
                  {displayText}
                </div>
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
