import React from 'react';

const STEPS = [
  { id: 'text', num: 1, label: 'Text Input' },
  { id: 'tokenization', num: 2, label: 'Tokenization' },
  { id: 'token-ids', num: 3, label: 'Token IDs' },
  { id: 'embeddings', num: 4, label: 'Embeddings' },
  { id: 'positional', num: 5, label: 'Positional' },
  { id: 'attention', num: 6, label: 'Attention' },
  { id: 'transformer', num: 7, label: 'Transformer' }
];

export default function Stepper({ activeStep, setActiveStep }) {
  return (
    <nav className="pipeline-stepper" aria-label="Pipeline stages">
      <div className="stepper-container">
        {STEPS.map((step, idx) => (
          <React.Fragment key={step.id}>
            <button
              className={`step-btn ${activeStep === step.id ? 'active' : ''}`}
              onClick={() => setActiveStep(step.id)}
            >
              <span className="step-num">{step.num}</span>
              <span className="step-label">{step.label}</span>
            </button>
            {idx < STEPS.length - 1 && <span className="step-arrow">→</span>}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}
