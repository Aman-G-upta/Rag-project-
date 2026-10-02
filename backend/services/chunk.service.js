const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 120;

function chunkPageText(text) {
  const chunks = [];
  if (!text || !text.trim()) return chunks;

  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const slice = text.slice(start, end).trim();
    if (slice) chunks.push(slice);
    if (end === text.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

function chunkDocumentPages(pages) {
  const chunks = [];
  let chunkIndex = 0;

  for (const page of pages) {
    const pageChunks = chunkPageText(page.text);
    for (const content of pageChunks) {
      chunks.push({ content, pageNumber: page.pageNumber, chunkIndex: chunkIndex++ });
    }
  }
  return chunks;
}

module.exports = { chunkDocumentPages, chunkPageText };