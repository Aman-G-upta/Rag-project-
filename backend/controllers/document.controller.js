const asyncHandler = require("express-async-handler");

const Document = require("../models/Document");
const Chunk = require("../models/Chunk");

const { extractDocument } = require("../services/document.service");
const { chunkDocumentPages } = require("../services/chunk.service");
const { embedBatch, embedText } = require("../services/embedding.service");
const { searchTopK } = require("../services/vector.service");


// --------------------------------------------------
// Get document type from uploaded file
// --------------------------------------------------

function getDocumentType(file) {
  const mimeToType = {
    "application/pdf": "pdf",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",

    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "pptx",
  };

  return mimeToType[file.mimetype] || null;
}


// --------------------------------------------------
// Upload document
// --------------------------------------------------

const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded (form field name must be "file")');
  }

  const type = getDocumentType(req.file);

  if (!type) {
    res.status(400);
    throw new Error("Unsupported document type");
  }

  const document = await Document.create({
    userId: req.user._id,
    title: req.body.title || req.file.originalname,
    originalName: req.file.originalname,
    type,
    subject: req.body.subject || "",
    status: "processing",
  });

  res.status(202).json({
    success: true,
    message: "Upload received, processing started",
    document,
  });

  processDocument(document._id, req.file.buffer, type).catch(async (err) => {
    console.error("Document processing failed:", err);

    await Document.findByIdAndUpdate(document._id, {
      status: "failed",
      processingError: err.message,
    });
  });
});


// --------------------------------------------------
// Process document
// --------------------------------------------------

async function processDocument(documentId, buffer, type) {
  const document = await Document.findById(documentId);

  if (!document) return;

  try {
    // Extract text according to file type
    const {
      pages,
      sourceCount,
      sourceType,
    } = await extractDocument(buffer, type);

    // Convert extracted text into chunks
    const rawChunks = chunkDocumentPages(pages, sourceType);

    if (rawChunks.length === 0) {
      await Document.findByIdAndUpdate(documentId, {
        status: "failed",
        processingError:
          "No extractable text found in this document.",
      });

      return;
    }

    // Generate embeddings
    const texts = rawChunks.map((chunk) => chunk.content);

    const vectors = await embedBatch(texts);

    // Prepare MongoDB documents
    const chunkDocs = rawChunks.map((chunk, index) => ({
      documentId: document._id,
      userId: document.userId,

      content: chunk.content,

      embedding: vectors[index],

      sourceNumber: chunk.sourceNumber,
      sourceType: chunk.sourceType,

      chunkIndex: chunk.chunkIndex,
    }));

    await Chunk.insertMany(chunkDocs);

    // Mark document as ready
    await Document.findByIdAndUpdate(documentId, {
      status: "ready",
      sourceCount,
      processingError: "",
    });

    console.log(
      `Document processed successfully: ${document.originalName}`
    );
  } catch (err) {
    console.error("Document processing failed:", err);

    await Document.findByIdAndUpdate(documentId, {
      status: "failed",
      processingError: err.message,
    });
  }
}


// --------------------------------------------------
// Get all documents
// --------------------------------------------------

const getDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find({
    userId: req.user._id,
  }).sort({
    createdAt: -1,
  });

  res.json({
    success: true,
    documents,
  });
});


// --------------------------------------------------
// Get single document
// --------------------------------------------------

const getDocumentById = asyncHandler(async (req, res) => {
  const document = await Document.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }

  const chunkCount = await Chunk.countDocuments({
    documentId: document._id,
  });

  res.json({
    success: true,
    document,
    chunkCount,
  });
});


// --------------------------------------------------
// Delete document
// --------------------------------------------------

const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }

  // Delete associated chunks first
  await Chunk.deleteMany({
    documentId: document._id,
  });

  await document.deleteOne();

  res.json({
    success: true,
    message: "Document deleted",
  });
});


// --------------------------------------------------
// Test semantic search
// --------------------------------------------------

const testSearch = asyncHandler(async (req, res) => {
  const { q, documentId } = req.query;

  if (!q) {
    res.status(400);
    throw new Error("Provide a query string as ?q=");
  }

  const queryEmbedding = await embedText(q);

  const results = await searchTopK(
    Chunk,
    req.user._id,
    documentId,
    queryEmbedding,
    5
  );

  res.json({
    success: true,
    query: q,

    results: results.map((result) => ({
      content: result.content,

      sourceNumber: result.sourceNumber,
      sourceType: result.sourceType,

      documentId: result.documentId,

      score: Number(result.score.toFixed(4)),
    })),
  });
});


module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  testSearch,
};