import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Stepper from './components/Stepper';
import ControlPanel from './components/ControlPanel';

// Stages
import Step1CharStream from './components/stages/Step1CharStream';
import Step2Tokens from './components/stages/Step2Tokens';
import Step3TokenIds from './components/stages/Step3TokenIds';
import Step4Embeddings from './components/stages/Step4Embeddings';
import Step5Positional from './components/stages/Step5Positional';
import Step6Attention from './components/stages/Step6Attention';
import Step7Transformer from './components/stages/Step7Transformer';

// Tokenizers
import { CharacterTokenizer, WordTokenizer, BPETokenizer } from './tokenizer';

// Singletons initialized once
export const charTokenizer = new CharacterTokenizer();
export const wordTokenizer = new WordTokenizer();
export const bpeTokenizer = new BPETokenizer();

export default function App() {
  // Global App States
  const [text, setText] = useState('Is Chinese more efficient than English in an LLM?');
  const [mode, setMode] = useState('bpe'); // 'bpe', 'word', 'char'
  const [activeStep, setActiveStep] = useState('text'); // 'text', 'tokenization', etc.
  const [attentionHead, setAttentionHead] = useState(1); // 1, 2, 3
  
  // Interactive Hover and Selection Indices
  const [activeHoverIdx, setActiveHoverIdx] = useState(null);
  const [activeEmbedIdx, setActiveEmbedIdx] = useState(0);
  const [activePosIdx, setActivePosIdx] = useState(0);

  // Theme state initialized from HTML data-theme (default to cream)
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'cream';
  });

  // Sync theme changes to Document Element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Compute tokens dynamically
  const tokens = useMemo(() => {
    let tokenizer;
    if (mode === 'word') {
      tokenizer = wordTokenizer;
    } else if (mode === 'char') {
      tokenizer = charTokenizer;
    } else {
      tokenizer = bpeTokenizer;
    }
    return tokenizer.tokenize(text);
  }, [text, mode]);

  // Handle active index out-of-bounds safety checks
  useEffect(() => {
    if (tokens.length === 0) {
      setActiveEmbedIdx(0);
      setActivePosIdx(0);
      return;
    }
    if (activeEmbedIdx >= tokens.length) {
      setActiveEmbedIdx(0);
    }
    if (activePosIdx >= tokens.length) {
      setActivePosIdx(0);
    }
  }, [tokens, activeEmbedIdx, activePosIdx]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'cyber' ? 'cream' : 'cyber'));
  };

  return (
    <div className="app-wrapper">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <Stepper activeStep={activeStep} setActiveStep={setActiveStep} />
      
      <main className="app-layout">
        <ControlPanel
          text={text}
          setText={setText}
          mode={mode}
          setMode={setMode}
          tokens={tokens}
        />
        
        <section className="stage-viewer">
          {activeStep === 'text' && (
            <Step1CharStream
              text={text}
              tokens={tokens}
              activeHoverIdx={activeHoverIdx}
              setActiveHoverIdx={setActiveHoverIdx}
            />
          )}
          {activeStep === 'tokenization' && (
            <Step2Tokens
              tokens={tokens}
              activeHoverIdx={activeHoverIdx}
              setActiveHoverIdx={setActiveHoverIdx}
            />
          )}
          {activeStep === 'token-ids' && (
            <Step3TokenIds
              tokens={tokens}
              activeHoverIdx={activeHoverIdx}
              setActiveHoverIdx={setActiveHoverIdx}
            />
          )}
          {activeStep === 'embeddings' && (
            <Step4Embeddings
              tokens={tokens}
              theme={theme}
              activeHoverIdx={activeHoverIdx}
              setActiveHoverIdx={setActiveHoverIdx}
              activeEmbedIdx={activeEmbedIdx}
              setActiveEmbedIdx={setActiveEmbedIdx}
            />
          )}
          {activeStep === 'positional' && (
            <Step5Positional
              tokens={tokens}
              theme={theme}
              activeHoverIdx={activeHoverIdx}
              setActiveHoverIdx={setActiveHoverIdx}
              activePosIdx={activePosIdx}
              setActivePosIdx={setActivePosIdx}
            />
          )}
          {activeStep === 'attention' && (
            <Step6Attention
              tokens={tokens}
              theme={theme}
              activeHoverIdx={activeHoverIdx}
              setActiveHoverIdx={setActiveHoverIdx}
              attentionHead={attentionHead}
              setAttentionHead={setAttentionHead}
            />
          )}
          {activeStep === 'transformer' && (
            <Step7Transformer
              tokens={tokens}
              activeHoverIdx={activeHoverIdx}
            />
          )}
        </section>
      </main>
      
      <footer className="app-footer">
        <div className="footer-container">
          <p>Made with ⚡ for advanced LLM education. Interactive companion to tokenization and transformer input workflows.</p>
        </div>
      </footer>
    </div>
  );
}
