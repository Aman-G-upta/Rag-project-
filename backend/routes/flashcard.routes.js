const express = require("express");
const { protect } = require("../middleware/auth");
const {
  generateFlashcards,
  getFlashcardSets,
  getFlashcardSet,
  deleteFlashcardSet,
} = require("../controllers/flashcard.controller");

const router = express.Router();
router.use(protect);

router.post("/generate", generateFlashcards);
router.get("/", getFlashcardSets);
router.get("/:id", getFlashcardSet);
router.delete("/:id", deleteFlashcardSet);

module.exports = router;