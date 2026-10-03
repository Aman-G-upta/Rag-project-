const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    originalName: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["pdf", "docx", "pptx"],
      default: "pdf",
    },

    subject: {
      type: String,
      trim: true,
      default: "",
    },

    // Number of source units:
    // PDF  -> pages
    // PPTX -> slides
    // DOCX -> extracted sections
    sourceCount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["uploaded", "processing", "ready", "failed"],
      default: "uploaded",
    },

    processingError: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Document", documentSchema);