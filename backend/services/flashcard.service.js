const { generateAnswer } = require("./llm.service");
const { sampleChunks } = require("./quiz.service");

const SOURCE_LABELS = { page: "Page", slide: "Slide", section: "Section" };

function sourceLabel(sourceType) {
  return SOURCE_LABELS[sourceType] || "Page";
}

function buildFlashcardPrompt(chunks, numCards) {
  const context = chunks
    .map((c) => `[${sourceLabel(c.sourceType)} ${c.sourceNumber}]\n${c.content}`)
    .join("\n\n");

  return [
    {
      role: "system",
      content: `You are a flashcard generator for a student study app. Generate exactly ${numCards} flashcards STRICTLY based on the given material.

Respond with ONLY valid JSON (no markdown fences, no commentary), in this exact shape:
{
  "cards": [
    {
      "front": "a question, term or concept to recall",
      "back": "a short, clear answer or definition (1-3 sentences)",
      "topic": "short topic label, e.g. 'Deadlock Prevention'",
      "source": 12
    }
  ]
}

Rules:
- Base every card only on the material given — do not invent facts or use outside knowledge.
- Each card tests ONE idea. Keep the front short and the back concise.
- Cover different parts of the material; do not repeat the same concept.
- "source" is the number from the [Page N] / [Slide N] / [Section N] marker the card came from (a number, not a string).
- Keep "topic" short (2-4 words) and reuse the SAME label for cards on the same concept.`,
    },
    { role: "user", content: `MATERIAL:\n${context}` },
  ];
}

function parseFlashcardResponse(raw) {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");

  // Defensive: strip any commentary the model put before/after the JSON.
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error("Flashcard generation failed: model did not return valid JSON");
  }

  if (!Array.isArray(parsed.cards) || parsed.cards.length === 0) {
    throw new Error("Flashcard generation failed: no cards returned");
  }

  // Keep only well-formed cards instead of failing the whole set for one bad card.
  const cards = parsed.cards
    .filter(
      (c) =>
        c &&
        typeof c.front === "string" && c.front.trim() &&
        typeof c.back === "string" && c.back.trim()
    )
    .map((c) => {
      const source = Number(c.source ?? c.page);
      return {
        front: c.front.trim(),
        back: c.back.trim(),
        topic: typeof c.topic === "string" && c.topic.trim() ? c.topic.trim() : "General",
        sourceNumber: Number.isFinite(source) && source > 0 ? source : null,
      };
    });

  if (cards.length === 0) {
    throw new Error("Flashcard generation failed: malformed cards in model response");
  }
  return cards;
}

async function generateFlashcardsFromChunks(chunks, numCards) {
  const sampled = sampleChunks(chunks, 15);
  const messages = buildFlashcardPrompt(sampled, numCards);

  // Leave headroom so the JSON is never cut off mid-object.
  const maxTokens = Math.min(4000, 600 + numCards * 160);

  const raw = await generateAnswer(messages, { maxTokens, temperature: 0.4 });

  try {
    // All chunks of one document share the same sourceType (page / slide / section).
    const sourceType = chunks[0]?.sourceType || "page";
    return parseFlashcardResponse(raw).map((card) => ({ ...card, sourceType }));
  } catch (err) {
    console.error("Raw flashcard response that failed to parse:\n", raw);
    throw err;
  }
}

module.exports = { generateFlashcardsFromChunks, parseFlashcardResponse };