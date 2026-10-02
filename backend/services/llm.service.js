const QWEN_API_BASE = process.env.QWEN_API_BASE;
const QWEN_API_KEY = process.env.QWEN_API_KEY;
const QWEN_MODEL = process.env.QWEN_MODEL || "qwen3.5-35b-a3b";

async function generateAnswer(messages, options = {}) {
  if (!QWEN_API_BASE || !QWEN_API_KEY) {
    throw new Error(
      "QWEN_API_BASE / QWEN_API_KEY not set in .env — add the CoE AI Gateway URL and your personal key"
    );
  }

  const res = await fetch(`${QWEN_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${QWEN_API_KEY}`,
    },
    body: JSON.stringify({
      model: QWEN_MODEL,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 700,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Qwen API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

module.exports = { generateAnswer };