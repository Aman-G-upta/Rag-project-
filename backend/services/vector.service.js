function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function searchTopK(Chunk, userId, documentId, queryEmbedding, k = 5) {
  const filter = { userId };
  if (documentId) filter.documentId = documentId;

  const chunks = await Chunk.find(filter).lean();
  const scored = chunks.map((c) => ({
    ...c,
    score: cosineSimilarity(c.embedding, queryEmbedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

module.exports = { cosineSimilarity, searchTopK };