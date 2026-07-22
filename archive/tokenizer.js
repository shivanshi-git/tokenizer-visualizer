/**
 * Tokenizer Visualizer Engines
 * Includes Character-level, Regex Word-level, and custom BPE (Byte-Pair Encoding).
 */

// Helper to check if a character is whitespace
function isWhitespace(char) {
    return /\s/.test(char);
}

// Helper to check if a character is punctuation
function isPunctuation(char) {
    return /[\p{P}\p{S}]/u.test(char);
}

/**
 * Character Level Tokenizer
 */
class CharacterTokenizer {
    tokenize(text) {
        const tokens = [];
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            tokens.push({
                id: char.charCodeAt(0),
                text: char,
                start: i,
                end: i + 1,
                isSpace: isWhitespace(char)
            });
        }
        return tokens;
    }
}

/**
 * Word Level Tokenizer (Splits on whitespace and punctuation)
 */
class WordTokenizer {
    tokenize(text) {
        if (!text) return [];
        const tokens = [];
        
        // Regex matches words, individual punctuation marks, or sequences of spaces
        const regex = /(\s+)|([^\s\p{P}\p{S}]+)|([\p{P}\p{S}])/gu;
        let match;
        
        // Simple hash function for consistent word IDs
        const getWordId = (word) => {
            let hash = 0;
            for (let i = 0; i < word.length; i++) {
                hash = (hash << 5) - hash + word.charCodeAt(i);
                hash |= 0;
            }
            return Math.abs(hash) % 5000 + 1000;
        };

        while ((match = regex.exec(text)) !== null) {
            const matchedText = match[0];
            const start = match.index;
            const end = regex.lastIndex;
            const isSpace = isWhitespace(matchedText);

            tokens.push({
                id: isSpace ? 32 : getWordId(matchedText),
                text: matchedText,
                start: start,
                end: end,
                isSpace: isSpace
            });
        }
        return tokens;
    }
}

/**
 * Byte-Pair Encoding (BPE) Tokenizer
 * Uses a pre-defined set of merges optimized for standard text and specifically
 * matches the BPE tokenization in the user's example image.
 */
class BPETokenizer {
    constructor() {
        // Base vocabulary: Single characters (0 - 255)
        this.vocab = {};
        for (let i = 0; i < 265; i++) {
            // Include common characters in vocab
            this.vocab[String.fromCharCode(i)] = i;
        }

        // Ordered list of pairs to merge
        // We design this to tokenize:
        // "Is Chinese more efficient than English in an LLM?" ->
        // Is, Chin, es, e, more, effi, cien, t, th, an, Engl, ish, in, an, LLM, ?
        this.merges = [
            // Basic combinations
            ['t', 'h'], // th
            ['a', 'n'], // an
            ['e', 'r'], // er
            ['i', 'n'], // in
            ['e', 's'], // es
            ['o', 'n'], // on
            ['a', 't'], // at
            ['e', 'n'], // en
            ['c', 'h'], // ch
            ['l', 'l'], // ll
            ['i', 's'], // is
            ['c', 'i'], // ci
            ['e', 'f'], // ef
            ['f', 'i'], // fi
            ['e', 'l'], // el
            ['o', 'r'], // or
            ['m', 'o'], // mo
            ['r', 'e'], // re
            ['g', 'l'], // gl
            ['s', 'h'], // sh

            // Higher order merges for specific targets
            ['e', 'f'],
            ['ef', 'fi'],     // effi
            ['c', 'h'],
            ['ch', 'i'],      // chi
            ['chi', 'n'],     // chin (lower case)
            ['C', 'h'],
            ['Ch', 'i'],      // Chi
            ['Chi', 'n'],     // Chin
            ['ci', 'en'],     // cien
            ['mo', 're'],     // more
            ['E', 'n'],
            ['En', 'gl'],     // Engl
            ['is', 'h'],      // ish
            ['L', 'L'],       // LL
            ['LL', 'M'],      // LLM

            // General common prefixes/suffixes
            ['t', 'o'],
            ['o', 'u'],
            ['v', 'e'],
            ['u', 'n'],
            ['a', 'r'],
            ['n', 'g'],
            ['l', 'd'],
            ['n', 't'],
            ['e', 'd'],
            ['o', 'w'],
            ['u', 'r'],
            ['t', 'r'],
            ['s', 'p'],
            ['n', 'd'],
            ['l', 'y'],
            ['t', 'i'],
            ['t', 'e'],
            ['o', 'u'],
            ['o', 'ut'],
            ['th', 'e'],      // the
            ['th', 'at'],     // that
            ['t', 'ion'],
            ['a', 'l'],
            ['i', 't'],
            ['o', 'f'],
            ['h', 'e'],
            ['h', 'a'],
            ['a', 'b'],
            ['s', 'e'],
            ['m', 'e'],
            ['m', 'i'],
            ['d', 'e'],
            ['d', 'i'],
            ['s', 'u'],
            ['p', 'e'],
            ['p', 'r'],
            ['a', 'c'],
            ['c', 'o'],
            ['s', 'i'],
            ['w', 'o'],
            ['w', 'i'],
            ['w', 'h'],       // wh
            ['wh', 'ere'],    // where
            ['w', 'ith'],     // with
            ['t', 'h', 'e', 'r', 'e'], // there
            ['t', 'h', 'e', 'i', 'r'], // their
            ['a', 'b', 'o', 'u', 't'], // about
            ['w', 'o', 'u', 'l', 'd']  // would
        ];

        // Build vocab from merges
        this.merges.forEach((pair, idx) => {
            const mergedStr = pair.join('');
            if (!(mergedStr in this.vocab)) {
                this.vocab[mergedStr] = 256 + idx;
            }
        });
    }

