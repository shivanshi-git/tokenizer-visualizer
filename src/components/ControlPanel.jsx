import React, { useState, useMemo } from 'react';
import { bpeTokenizer } from '../App';

const PRESETS = {
  ml: "Deep learning models process inputs in parallel layers. Self-attention weights decide token relationships.",
  pangram: "The quick brown fox jumps over the lazy dog.",
  emojis: "Hello World! 👋 Learning AI is fun 🚀 Let's code 💻",
  code: "def greet(user):\n    print(f\"Hello, {user}!\")\n\ngreet(\"LLM\")"
};

export default function ControlPanel({ text, setText, mode, setMode, tokens }) {
  const [vocabSearch, setVocabSearch] = useState('');

  const charCount = text.length;
  const tokenCount = tokens.length;
  const ratio = tokenCount > 0 ? (charCount / tokenCount).toFixed(1) : '0.0';

  // Build sorted list of BPE vocabulary
  const vocabItems = useMemo(() => {
    const list = [];
    if (!bpeTokenizer) return list;
    
    for (let char in bpeTokenizer.vocab) {
      const id = bpeTokenizer.vocab[char];
      let keyRep = char;
      if (char === ' ') keyRep = '[space]';
      if (char === '\n') keyRep = '[newline]';
      
      list.push({
        key: keyRep,
        id: id,
        isMerge: id >= 256
      });
    }
    list.sort((a, b) => a.id - b.id);
    return list;
  }, []);

  // Filter vocabulary list based on search term
  const filteredVocab = useMemo(() => {
    const search = vocabSearch.toLowerCase();
    if (!search) return vocabItems.slice(0, 100);
    
    const matches = vocabItems.filter(item => 
      item.key.toLowerCase().includes(search) || 
      item.id.toString().includes(search)
    );
    return matches.slice(0, 100);
  }, [vocabSearch, vocabItems]);

  return (
    <section className="control-panel">
      <div className="card panel-card">
        <div className="card-header">
          <h2>Input Control</h2>
          <span className="badge" id="char-counter">{charCount} chars</span>
        </div>
        
        <div className="textarea-container">
          <textarea
            id="text-input"
            placeholder="Type or paste your text here..."
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="tokenizer-selector-group">
          <span className="label">Tokenizer Model:</span>
          <div className="segmented-control">
            <button 
              className={`segment-btn ${mode === 'word' ? 'active' : ''}`}
              onClick={() => setMode('word')}
            >
              Word-level
            </button>
            <button 
              className={`segment-btn ${mode === 'char' ? 'active' : ''}`}
              onClick={() => setMode('char')}
            >
              Character
            </button>
            <button 
              className={`segment-btn ${mode === 'bpe' ? 'active' : ''}`}
              onClick={() => setMode('bpe')}
            >
              Subword (BPE)
            </button>
          </div>
        </div>

        <div className="presets-section">
          <span className="label">Presets:</span>
          <div className="presets-grid">
            <button className="btn btn-preset" onClick={() => setText(PRESETS.ml)}>ML Example</button>
            <button className="btn btn-preset" onClick={() => setText(PRESETS.pangram)}>Pangram</button>
            <button className="btn btn-preset" onClick={() => setText(PRESETS.emojis)}>With Emojis</button>
            <button className="btn btn-preset" onClick={() => setText(PRESETS.code)}>Code</button>
          </div>
        </div>

        <hr className="divider" />

        <div className="quick-stats">
          <div className="stat-box">
            <span className="stat-val">{tokenCount}</span>
            <span className="stat-lbl">Tokens</span>
          </div>
          <div className="stat-box">
            <span className="stat-val">{charCount}</span>
            <span className="stat-lbl">Characters</span>
          </div>
          <div className="stat-box">
            <span className="stat-val">{ratio}</span>
            <span className="stat-lbl">Chars / Token</span>
          </div>
        </div>
      </div>
      
      {mode === 'bpe' && (
        <div className="card bpe-vocab-card" id="bpe-vocab-panel" style={{ display: 'flex' }}>
          <div className="card-header">
            <h3>BPE Vocabulary & Merges</h3>
            <span className="badge">{filteredVocab.length} rules</span>
          </div>
          <div className="search-box-container">
            <input 
              type="text" 
              placeholder="Search subword / merge rules..."
              value={vocabSearch}
              onChange={(e) => setVocabSearch(e.target.value)}
            />
          </div>
          <div className="vocab-list">
            {filteredVocab.map((item, idx) => (
              <div className="vocab-item" key={`${item.id}-${idx}`}>
                <span className="vocab-key">
                  {item.isMerge ? `⚙️ ${item.key}` : item.key}
                </span>
                <span className="vocab-val">{item.id}</span>
              </div>
            ))}
            {filteredVocab.length === 0 && (
              <div className="empty-msg">No vocab matches found.</div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
