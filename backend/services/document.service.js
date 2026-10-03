const mammoth = require("mammoth");
const PPTX2Json = require("pptx2json");

const { extractPdfPages } = require("./pdf.service");


// --------------------------------------------------
// PDF
// --------------------------------------------------

async function extractPdfDocument(buffer) {
  const { pages, numPages } = await extractPdfPages(buffer);

  return {
    pages,
    sourceCount: numPages,
    sourceType: "page",
  };
}


// --------------------------------------------------
// DOCX
// --------------------------------------------------

async function extractDocxDocument(buffer) {
  const result = await mammoth.extractRawText({ buffer });

  const text = result.value?.trim();

  if (!text) {
    return {
      pages: [],
      sourceCount: 0,
      sourceType: "section",
    };
  }

  /*
    DOCX does not reliably expose Word page numbers through
    Mammoth.

    So we divide the document into logical sections instead
    of pretending these are actual page numbers.
  */

  const paragraphs = text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const sections = [];

  let currentSection = "";
  const SECTION_SIZE = 2000;

  for (const paragraph of paragraphs) {
    if (
      currentSection &&
      currentSection.length + paragraph.length + 1 > SECTION_SIZE
    ) {
      sections.push(currentSection.trim());
      currentSection = "";
    }

    currentSection += paragraph + "\n";
  }

  if (currentSection.trim()) {
    sections.push(currentSection.trim());
  }

  const pages = sections.map((text, index) => ({
    pageNumber: index + 1,
    text,
  }));

  return {
    pages,
    sourceCount: pages.length,
    sourceType: "section",
  };
}


// --------------------------------------------------
// PPTX
// --------------------------------------------------

async function extractPptxDocument(buffer) {
  const pptx2json = new PPTX2Json();

  // pptx2json supports parsing directly from a Buffer
  const json = await pptx2json.buffer2json(buffer);

  const slideFiles = Object.keys(json)
    .filter((key) => /^ppt\/slides\/slide\d+\.xml$/.test(key))
    .sort((a, b) => {
      const slideA = parseInt(
        a.match(/slide(\d+)\.xml/)[1],
        10
      );

      const slideB = parseInt(
        b.match(/slide(\d+)\.xml/)[1],
        10
      );

      return slideA - slideB;
    });

  const pages = slideFiles.map((slideFile, index) => {
    const slideJson = json[slideFile];

    const texts = [];

    collectText(slideJson, texts);

    return {
      pageNumber: index + 1,
      text: texts.join(" ").trim(),
    };
  });

  // Remove completely empty slides
  const nonEmptySlides = pages.filter(
    (slide) => slide.text.length > 0
  );

  return {
    pages: nonEmptySlides,
    sourceCount: slideFiles.length,
    sourceType: "slide",
  };
}


// --------------------------------------------------
// Recursively collect PowerPoint text
// --------------------------------------------------

function collectText(value, texts) {
  if (!value) return;

  if (typeof value === "string") {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectText(item, texts);
    }

    return;
  }

  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "a:t") {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (typeof item === "string") {
              texts.push(item);
            } else if (item?._) {
              texts.push(item._);
            }
          }
        }
      } else {
        collectText(child, texts);
      }
    }
  }
}


// --------------------------------------------------
// Main extractor
// --------------------------------------------------

async function extractDocument(buffer, type) {
  switch (type) {
    case "pdf":
      return await extractPdfDocument(buffer);

    case "docx":
      return await extractDocxDocument(buffer);

    case "pptx":
      return await extractPptxDocument(buffer);

    default:
      throw new Error(`Unsupported document type: ${type}`);
  }
}


module.exports = {
  extractDocument,
  extractPdfDocument,
  extractDocxDocument,
  extractPptxDocument,
};