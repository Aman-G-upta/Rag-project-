const express = require("express");
const { protect } = require("../middleware/auth");
const {
  generateQuiz,
  getQuizzes,
  getQuiz,
  submitQuiz,
  getWeakTopics,
  getHistory,
} = require("../controllers/quiz.controller");

const router = express.Router();
router.use(protect);

router.post("/generate", generateQuiz);
router.get("/weak-topics", getWeakTopics); // before "/:id" to avoid route collision
router.get("/history", getHistory);
router.get("/", getQuizzes);
router.get("/:id", getQuiz);
router.post("/:id/submit", submitQuiz);

module.exports = router;