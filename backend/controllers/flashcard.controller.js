const asyncHandler = require("express-async-handler");
const Document = require("../models/Document");
const Chunk = require("../models/Chunk");
const FlashcardSet = require("../models/FlashcardSet");
const { generateFlashcardsFromChunks } = require("../services/flashcard.service");

const generateFlashcards = asyncHandler(async (req, res) => {
  const { documentId, numCards = 10 } = req.body;

  if (!documentId) {
    res.status(400);
    throw new Error("documentId is required");
  }

  const document = await Document.findOne({ _id: documentId, userId: req.user._id });
  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }
  if (document.status !== "ready") {
    res.status(400);
    throw new Error(`Document is not ready yet (status: ${document.status})`);
  }

  // Embeddings aren't needed here, so skip loading them.
  const chunks = await Chunk.find({ documentId, userId: req.user._id })
    .select("-embedding")
    .sort({ chunkIndex: 1 })
    .lean();
  if (chunks.length === 0) {
    res.status(400);
    throw new Error("This document has no processed content to make flashcards from");
  }

  const count = Math.min(Math.max(Number(numCards) || 10, 5), 20);
  const cards = await generateFlashcardsFromChunks(chunks, count);

  const set = await FlashcardSet.create({
    userId: req.user._id,
    documentId,
    title: `${document.title} — Flashcards`,
    cards,
  });

  res.status(201).json({ success: true, set });
});

const getFlashcardSets = asyncHandler(async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.documentId) filter.documentId = req.query.documentId;

  const sets = await FlashcardSet.find(filter).sort({ createdAt: -1 });
  res.json({
    success: true,
    sets: sets.map((s) => ({
      _id: s._id,
      title: s.title,
      documentId: s.documentId,
      createdAt: s.createdAt,
      cardCount: s.cards.length,
    })),
  });
});

const getFlashcardSet = asyncHandler(async (req, res) => {
  const set = await FlashcardSet.findOne({ _id: req.params.id, userId: req.user._id });
  if (!set) {
    res.status(404);
    throw new Error("Flashcard set not found");
  }
  res.json({ success: true, set });
});

const deleteFlashcardSet = asyncHandler(async (req, res) => {
  const set = await FlashcardSet.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!set) {
    res.status(404);
    throw new Error("Flashcard set not found");
  }
  res.json({ success: true });
});
``
module.exports = { generateFlashcards, getFlashcardSets, getFlashcardSet, deleteFlashcardSet };