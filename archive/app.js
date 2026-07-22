/**
 * LLM Pipeline & Tokenizer Visualizer App Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // Application State
    // -------------------------------------------------------------
    const state = {
        text: 'Is Chinese more efficient than English in an LLM?',
        mode: 'bpe',          // 'word', 'char', 'bpe'
        activeStep: 'text',   // 'text', 'tokenization', 'token-ids', etc.
        attentionHead: 1,     // 1, 2, 3
        tokens: [],           // Current tokenized representations
        activeHoverIdx: null, // Token index currently hovered
        activeEmbedIdx: 0,    // Selected token index in Embedding stage
        activePosIdx: 0,      // Selected token index in Positional stage
    };

    // Initialize Tokenizers
    const charTokenizer = new CharacterTokenizer();
    const wordTokenizer = new WordTokenizer();
    const bpeTokenizer = new BPETokenizer();

    // -------------------------------------------------------------
    // DOM Elements
    // -------------------------------------------------------------
    const textInput = document.getElementById('text-input');
    const charCounter = document.getElementById('char-counter');
    const themeToggle = document.getElementById('theme-toggle');
    const stepButtons = document.querySelectorAll('.step-btn');
    const segmentButtons = document.querySelectorAll('.segmented-control button[data-mode]');
    const presetButtons = document.querySelectorAll('.btn-preset');
    const vocabSearchInput = document.getElementById('vocab-search');
    const vocabListContainer = document.getElementById('vocab-list-container');
    const vocabSizeBadge = document.getElementById('vocab-size');

    // Stats Elements
    const statTokens = document.getElementById('stat-tokens');
    const statChars = document.getElementById('stat-chars');
    const statRatio = document.getElementById('stat-ratio');

    // Stage Panels
    const stages = document.querySelectorAll('.stage-content');
    
    // Stage Outputs
    const charStreamOutput = document.getElementById('char-stream-output');
    const tokenGridOutput = document.getElementById('token-grid-output');
    const tokenIdsOutput = document.getElementById('token-ids-output');
    const embedTokensList = document.getElementById('embed-tokens-list');
    const embedTokenName = document.getElementById('embed-token-name');
    const embedTokenId = document.getElementById('embed-token-id');
    const embedVectorGrid = document.getElementById('embed-vector-grid');
    const positionalTokenSelect = document.getElementById('positional-token-select');
    const attentionMatrixGrid = document.getElementById('attention-matrix-grid');
    const attentionTooltip = document.getElementById('attention-tooltip');
    
    // -------------------------------------------------------------
    // Color Palette Utility (8 distinctive warm colors)
    // -------------------------------------------------------------
    const tokenColorCount = 8;

    // -------------------------------------------------------------
    // Presets Content
    // -------------------------------------------------------------
    const presets = {
        ml: "Deep learning models process inputs in parallel layers. Self-attention weights decide token relationships.",
        pangram: "The quick brown fox jumps over the lazy dog.",
        emojis: "Hello World! 👋 Learning AI is fun 🚀 Let's code 💻",
        code: "def greet(user):\n    print(f\"Hello, {user}!\")\n\ngreet(\"LLM\")"
    };

    // -------------------------------------------------------------
    // Helper Vector Functions
    // -------------------------------------------------------------
    // Deterministic embedding vector generation based on token text
    function getEmbeddingVector(tokenText, length = 64) {
        let hash = 0;
        for (let i = 0; i < tokenText.length; i++) {
            hash = tokenText.charCodeAt(i) + ((hash << 5) - hash);
        }
        const vec = [];
        for (let i = 0; i < length; i++) {
            const val = Math.sin(hash + i) * 10000;
            vec.push((val - Math.floor(val)) * 2 - 1); // maps to [-1.0, 1.0]
        }
        return vec;
    }

    // Sinusoidal Positional Embedding formula (Attention Is All You Need)
    function getPositionalVector(pos, length = 64) {
        const vec = [];
        for (let i = 0; i < length; i++) {
            const freq = Math.pow(10000, (2 * Math.floor(i / 2)) / length);
            const val = i % 2 === 0 ? Math.sin(pos / freq) : Math.cos(pos / freq);
            vec.push(val);
        }
        return vec;
    }

    // -------------------------------------------------------------
    // Core Processing Functions
    // -------------------------------------------------------------
    function processTokens() {
        const text = textInput.value;
        state.text = text;
        charCounter.textContent = `${text.length} chars`;

        // Select Tokenizer
        let activeTokenizer;
        if (state.mode === 'word') {
            activeTokenizer = wordTokenizer;
        } else if (state.mode === 'char') {
            activeTokenizer = charTokenizer;
        } else {
            activeTokenizer = bpeTokenizer;
        }

        // Run tokenization
        state.tokens = activeTokenizer.tokenize(text);
        
        // Reset dynamic indexes if they exceed token count
        if (state.activeEmbedIdx >= state.tokens.length) {
            state.activeEmbedIdx = 0;
        }
        if (state.activePosIdx >= state.tokens.length) {
            state.activePosIdx = 0;
        }

        // Render entire UI
        renderAll();
    }

    // -------------------------------------------------------------
    // Rendering Functions
    // -------------------------------------------------------------
    function renderAll() {
        renderStats();
        renderCharStream();
        renderTokens();
        renderTokenIDs();
        renderEmbeddings();
        renderPositional();
        renderAttention();
        renderTransformer();
    }

    function renderStats() {
        const totalTokens = state.tokens.length;
        const totalChars = state.text.length;
        
        // Calculate ratio
        const ratio = totalTokens > 0 ? (totalChars / totalTokens).toFixed(1) : '0.0';

        statTokens.textContent = totalTokens;
        statChars.textContent = totalChars;
        statRatio.textContent = ratio;
    }

    // Step 1: Raw Characters
    function renderCharStream() {
        charStreamOutput.innerHTML = '';
        const text = state.text;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const cell = document.createElement('div');
            cell.className = 'char-cell';
            
            // Format whitespace nicely
            if (char === ' ') {
                cell.innerHTML = '<span>␣</span>';
                cell.classList.add('space');
            } else if (char === '\n') {
                cell.innerHTML = '<span>↵</span>';
                cell.classList.add('space');
            } else {
                cell.textContent = char;
            }

            // Index tag
            const idxSpan = document.createElement('span');
            idxSpan.className = 'char-index';
            idxSpan.textContent = i;
            cell.appendChild(idxSpan);

            // Add hover mapping to token indices
            const tokenIdx = state.tokens.findIndex(t => i >= t.start && i < t.end);
            if (tokenIdx !== -1) {
                cell.dataset.tokenIdx = tokenIdx;
                cell.addEventListener('mouseenter', () => setGlobalHover(tokenIdx));
                cell.addEventListener('mouseleave', clearGlobalHover);
            }

            charStreamOutput.appendChild(cell);
        }
    }

    // Step 2: Tokens grid
    function renderTokens() {
        tokenGridOutput.innerHTML = '';
        
        if (state.tokens.length === 0) {
            tokenGridOutput.innerHTML = '<div class="empty-msg">No tokens to show.</div>';
            return;
        }

        state.tokens.forEach((token, idx) => {
            // Skip space-only tokens from display to keep it looking clean,
            // or render them with standard styling if it's char level.
            // Let's display everything, but formatting spaces.
            const block = document.createElement('div');
            
            // Alternating coloring classes
            const colorClass = `token-${idx % tokenColorCount}`;
            block.className = `token-block ${colorClass}`;
            block.dataset.tokenIdx = idx;

            let displayText = token.text;
            if (token.isSpace) {
                displayText = '␣';
                block.classList.add('space-token');
            } else {
                // replace spaces/new lines
                displayText = displayText.replace(/ /g, '␣').replace(/\n/g, '↵');
            }

            block.textContent = displayText;

            // Hover listeners
            block.addEventListener('mouseenter', () => setGlobalHover(idx));
            block.addEventListener('mouseleave', clearGlobalHover);

            tokenGridOutput.appendChild(block);
        });
    }

    // Step 3: Token IDs Grid
    function renderTokenIDs() {
        tokenIdsOutput.innerHTML = '';
        
        if (state.tokens.length === 0) {
            tokenIdsOutput.innerHTML = '<div class="empty-msg">No token IDs to show.</div>';
            return;
        }

        state.tokens.forEach((token, idx) => {
            const card = document.createElement('div');
            card.className = 'id-card';
            card.dataset.tokenIdx = idx;

            const name = document.createElement('span');
            name.className = 'id-token';
            name.textContent = token.text.trim() === '' ? (token.isSpace ? 'space' : 'newline') : token.text;

            const num = document.createElement('span');
            num.className = 'id-number';
            num.textContent = token.id;

            const posIndex = document.createElement('span');
            posIndex.className = 'id-idx';
            posIndex.textContent = `#${idx}`;

            card.appendChild(name);
            card.appendChild(num);
            card.appendChild(posIndex);

            // Hover listeners
            card.addEventListener('mouseenter', () => setGlobalHover(idx));
            card.addEventListener('mouseleave', clearGlobalHover);

            tokenIdsOutput.appendChild(card);
        });
    }

    // Step 4: Embeddings View
    function renderEmbeddings() {
        embedTokensList.innerHTML = '';
        
        if (state.tokens.length === 0) {
            embedTokenName.textContent = '-';
            embedTokenId.textContent = '-';
            embedVectorGrid.innerHTML = '';
            return;
        }

        // Render sidebar tokens
        state.tokens.forEach((token, idx) => {
            const item = document.createElement('div');
            item.className = 'embed-sidebar-item';
            if (idx === state.activeEmbedIdx) item.classList.add('active');
            item.dataset.tokenIdx = idx;

            const label = document.createElement('span');
            label.textContent = token.text.replace(/ /g, '␣').replace(/\n/g, '↵');

            const idSpan = document.createElement('span');
            idSpan.className = 'item-id';
            idSpan.textContent = token.id;

            item.appendChild(label);
            item.appendChild(idSpan);

            item.addEventListener('click', () => {
                state.activeEmbedIdx = idx;
                // Highlight active item in sidebar
                document.querySelectorAll('.embed-sidebar-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                drawEmbeddingHeatmap(token);
            });

            // Sync Hover
            item.addEventListener('mouseenter', () => setGlobalHover(idx));
            item.addEventListener('mouseleave', clearGlobalHover);

            embedTokensList.appendChild(item);
        });

        // Draw active token embedding
        const currentToken = state.tokens[state.activeEmbedIdx];
        drawEmbeddingHeatmap(currentToken);
    }

    function drawEmbeddingHeatmap(token) {
        embedVectorGrid.innerHTML = '';
        if (!token) return;

        embedTokenName.textContent = token.text.replace(/ /g, '[space]').replace(/\n/g, '[newline]');
        embedTokenId.textContent = token.id;

        // Generate vector of size 64
        const vector = getEmbeddingVector(token.text, 64);
        
        vector.forEach((val, idx) => {
            const cell = document.createElement('div');
            cell.className = 'vector-cell';
            
            // Map values between -1.0 and 1.0 to color gradients
            // Using standard diverging colors
            let color;
            const pct = Math.round((val + 1) * 50); // Convert [-1, 1] to [0, 100]%
            
            if (document.documentElement.getAttribute('data-theme') === 'cyber') {
                // Cyber Mode: Neon Pink/Indigo to Cyan
                // Pink is negative (-1.0), Cyan is positive (+1.0)
                color = `hsl(${280 - (pct * 1.8)}, 85%, ${20 + (pct * 0.45)}%)`;
            } else {
                // Cream Mode: Blue (negative) to Red (positive)
                color = `hsl(${220 - (pct * 2.2)}, 75%, ${90 - Math.abs(pct - 50) * 0.8}%)`;
            }
            
            cell.style.backgroundColor = color;
            cell.title = `Index ${idx}: ${val.toFixed(4)}`;
            
            // Text values inside cell
            cell.textContent = val.toFixed(1);
            cell.style.color = Math.abs(val) > 0.4 ? '#ffffff' : 'var(--text-primary)';

            embedVectorGrid.appendChild(cell);
        });
    }

    // Step 5: Positional Embeddings View
    function renderPositional() {
        positionalTokenSelect.innerHTML = '';
        
        if (state.tokens.length === 0) {
            drawPositionalFormula(null, 0);
            return;
        }

        // Render token selectors
        state.tokens.forEach((token, idx) => {
            const btn = document.createElement('button');
            btn.className = 'pos-token-btn';
            if (idx === state.activePosIdx) btn.classList.add('active');
            btn.dataset.tokenIdx = idx;
            btn.textContent = `${token.text.replace(/ /g, '␣')} (${idx})`;

            btn.addEventListener('click', () => {
                state.activePosIdx = idx;
                document.querySelectorAll('.pos-token-btn').forEach(el => el.classList.remove('active'));
                btn.classList.add('active');
                drawPositionalFormula(token, idx);
            });

            // Hover sync
            btn.addEventListener('mouseenter', () => setGlobalHover(idx));
            btn.addEventListener('mouseleave', clearGlobalHover);

            positionalTokenSelect.appendChild(btn);
        });

        drawPositionalFormula(state.tokens[state.activePosIdx], state.activePosIdx);
    }

    function drawPositionalFormula(token, index) {
        const semBar = document.getElementById('formula-semantic-preview');
        const posBar = document.getElementById('formula-positional-preview');
        const combBar = document.getElementById('formula-combined-preview');

        if (!token) {
            semBar.style.background = '';
            posBar.style.background = '';
            combBar.style.background = '';
            return;
        }

        // Generate semantic, positional, and combined vectors
        const semanticVec = getEmbeddingVector(token.text, 64);
        const positionalVec = getPositionalVector(index, 64);
        const combinedVec = semanticVec.map((v, i) => v + positionalVec[i]);

        // Helper to convert array to CSS gradient string for visual representations
        const buildGradientString = (vector, theme) => {
            const stops = [];
            const step = Math.floor(vector.length / 6); // Sample 6 points for gradient
            for (let i = 0; i < vector.length; i += step) {
                const val = vector[Math.min(i, vector.length - 1)];
                const normalized = Math.max(-1, Math.min(1, val));
                const pct = Math.round((normalized + 1) * 50);
                
                let color;
                if (theme === 'cyber') {
                    color = `hsl(${280 - (pct * 1.8)}, 85%, 50%)`;
                } else {
                    color = `hsl(${220 - (pct * 2.2)}, 75%, 50%)`;
                }
                stops.push(color);
            }
            return `linear-gradient(to right, ${stops.join(', ')})`;
        };

        const theme = document.documentElement.getAttribute('data-theme');
        semBar.style.background = buildGradientString(semanticVec, theme);
        posBar.style.background = buildGradientString(positionalVec, theme);
        combBar.style.background = buildGradientString(combinedVec, theme);
    }

    // Step 6: Attention Matrix
    function renderAttention() {
        const xLabelsContainer = document.getElementById('matrix-x-labels');
        const yLabelsContainer = document.getElementById('matrix-y-labels');
        
        xLabelsContainer.innerHTML = '';
        yLabelsContainer.innerHTML = '';
        attentionMatrixGrid.innerHTML = '';

        const N = state.tokens.length;
        if (N === 0) {
            attentionTooltip.textContent = 'No tokens. Enter text to visualize attention.';
            return;
        }

        // Build Labels
        state.tokens.forEach(token => {
            const cleanText = token.text.replace(/ /g, '␣').replace(/\n/g, '↵');
            
            const xLabel = document.createElement('div');
            xLabel.className = 'matrix-x-label';
            xLabel.textContent = cleanText;
            xLabelsContainer.appendChild(xLabel);

            const yLabel = document.createElement('div');
            yLabel.className = 'matrix-y-label';
            yLabel.textContent = cleanText;
            yLabelsContainer.appendChild(yLabel);
        });

        // Set Grid template
        attentionMatrixGrid.style.gridTemplateColumns = `repeat(${N}, 32px)`;
        attentionMatrixGrid.style.gridTemplateRows = `repeat(${N}, 32px)`;

        // Calculate Attention weights row-wise using Softmax
        const matrixScores = [];
        for (let i = 0; i < N; i++) {
            const rowLogits = [];
            for (let j = 0; j < N; j++) {
                let score = 0;
                
                if (state.attentionHead === 1) {
                    // Head 1: Local attention (band diagonal)
                    score = -Math.abs(i - j) * 1.8;
                } else if (state.attentionHead === 2) {
                    // Head 2: Broadcast first token
                    score = j === 0 ? 3.0 : (i === j ? 1.0 : -2.0);
                } else {
                    // Head 3: Key-Value letters association
                    const tI = state.tokens[i].text.toLowerCase();
                    const tJ = state.tokens[j].text.toLowerCase();
                    
                    // Simple logic: matches first characters or word length parity
                    if (tI[0] === tJ[0]) {
                        score += 2.0;
                    }
                    if (tI.length === tJ.length) {
                        score += 1.0;
                    }
                    if (i === j) {
                        score += 1.5; // Self-attention bias
                    }
                    // Subtract distance penalty
                    score -= Math.abs(i - j) * 0.3;
                }
                rowLogits.push(score);
            }
            
            // Softmax
            const maxL = Math.max(...rowLogits);
            const exps = rowLogits.map(l => Math.exp(l - maxL));
            const sumExps = exps.reduce((a,b) => a+b, 0);
            const weights = exps.map(e => e / sumExps);
            matrixScores.push(weights);
        }

        // Render Matrix Cells
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                const cell = document.createElement('div');
                cell.className = 'matrix-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                const weight = matrixScores[i][j];
                cell.dataset.weight = weight;

                // Color cell based on attention score
                // Pure color opacity
                const theme = document.documentElement.getAttribute('data-theme');
                if (theme === 'cyber') {
                    cell.style.backgroundColor = `rgba(99, 102, 241, ${weight})`;
                } else {
                    cell.style.backgroundColor = `rgba(193, 92, 46, ${weight})`;
                }

                // Grid highlights on hover
                cell.addEventListener('mouseenter', () => {
                    highlightMatrixGrid(i, j);
                    const sourceToken = state.tokens[i].text.replace(/ /g, '␣');
                    const targetToken = state.tokens[j].text.replace(/ /g, '␣');
                    attentionTooltip.innerHTML = `Token <strong>"${sourceToken}"</strong> attends to <strong>"${targetToken}"</strong> with weight <code class="accent-text">${(weight * 100).toFixed(1)}%</code>`;
                    
                    // Highlight tokens inside global stream
                    setGlobalHover(i); // Show row token highlight
                });

                cell.addEventListener('mouseleave', () => {
                    clearMatrixHighlights();
                    attentionTooltip.textContent = 'Hover over a cell to see how tokens attend to each other.';
                    clearGlobalHover();
                });

                attentionMatrixGrid.appendChild(cell);
            }
        }
    }

    function highlightMatrixGrid(rowIdx, colIdx) {
        document.querySelectorAll('.matrix-cell').forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            
            if (r === rowIdx) cell.classList.add('highlighted-row');
            if (c === colIdx) cell.classList.add('highlighted-col');
        });
    }

    function clearMatrixHighlights() {
        document.querySelectorAll('.matrix-cell').forEach(cell => {
            cell.classList.remove('highlighted-row', 'highlighted-col');
        });
    }

    // Step 7: Transformer Blocks Flow
    function renderTransformer() {
        // We highlight paths matching active tokens
        const flowBoxes = document.querySelectorAll('.flow-box');
        
        // Dynamic labels can be set based on hover
        if (state.activeHoverIdx !== null) {
            const activeT = state.tokens[state.activeHoverIdx];
            document.querySelector('[data-block="input"] .flow-box-desc').textContent = `Processing token: "${activeT.text}" at sequence position #${state.activeHoverIdx}`;
        } else {
            document.querySelector('[data-block="input"] .flow-box-desc').textContent = `Tokens with positional context`;
        }
    }

    // -------------------------------------------------------------
    // Global Hover Syncing System
    // -------------------------------------------------------------
    function setGlobalHover(idx) {
        state.activeHoverIdx = idx;

        // 1. Highlight Character cells in Step 1
        if (state.tokens[idx]) {
            const token = state.tokens[idx];
            document.querySelectorAll('.char-cell').forEach((cell, cIdx) => {
                if (cIdx >= token.start && cIdx < token.end) {
                    cell.style.backgroundColor = 'var(--accent)';
                    cell.style.color = '#ffffff';
                }
            });
        }

        // 2. Highlight Token blocks in Step 2
        document.querySelectorAll(`.token-block[data-token-idx="${idx}"]`).forEach(el => {
            el.classList.add('highlighted');
        });

        // 3. Highlight Token ID cards in Step 3
        document.querySelectorAll(`.id-card[data-token-idx="${idx}"]`).forEach(el => {
            el.classList.add('highlighted');
        });

        // 4. Highlight Embedding Sidebar elements in Step 4
        document.querySelectorAll(`.embed-sidebar-item[data-token-idx="${idx}"]`).forEach(el => {
            el.classList.add('highlighted');
        });

        // 5. Highlight Positional buttons in Step 5
        document.querySelectorAll(`.pos-token-btn[data-token-idx="${idx}"]`).forEach(el => {
            el.classList.add('active');
        });

        // Update active variables in steps if hovered
        renderTransformer();
    }

    function clearGlobalHover() {
        state.activeHoverIdx = null;

        // 1. Reset Characters in Step 1
        document.querySelectorAll('.char-cell').forEach(cell => {
            cell.style.backgroundColor = '';
            cell.style.color = '';
        });

        // 2. Reset Tokens in Step 2
        document.querySelectorAll('.token-block').forEach(el => {
            el.classList.remove('highlighted');
        });

        // 3. Reset IDs in Step 3
        document.querySelectorAll('.id-card').forEach(el => {
            el.classList.remove('highlighted');
        });

        // 4. Reset Sidebar in Step 4
        document.querySelectorAll('.embed-sidebar-item').forEach(el => {
            el.classList.remove('highlighted');
        });

        // 5. Reset Positional in Step 5
        document.querySelectorAll('.pos-token-btn').forEach((el, idx) => {
            if (idx !== state.activePosIdx) {
                el.classList.remove('active');
            }
        });

        renderTransformer();
    }

    // -------------------------------------------------------------
    // Vocab List Panel Initialization & Filtering
    // -------------------------------------------------------------
    function initVocabPanel() {
        renderVocabList();
    }

    function renderVocabList(filterText = '') {
        vocabListContainer.innerHTML = '';
        const search = filterText.toLowerCase();

        // Convert base character vocab and merges to items
        const listItems = [];

        // Single characters
        for (let char in bpeTokenizer.vocab) {
            const id = bpeTokenizer.vocab[char];
            
            // Format character representing keys
            let keyRep = char;
            if (char === ' ') keyRep = '[space]';
            if (char === '\n') keyRep = '[newline]';

            if (search && !keyRep.toLowerCase().includes(search) && !id.toString().includes(search)) {
                continue;
            }

            listItems.push({
                key: keyRep,
                id: id,
                isMerge: id >= 256
            });
        }

        // Sort items by ID
        listItems.sort((a, b) => a.id - b.id);
        
        vocabSizeBadge.textContent = `${listItems.length} items`;

        // Slice to first 100 items to avoid DOM lag
        const visibleItems = listItems.slice(0, 100);

        visibleItems.forEach(item => {
            const row = document.createElement('div');
            row.className = 'vocab-item';
            
            const keySpan = document.createElement('span');
            keySpan.className = 'vocab-key';
            keySpan.textContent = item.key;
            if (item.isMerge) {
                keySpan.innerHTML = `⚙️ ${item.key}`;
                keySpan.title = "BPE Merged rule";
            }

            const valSpan = document.createElement('span');
            valSpan.className = 'vocab-val';
            valSpan.textContent = item.id;

            row.appendChild(keySpan);
            row.appendChild(valSpan);
            vocabListContainer.appendChild(row);
        });

        if (visibleItems.length === 0) {
            vocabListContainer.innerHTML = '<div class="empty-msg">No vocab matches found.</div>';
        }
    }

    // -------------------------------------------------------------
    // Event Binding
    // -------------------------------------------------------------
    // Input listener
    textInput.addEventListener('input', processTokens);

    // Segment selectors (Word / Char / BPE)
    segmentButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            segmentButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            state.mode = btn.dataset.mode;
            
            // BPE vocab panel is only relevant for BPE mode
            if (state.mode === 'bpe') {
                document.getElementById('bpe-vocab-panel').style.display = 'flex';
            } else {
                document.getElementById('bpe-vocab-panel').style.display = 'none';
            }

            processTokens();
        });
    });

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'cyber' ? 'cream' : 'cyber';
        document.documentElement.setAttribute('data-theme', nextTheme);
        
        // Update button text
        if (nextTheme === 'cyber') {
            themeToggle.innerHTML = '🌙 Cyber';
        } else {
            themeToggle.innerHTML = '☀️ Cream';
        }

        // Re-render components that are theme-sensitive
        renderAll();
    });

    // Stepper Navigation
    stepButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            stepButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const step = btn.dataset.step;
            state.activeStep = step;

            // Show matching stage content
            stages.forEach(stage => {
                stage.classList.remove('active');
                if (stage.id === `stage-${step}`) {
                    stage.classList.add('active');
                }
            });
            
            // Re-draw embedding or positional specifically when tabs change
            if (step === 'embeddings') {
                renderEmbeddings();
            } else if (step === 'positional') {
                renderPositional();
            } else if (step === 'attention') {
                renderAttention();
            }
        });
    });

    // Presets
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const presetKey = btn.dataset.preset;
            if (presets[presetKey]) {
                textInput.value = presets[presetKey];
                processTokens();
            }
        });
    });

    // Vocab Search
    vocabSearchInput.addEventListener('input', (e) => {
        renderVocabList(e.target.value);
    });

    // Attention Head Selector Buttons
    document.querySelectorAll('.segmented-control.mini-control button[data-head]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.segmented-control.mini-control button[data-head]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            state.attentionHead = parseInt(btn.dataset.head);
            renderAttention();
        });
    });

    // -------------------------------------------------------------
    // Initial Bootstrapping
    // -------------------------------------------------------------
    processTokens();
    initVocabPanel();
});
