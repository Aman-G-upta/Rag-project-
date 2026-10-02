const { generateAnswer } = require("./llm.service");

// A whole-document quiz needs breadth, not just the top semantic matches —
// so we evenly sample across the document instead of using vector search.
function sampleChunks(chunks, maxChunks = 15) {
  if (chunks.length <= maxChunks) return chunks;
  const step = chunks.length / maxChunks;
  const sampled = [];
  for (let i = 0; i < maxChunks; i++) {
    sampled.push(chunks[Math.floor(i * step)]);
  }
  return sampled;
}

function buildQuizPrompt(chunks, numQuestions) {
  const context = chunks.map((c) => `[Page ${c.pageNumber}]\n${c.content}`).join("\n\n");

  return [
    {
      role: "system",
      content: `You are a quiz generator for a student study app. Generate exactly ${numQuestions} multiple-choice questions STRICTLY based on the given material.

Respond with ONLY valid JSON (no markdown fences, no commentary), in this exact shape:
{
  "questions": [
    {
      "questionText": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "explanation": "string, 1-2 sentences, why the correct option is right",
      "topic": "short topic label, e.g. 'Deadlock Prevention'"
    }
  ]
}

Rules:
- Exactly 4 options per question, exactly one correct (correctIndex is 0-3).
- Base every question only on the material given — do not invent facts.
- Keep "topic" short (2-4 words) and reuse the SAME label for questions on the same concept — this label is used later to find a student's weak areas.`,
    },
    { role: "user", content: `MATERIAL:\n${context}` },
  ];
}

function parseQuizResponse(raw) {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");

  // Defensive: if the model added any commentary before/after the JSON
  // ("Sure, here's your quiz:\n{...}"), extract just the {...} block
  // instead of failing outright.
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error("Quiz generation failed: model did not return valid JSON");
  }

  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error("Quiz generation failed: no questions returned");
  }

  for (const q of parsed.questions) {
    if (
      typeof q.questionText !== "string" ||
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      typeof q.correctIndex !== "number" ||
      q.correctIndex < 0 ||
      q.correctIndex > 3
    ) {
      throw new Error("Quiz generation failed: malformed question in model response");
    }
  }

  return parsed.questions;
}

async function generateQuizFromChunks(chunks, numQuestions) {
  const sampled = sampleChunks(chunks, 15);
  const messages = buildQuizPrompt(sampled, numQuestions);

  // Each question (4 options + explanation + topic) needs real headroom —
  // the old fixed 700-token cap was truncating the JSON mid-object for
  // anything beyond ~2 questions, which is exactly what "model did not
  // return valid JSON" actually was.
  const maxTokens = Math.min(4000, 600 + numQuestions * 350);

  const raw = await generateAnswer(messages, { maxTokens, temperature: 0.4 });

  try {
    return parseQuizResponse(raw);
  } catch (err) {
    // Log the actual raw text so a future failure is diagnosable from the
    // server console instead of a guess — same pattern as processingError.
    console.error("Raw quiz response that failed to parse:\n", raw);
    throw err;
  }
}

module.exports = { generateQuizFromChunks, sampleChunks, parseQuizResponse };