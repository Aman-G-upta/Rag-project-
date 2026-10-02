const RELEVANCE_THRESHOLD = 0.4; // raised from 0.3 — see note below
const REFUSAL_PHRASE = "I couldn't find this in your uploaded material.";

const SYSTEM_PROMPT = `You are StudyLens, an academic study assistant.
Answer the student's question ONLY using the provided CONTEXT below.

Rules:
1. Do not use outside knowledge, even if you know the answer.
2. Do not invent or guess information that isn't in the CONTEXT.
3. If the CONTEXT does not contain enough information to answer, reply exactly: "${REFUSAL_PHRASE}"
4. Keep answers clear, educational, and reasonably concise.
5. Do not mention "the context" explicitly — answer naturally, as if you simply know the material.`;

function buildContext(chunks) {
  return chunks
    .map((c, i) => `[Chunk ${i + 1} — Page ${c.pageNumber}]\n${c.content}`)
    .join("\n\n");
}

function buildMessages(question, chunks) {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `CONTEXT:\n${buildContext(chunks)}\n\nQUESTION:\n${question}` },
  ];
}

function bestScore(chunks) {
  return chunks.length ? Math.max(...chunks.map((c) => c.score)) : 0;
}

function isSelfRefusal(answer) {
  return answer.trim().toLowerCase().includes(REFUSAL_PHRASE.toLowerCase());
}

module.exports = { RELEVANCE_THRESHOLD, REFUSAL_PHRASE, buildMessages, bestScore, isSelfRefusal };