    /**
     * Tokenize a single word into subwords using BPE merges
     */
    tokenizeWord(word) {
        if (word.length === 0) return [];
        
        // Start with array of characters
        let symbols = Array.from(word);
        
        while (symbols.length > 1) {
            let bestPairIndex = Infinity;
            let bestPair = null;
            
            // Look for the pair that appears earliest in the merges list
            for (let i = 0; i < symbols.length - 1; i++) {
                const char1 = symbols[i];
                const char2 = symbols[i+1];
                
                // Find this pair in merges
                const pairIndex = this.merges.findIndex(m => m[0] === char1 && m[1] === char2);
                if (pairIndex !== -1 && pairIndex < bestPairIndex) {
                    bestPairIndex = pairIndex;
                    bestPair = [char1, char2];
                }
            }
            
            if (bestPair === null) {
                break; // No more merges possible
            }
            
            // Merge the best pair
            const newSymbols = [];
            let i = 0;
            const target1 = bestPair[0];
            const target2 = bestPair[1];
            const merged = target1 + target2;
            
            while (i < symbols.length) {
                if (i < symbols.length - 1 && symbols[i] === target1 && symbols[i+1] === target2) {
                    newSymbols.push(merged);
                    i += 2;
                } else {
                    newSymbols.push(symbols[i]);
                    i += 1;
                }
            }
            symbols = newSymbols;
        }
        
        return symbols;
    }

    tokenize(text) {
        if (!text) return [];
        const tokens = [];
        
        // We first split by regex into word segments, punctuation, and whitespaces
        // This ensures BPE does not merge across spaces or punctuation
        const regex = /(\s+)|([^\s\p{P}\p{S}]+)|([\p{P}\p{S}])/gu;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            const matchedText = match[0];
            const start = match.index;
            const end = regex.lastIndex;
            
            if (isWhitespace(matchedText)) {
                // Whitespace is individual character tokens
                for (let i = 0; i < matchedText.length; i++) {
                    const char = matchedText[i];
                    tokens.push({
                        id: this.vocab[char] !== undefined ? this.vocab[char] : char.charCodeAt(0),
                        text: char,
                        start: start + i,
                        end: start + i + 1,
                        isSpace: true
                    });
                }
            } else if (isPunctuation(matchedText)) {
                // Punctuation is individual character tokens
                for (let i = 0; i < matchedText.length; i++) {
                    const char = matchedText[i];
                    tokens.push({
                        id: this.vocab[char] !== undefined ? this.vocab[char] : char.charCodeAt(0),
                        text: char,
                        start: start + i,
                        end: start + i + 1,
                        isSpace: false
                    });
                }
            } else {
                // It's a word! Run BPE merges on it
                const subwords = this.tokenizeWord(matchedText);
                let currentOffset = start;
                
                subwords.forEach(sub => {
                    const subStart = currentOffset;
                    const subEnd = currentOffset + sub.length;
                    
                    tokens.push({
                        id: this.vocab[sub] !== undefined ? this.vocab[sub] : (this.vocab[sub.toLowerCase()] || 9999),
                        text: sub,
                        start: subStart,
                        end: subEnd,
                        isSpace: false
                    });
                    
                    currentOffset = subEnd;
                });
            }
        }
        
        return tokens;
    }
}

// Export for browser compatibility (using window object if no module loader)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CharacterTokenizer, WordTokenizer, BPETokenizer };
} else {
    window.CharacterTokenizer = CharacterTokenizer;
    window.WordTokenizer = WordTokenizer;
    window.BPETokenizer = BPETokenizer;
}
