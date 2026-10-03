const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    front: { type: String, required: true }, // question / term
    back: { type: String, required: true }, // answer / definition
    topic: { type: String, default: "General" },
    sourceNumber: { type: Number, default: null }, // page / slide / section number
    sourceType: { type: String, default: "page" }, // "page" | "slide" | "section"
  },
  { _id: false }
);

const flashcardSetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    title: { type: String, required: true },
    cards: { type: [cardSchema], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FlashcardSet", flashcardSetSchema);