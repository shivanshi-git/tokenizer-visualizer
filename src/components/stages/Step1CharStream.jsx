import React from 'react';

export default function Step1CharStream({ text, tokens, activeHoverIdx, setActiveHoverIdx }) {
  const characters = Array.from(text);

  return (
    <div className="stage-content active" id="stage-text">
      <div className="card stage-card">
        <div className="card-header">
          <h2>Step 1: Raw Text Stream</h2>
          <span className="stage-badge">Input</span>
        </div>
        <p className="stage-description">
          Large Language Models process raw text streams. Each character, punctuation mark, and space is parsed. Below is a raw character-level breakdown showing memory offset mapping. Hover over any block to see its character index.
        </p>
        
        <div className="char-stream-grid">
          {characters.map((char, index) => {
            // Find token index containing this character index
            const tokenIdx = tokens.findIndex(t => index >= t.start && index < t.end);
            
            // Check if this cell is highlighted because of global hover
            const hoveredToken = activeHoverIdx !== null ? tokens[activeHoverIdx] : null;
            const isHighlighted = hoveredToken && index >= hoveredToken.start && index < hoveredToken.end;

            let charDisplay = char;
            let isSpace = false;
            
            if (char === ' ') {
              charDisplay = '␣';
              isSpace = true;
            } else if (char === '\n') {
              charDisplay = '↵';
              isSpace = true;
            }

            return (
              <div
                key={index}
                className={`char-cell ${isSpace ? 'space' : ''}`}
                style={isHighlighted ? { backgroundColor: 'var(--accent)', color: '#ffffff' } : {}}
                onMouseEnter={() => tokenIdx !== -1 && setActiveHoverIdx(tokenIdx)}
                onMouseLeave={() => setActiveHoverIdx(null)}
              >
                {charDisplay}
                <span className="char-index">{index}</span>
              </div>
            );
          })}
          {characters.length === 0 && (
            <div className="empty-msg">No characters to show. Enter some text in the control panel.</div>
          )}
        </div>
      </div>
    </div>
  );
}
