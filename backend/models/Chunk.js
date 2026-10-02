const mongoose = require("mongoose");

const chunkSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true },
    embedding: { type: [Number], required: true },
    pageNumber: { type: Number, required: true },
    chunkIndex: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chunk", chunkSchema);