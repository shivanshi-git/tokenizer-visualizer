# Implementation Plan - Migrate to React, Docker, and Kubernetes

We will migrate the LLM Input Pipeline Visualizer from its vanilla JS, HTML, and CSS form into a modern React application powered by Vite. We will also containerize the build using Docker and write a Kubernetes deployment configuration.

## User Review Required

> [!IMPORTANT]
> - **Filing Strategy**: We will move the original vanilla files (`index.html`, `app.js`, `style.css`, `tokenizer.js`) to an `archive/` folder so they are preserved and referenceable, then set up the Vite React app in the root directory.
> - **React State Management**: We will use a central React context or state in `App.jsx` to manage shared parameters like:
>   - `text`: Current input text (defaults to preset or custom string).
>   - `mode`: Tokenizer mode (`bpe`, `word`, or `char`).
>   - `activeStep`: Currently active step in the pipeline (1 to 7).
>   - `attentionHead`: Currently active attention head (1, 2, or 3).
>   - `activeHoverIdx`: Token index currently hovered to synchronize highlights across all views.
>   - `activeEmbedIdx`: Token selected in the embedding inspection panel.
>   - `activePosIdx`: Token selected in the positional embedding formula panel.
> - **Styling**: We will reuse the comprehensive styling system in [style.css](file:///d:/tokenizer-visualizer/style.css) by integrating it as `src/index.css`. Some dynamic grid styles (like custom columns for the attention matrix) will be handled inline or through dynamic styling in React.

## Proposed Changes

### 1. Preparation & Scaffolding

#### [NEW] [archive/](file:///d:/tokenizer-visualizer/archive)
- Create an `archive/` folder and move original vanilla files inside.

#### [NEW] [package.json](file:///d:/tokenizer-visualizer/package.json)
- Create a configuration file listing React, React-DOM, Vite, and other necessary scripts.

#### [NEW] [vite.config.js](file:///d:/tokenizer-visualizer/vite.config.js)
- Configure the Vite dev server and React plugin.

#### [NEW] [index.html](file:///d:/tokenizer-visualizer/index.html)
- Main HTML entry point that loads `src/main.jsx`.

---

### 2. React Components & Refactoring

#### [NEW] [src/main.jsx](file:///d:/tokenizer-visualizer/src/main.jsx)
- React bootstrap file mounting the `<App />` component.

#### [NEW] [src/index.css](file:///d:/tokenizer-visualizer/src/index.css)
- Ported CSS styles from the original project.

#### [NEW] [src/tokenizer.js](file:///d:/tokenizer-visualizer/src/tokenizer.js)
- Port [tokenizer.js](file:///d:/tokenizer-visualizer/tokenizer.js) logic as an ES module, exporting `CharacterTokenizer`, `WordTokenizer`, and `BPETokenizer`.

#### [NEW] [src/App.jsx](file:///d:/tokenizer-visualizer/src/App.jsx)
- The core container housing global state (`text`, `mode`, `activeStep`, `attentionHead`, `activeHoverIdx`, `activeEmbedIdx`, `activePosIdx`).
- Dynamically performs tokenization using the selected tokenizer when `text` or `mode` changes.
- Contains the overall layout (Header, Stepper, Main grid split into ControlPanel and StageViewer).

#### [NEW] [src/components/Header.jsx](file:///d:/tokenizer-visualizer/src/components/Header.jsx)
- Renders the logo, title, and theme toggle buttons. Swaps the `data-theme` attribute on `document.documentElement` between `cream` and `cyber`.

#### [NEW] [src/components/Stepper.jsx](file:///d:/tokenizer-visualizer/src/components/Stepper.jsx)
- Renders the interactive 7-step stepper at the top of the screen.

#### [NEW] [src/components/ControlPanel.jsx](file:///d:/tokenizer-visualizer/src/components/ControlPanel.jsx)
- Textarea input, tokenizer mode selector buttons, presets selector, statistics (tokens count, char count, ratio), and BPE vocab list search panel.

#### [NEW] [src/components/stages/Step1CharStream.jsx](file:///d:/tokenizer-visualizer/src/components/stages/Step1CharStream.jsx)
- Step 1 stage view. Computes character cells. Hovering over a character maps to the containing token index to set `activeHoverIdx`.

#### [NEW] [src/components/stages/Step2Tokens.jsx](file:///d:/tokenizer-visualizer/src/components/stages/Step2Tokens.jsx)
- Step 2 stage view. Renders tokens color-coded dynamically. Synchronized hover events.

#### [NEW] [src/components/stages/Step3TokenIds.jsx](file:///d:/tokenizer-visualizer/src/components/stages/Step3TokenIds.jsx)
- Step 3 stage view. Renders vocabulary IDs matching current tokens.

#### [NEW] [src/components/stages/Step4Embeddings.jsx](file:///d:/tokenizer-visualizer/src/components/stages/Step4Embeddings.jsx)
- Step 4 stage view. Renders sidebar of tokens. Hover maps globally, clicking selects active embedding. Renders 64-dimensional float grid colored by value.

#### [NEW] [src/components/stages/Step5Positional.jsx](file:///d:/tokenizer-visualizer/src/components/stages/Step5Positional.jsx)
- Step 5 stage view. Renders token position selector and preview bars (semantic gradient + positional gradient = combined gradient representation).

#### [NEW] [src/components/stages/Step6Attention.jsx](file:///d:/tokenizer-visualizer/src/components/stages/Step6Attention.jsx)
- Step 6 stage view. Renders attention head buttons (1: Local, 2: Broadcast first, 3: Key-value associations).
- Computes attention scores using softmax.
- Renders NxN grid of attention cells. Hovering over a cell highlights the row/column, updates the tooltip text, and sets active hover index.

#### [NEW] [src/components/stages/Step7Transformer.jsx](file:///d:/tokenizer-visualizer/src/components/stages/Step7Transformer.jsx)
- Step 7 stage view. Renders the schematic flow of a transformer layer (Input, Self-Attention, Add & Norm, Feed Forward MLP, Add & Norm, Output) showing dynamic labels matching hovered tokens.

---

### 3. Containerization & Orchestration

#### [NEW] [Dockerfile](file:///d:/tokenizer-visualizer/Dockerfile)
- Multi-stage Docker build:
  - **Stage 1 (Build)**: Node image to install dependencies and run `npm run build`.
  - **Stage 2 (Production)**: Nginx alpine image to serve build files from `/usr/share/nginx/html`.
  - Custom Nginx configuration or simple static file hosting config.

#### [NEW] [deployment.yaml](file:///d:/tokenizer-visualizer/deployment.yaml)
- Kubernetes configuration containing:
  - **Deployment**: Configures the replica sets (2 replicas), pod templates, image specs, ports, and resource limits.
  - **Service**: Exposes the deployment as a ClusterIP or NodePort service within the cluster.

---

## Verification Plan

### Automated Verification
- Verify the project runs locally using `npm run dev`.
- Verify the build succeeds: `npm run build`.
- Verify Docker build succeeds locally: `docker build -t tokenizer-visualizer:latest .`.

### Manual Verification
1. Open the dev server in the browser and verify all interactive features are fully functional:
   - Stepper switching.
   - Text editing and instant token recalculation.
   - Global hovering (hovering over a token in Step 2 highlights it in Step 1, Step 3, Step 4, Step 5, and the attention matrix).
   - Theme toggle (Cream <-> Cyber).
   - Changing BPE merge search.
   - Changing attention heads.
2. Verify Docker:
   - Run the built docker image locally: `docker run -d -p 8080:80 tokenizer-visualizer:latest`
   - Access `http://localhost:8080` to verify site is hosted properly by Nginx.
3. Verify Kubernetes Configurations:
   - Review syntactic correctness of `deployment.yaml`.
   - Provide instructions for deploying to a local cluster (e.g. `kubectl apply -f deployment.yaml`).
