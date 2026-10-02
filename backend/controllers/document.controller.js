const asyncHandler = require("express-async-handler");
const fs = require("fs");
const Document = require("../models/Document");
const Chunk = require("../models/Chunk");
const { extractPdfPages } = require("../services/pdf.service");
const { chunkDocumentPages } = require("../services/chunk.service");
const { embedBatch, embedText } = require("../services/embedding.service");
const { searchTopK } = require("../services/vector.service");

const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded (form field name must be "file")');
  }

  const document = await Document.create({
    userId: req.user._id,
    title: req.body.title || req.file.originalname,
    originalName: req.file.originalname,
    type: "pdf",
    subject: req.body.subject || "",
    status: "processing",
  });

  res.status(202).json({
    success: true,
    message: "Upload received, processing started",
    document,
  });

  processDocument(document._id, req.file.buffer).catch(async (err) => {
    console.error("Document processing failed:", err);
    await Document.findByIdAndUpdate(document._id, {
      status: "failed",
      processingError: err.message,
    });
  });
});

async function processDocument(documentId, buffer) {
  const document = await Document.findById(documentId);
  if (!document) return;

  try {
    const { pages, numPages } = await extractPdfPages(buffer);
    const rawChunks = chunkDocumentPages(pages);

    if (rawChunks.length === 0) {
      await Document.findByIdAndUpdate(documentId, {
        status: "failed",
        processingError:
          "No extractable text found. This PDF may be scanned/image-based.",
      });
      return;
    }

    const texts = rawChunks.map((c) => c.content);
    const vectors = await embedBatch(texts);

    const chunkDocs = rawChunks.map((c, i) => ({
      documentId: document._id,
      userId: document.userId,
      content: c.content,
      embedding: vectors[i],
      pageNumber: c.pageNumber,
      chunkIndex: c.chunkIndex,
    }));

    await Chunk.insertMany(chunkDocs);
    await Document.findByIdAndUpdate(documentId, {
      status: "ready",
      pageCount: numPages,
      processingError: "",
    });
  } catch (err) {
    console.error("Document processing failed:", err);
    await Document.findByIdAndUpdate(documentId, {
      status: "failed",
      processingError: err.message,
    });
  }
}
const getDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, documents });
});

const getDocumentById = asyncHandler(async (req, res) => {
  const document = await Document.findOne({ _id: req.params.id, userId: req.user._id });
  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }
  const chunkCount = await Chunk.countDocuments({ documentId: document._id });
  res.json({ success: true, document, chunkCount });
});

const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findOne({ _id: req.params.id, userId: req.user._id });
  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }
  await Chunk.deleteMany({ documentId: document._id });
  await document.deleteOne();
  res.json({ success: true, message: "Document deleted" });
});

const testSearch = asyncHandler(async (req, res) => {
  const { q, documentId } = req.query;
  if (!q) {
    res.status(400);
    throw new Error("Provide a query string as ?q=");
  }

  const queryEmbedding = await embedText(q);
  const results = await searchTopK(Chunk, req.user._id, documentId, queryEmbedding, 5);

  res.json({
    success: true,
    query: q,
    results: results.map((r) => ({
      content: r.content,
      pageNumber: r.pageNumber,
      documentId: r.documentId,
      score: Number(r.score.toFixed(4)),
    })),
  });
});

module.exports = { uploadDocument, getDocuments, getDocumentById, deleteDocument, testSearch };