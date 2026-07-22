# Comprehensive LLM Input Pipeline Visualizer Implementation Plan

We will build a high-fidelity, interactive, and visually stunning web application that visualizes the step-by-step journey of text through an LLM's input pipeline:
`Text` → `Tokenization` → `Token IDs` → `Embeddings` → `Positional Embeddings` → `Attention Visualization` → `Transformer Layers`.

## Key Features

1. **Pipeline Steps Navigator**: A gorgeous, animated vertical or horizontal stepper showing the active pipeline step.
2. **Step 1: Text Input**: Textarea for custom input with pre-configured presets (ML Example, Pangram, With Emojis, Code).
3. **Step 2: Tokenization**: A visual breakdown of text into color-coded tokens (Word-level, Character-level, BPE-style).
4. **Step 3: Token IDs**: A mapping of tokens to their numeric vocabulary indices, styled like key-value blocks.
5. **Step 4: Embeddings**: A visualization of high-dimensional semantic vectors. Hovering over a token reveals a heatmap grid representing its embedding vector (simulated size, e.g., 8x8 or 16x16 grid of floating-point values with dynamic color scaling).
6. **Step 5: Positional Embeddings**: Shows how a unique position vector is generated (using sine/cosine waves or learned embeddings) and added element-wise to the semantic embedding.
7. **Step 6: Attention Matrix**: An interactive, dynamic 2D grid of size $N \times N$ (where $N$ is the token count). Hovering over a cell shows the attention score between Token A and Token B. Users can toggle between multiple "heads" to see different attention patterns (e.g., local, broadcast, self-attending).
8. **Step 7: Transformer Layers**: A graphical flow showing Multi-Head Attention, Add & Norm, MLP (Feed Forward), and Layer Normalization, illustrating how the updated vector representations are prepared for the next layer.

## User Interface & Aesthetic System

- **Themes**:
  - **Classic Warm (Cream/Brown)**: A premium, cozy educational theme matching the user's uploaded image.
  - **Modern Cybernetic (Dark Mode)**: A sleek slate/neon-accented dark mode optimized for matrix heatmaps and grid lines.
- **Micro-interactions**:
  - Synchronized hovering: Hovering over any element in the pipeline (a token block, a token ID, a row in the attention matrix) will highlight the corresponding token across all other steps.
  - Interactive sliders to inspect embedding dimensions, change attention heads, or adjust BPE merges.

---

## Proposed Changes

We will build the application in the workspace using HTML, custom Vanilla CSS, and JavaScript.

### [Component: Web Application Frontend]

#### [NEW] [index.html](file:///d:/tokenizer-visualizer/index.html)
- Main layout structure.
- Navigation sidebar or top-bar representing the LLM Pipeline.
- Main content area containing 7 distinct interactive sections corresponding to each step of the pipeline.
- Preset selector controls and theme-switcher button.

#### [NEW] [style.css](file:///d:/tokenizer-visualizer/style.css)
- Core design tokens: margins, paddings, color schemes, font styling (using clean fonts like Outfit/Inter).
- CSS classes for layouts:
  - Flex rows for token mappings.
  - Grid structures for embedding heatmaps and the attention matrix.
  - Flex layout for the transformer block diagram.
- Elegant hover effect styling, tooltip styling, and animations.

#### [NEW] [tokenizer.js](file:///d:/tokenizer-visualizer/tokenizer.js)
- Implements BPE, Word-level, and Character-level tokenizers.
- Computes character indices and span offsets for exact text-to-token alignment.
- Generates reproducible pseudo-random embedding vectors and attention matrices based on token identities to make the visualization feel deterministic and responsive to changes.

#### [NEW] [app.js](file:///d:/tokenizer-visualizer/app.js)
- Application state controller (current input text, active step, active tokenizer mode, active attention head).
- DOM element renderer for token lists, ID grids, embedding heatmaps, attention matrices, and path flows.
- Multi-step synchronizer that binds hover events across all visual representations.

---

## Verification Plan

### Manual Verification
1. **Pipeline Navigation**: Verify clicking on steps correctly scrolls to or switches view to that stage.
2. **Dynamic Generation**: Verify typing custom text updates the tokens, IDs, embeddings, and attention matrix in real-time.
3. **Hover Synchronization**: Hover over a token in Step 2. Verify:
   - The characters are highlighted in Step 1.
   - The Token ID is highlighted in Step 3.
   - The vector is highlighted in Step 4/5.
   - The corresponding row/column is highlighted in the attention matrix (Step 6).
4. **Attention Head Toggles**: Switch between attention heads (e.g., Head 1: local focus, Head 2: first token focus) and verify the attention matrix weights adapt dynamically.
5. **Theme Toggle**: Check readability and aesthetic appeal in both Cream and Cybernetic themes.
