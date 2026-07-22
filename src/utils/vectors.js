/**
 * Deterministic simulated embedding vector generation based on token text
 */
export function getEmbeddingVector(tokenText, length = 64) {
  if (!tokenText) return Array(length).fill(0);
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

/**
 * Sinusoidal Positional Embedding formula (Attention Is All You Need)
 */
export function getPositionalVector(pos, length = 64) {
  const vec = [];
  for (let i = 0; i < length; i++) {
    const freq = Math.pow(10000, (2 * Math.floor(i / 2)) / length);
    const val = i % 2 === 0 ? Math.sin(pos / freq) : Math.cos(pos / freq);
    vec.push(val);
  }
  return vec;
}
