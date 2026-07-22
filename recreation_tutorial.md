# Step-by-Step Guide: Building the LLM Input Pipeline Visualizer

This tutorial guide walks you through rebuilding the LLM Input Pipeline Visualizer from scratch using **Vite + React**, **Docker**, and **Kubernetes**.

---

## Phase 1: Local React Scaffolding ⚛️

### Step 1.1: Initialize a React App using Vite
Open your terminal and run the following command to scaffold a new project named `tokenizer-visualizer`:
```bash
npm create vite@latest tokenizer-visualizer -- --template react
```

Navigate into your project folder and install the initial dependencies:
```bash
cd tokenizer-visualizer
npm install
```

### Step 1.2: Establish the Styling System
Port the styling stylesheet into `src/index.css`. This CSS defines standard layout flexboxes, cards, grid heatmaps, and CSS variables for the Cream and Cyber themes:
```css
/* src/index.css */
:root[data-theme="cream"] {
  --bg-primary: #fcfaf6;
  --text-primary: #2d2a26;
  --accent: #c15c2e;
  /* other design tokens... */
}
:root[data-theme="cyber"] {
  --bg-primary: #0a0b10;
  --text-primary: #e2e8f0;
  --accent: #6366f1;
  /* other design tokens... */
}
/* Port your styles here... */
```

---

## Phase 2: Tokenization & Math Utilities 🧮

### Step 2.1: Write Tokenizer Classes
Create `src/tokenizer.js` to implement character, word, and subword (BPE) tokenizers:
- **Character Tokenizer**: Loops through string characters, compiling their UTF-16 indices.
- **Word Tokenizer**: Uses Regex matching words, spaces, and punctuation.
- **BPE Tokenizer**: Performs subword segmentation using an ordered merge-rule set.

```javascript
// src/tokenizer.js
export class BPETokenizer {
  constructor() {
    this.vocab = {}; // base vocab + merges
    this.merges = [ ['t', 'h'], ['a', 'n'], ... ];
    // ...
  }
  tokenizeWord(word) { /* merge adjacent BPE characters... */ }
  tokenize(text) { /* segment words and apply BPE merges... */ }
}
```

### Step 2.2: Write Vector Math Helpers
Create `src/utils/vectors.js` to define mock embeddings and sinusoidal positions:
- **Embeddings**: A deterministic hashing method generating 64 float values between `-1.0` and `+1.0`.
- **Positional vectors**: Computes values using sine and cosine frequencies:

```javascript
// src/utils/vectors.js
export function getEmbeddingVector(tokenText, length = 64) {
  // Deterministic mapping using trig formulas
}
export function getPositionalVector(pos, length = 64) {
  // Sinusoidal position math: sin(pos / 10000^(2i/d))
}
```

---

## Phase 3: Creating Components & Global State 🔄

### Step 3.1: Construct App Layout and Context
Edit `src/App.jsx` to establish state variables. Lifting the state to the parent ensures that hover events inside one subcomponent instantly highlight corresponding items in other components.

```javascript
// src/App.jsx
import React, { useState, useMemo } from 'react';
// import subcomponents ...

export default function App() {
  const [text, setText] = useState('Type context here...');
  const [mode, setMode] = useState('bpe');
  const [activeStep, setActiveStep] = useState('text');
  const [activeHoverIdx, setActiveHoverIdx] = useState(null);

  // Re-run tokenizer only when input or tokenization mode changes
  const tokens = useMemo(() => {
    // Invoke active tokenizer...
  }, [text, mode]);

  return (
    <div className="app-wrapper">
      <Header />
      <Stepper />
      <main className="app-layout">
        <ControlPanel text={text} setText={setText} tokens={tokens} />
        {/* Render Step Viewers conditionally based on activeStep */}
      </main>
    </div>
  );
}
```

### Step 3.2: Code Key UI Components
1.  **Header**: Triggers theme updates (`cream` vs `cyber` theme attributes).
2.  **Stepper**: Updates `activeStep` (1 to 7) upon click.
3.  **ControlPanel**: Collects user input text, allows selecting preset strings, displays stats (Ratio = Chars/Tokens), and renders the vocabulary browser.

### Step 3.3: Implement the Pipeline Step Components
Under `src/components/stages/`, build step views:
- **Step 1 (CharStream)**: Splitting characters. Hovering calculates the active token index and updates state.
- **Step 2 (Tokens)**: Renders segmented tokens. Alternates color styles.
- **Step 3 (TokenIds)**: Outputs matching numbers from vocabulary.
- **Step 4 (Embeddings)**: Shows the 64-float grid representing semantic properties.
- **Step 5 (Positional)**: Shows addition values using linear-gradients.
- **Step 6 (Attention)**:
  - Generates logits based on the selected attention head.
  - Applies **Softmax** row-by-row:
    $$\text{Softmax}(x_i) = \frac{e^{x_i}}{\sum e^{x_j}}$$
  - Renders an $N \times N$ grid, load-balanced by weight opacity.
- **Step 7 (Transformer)**: Represents flow block diagrams.

---

## Phase 4: Containerizing with Docker 🐳

To ship the app as an isolated container, we compile it and host it using **Nginx**.

### Step 4.1: Write the Dockerfile
Create `Dockerfile` in the root:
```dockerfile
# 1. Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. Server stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Step 4.2: Build and Test Docker Container
```bash
# Build the container image
docker build -t tokenizer-visualizer:latest .

# Run the container
docker run -d -p 8080:80 --name local-tokenizer-app tokenizer-visualizer:latest
```
Access `http://localhost:8080`.

---

## Phase 5: Orchestrating with Kubernetes ☸️

### Step 5.1: Write the Manifests
Create `deployment.yaml` to specify workloads:
- **Deployment**: Configures pods, copies, pull rules, resource limits, and selector labels.
- **Service (NodePort)**: Directs network requests to pods.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tokenizer-visualizer
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tokenizer-visualizer
  template:
    metadata:
      labels:
        app: tokenizer-visualizer
    spec:
      containers:
      - name: tokenizer-visualizer
        image: tokenizer-visualizer:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: tokenizer-visualizer-service
spec:
  selector:
    app: tokenizer-visualizer
  ports:
    - port: 80
      targetPort: 80
      nodePort: 30080
  type: NodePort
```

### Step 5.2: Launch on Kubernetes
Apply configuration rules on your cluster:
```bash
kubectl apply -f deployment.yaml
```

View active resources:
```bash
kubectl get deployments
kubectl get pods
kubectl get services
```

Forward ports to view the app:
```bash
kubectl port-forward svc/tokenizer-visualizer-service 8080:80
```
Open `http://localhost:8080` in your web browser!
