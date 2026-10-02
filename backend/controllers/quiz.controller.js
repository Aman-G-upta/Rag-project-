const asyncHandler = require("express-async-handler");
const Document = require("../models/Document");
const Chunk = require("../models/Chunk");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const { generateQuizFromChunks } = require("../services/quiz.service");

// Strips answers/explanations so a student can't see them before submitting
function toSafeQuiz(quiz) {
  return {
    _id: quiz._id,
    documentId: quiz.documentId,
    title: quiz.title,
    createdAt: quiz.createdAt,
    questions: quiz.questions.map((q) => ({
      questionText: q.questionText,
      options: q.options,
      topic: q.topic,
    })),
  };
}

const generateQuiz = asyncHandler(async (req, res) => {
  const { documentId, numQuestions = 5 } = req.body;

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

  const chunks = await Chunk.find({ documentId, userId: req.user._id }).sort({ chunkIndex: 1 }).lean();
  if (chunks.length === 0) {
    res.status(400);
    throw new Error("This document has no processed content to quiz from");
  }

  const count = Math.min(Math.max(Number(numQuestions) || 5, 3), 10);
  const questions = await generateQuizFromChunks(chunks, count);

  const quiz = await Quiz.create({
    userId: req.user._id,
    documentId,
    title: `${document.title} — Quiz`,
    questions,
  });

  res.status(201).json({ success: true, quiz: toSafeQuiz(quiz) });
});

const getQuizzes = asyncHandler(async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.documentId) filter.documentId = req.query.documentId;
  const quizzes = await Quiz.find(filter)
    .sort({ createdAt: -1 })
    .select("title documentId createdAt questions");
  res.json({
    success: true,
    quizzes: quizzes.map((q) => ({
      _id: q._id,
      title: q.title,
      documentId: q.documentId,
      createdAt: q.createdAt,
      questionCount: q.questions.length,
    })),
  });
});

const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id });
  if (!quiz) {
    res.status(404);
    throw new Error("Quiz not found");
  }
  res.json({ success: true, quiz: toSafeQuiz(quiz) });
});

const submitQuiz = asyncHandler(async (req, res) => {
  const { answers } = req.body; // array of selectedIndex, same order as quiz.questions

  const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id });
  if (!quiz) {
    res.status(404);
    throw new Error("Quiz not found");
  }
  if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
    res.status(400);
    throw new Error(`Expected ${quiz.questions.length} answers`);
  }

  let score = 0;
  const gradedAnswers = quiz.questions.map((q, i) => {
    const selectedIndex = answers[i];
    const correct = selectedIndex === q.correctIndex;
    if (correct) score += 1;
    return { questionIndex: i, selectedIndex, correct, topic: q.topic };
  });

  await QuizAttempt.create({
    userId: req.user._id,
    quizId: quiz._id,
    documentId: quiz.documentId,
    answers: gradedAnswers,
    score,
    totalQuestions: quiz.questions.length,
  });

  const results = quiz.questions.map((q, i) => ({
    questionText: q.questionText,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    topic: q.topic,
    selectedIndex: answers[i],
    correct: gradedAnswers[i].correct,
  }));

  res.json({ success: true, score, totalQuestions: quiz.questions.length, results });
});

// Backend ready for the next feature (weak-topic detection) — not used by UI yet
const getWeakTopics = asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.find({ userId: req.user._id }).lean();

  const topicStats = {};
  for (const attempt of attempts) {
    for (const a of attempt.answers) {
      const topic = a.topic || "General";
      if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
      topicStats[topic].total += 1;
      if (a.correct) topicStats[topic].correct += 1;
    }
  }

  const topics = Object.entries(topicStats)
    .map(([topic, s]) => ({
      topic,
      correct: s.correct,
      total: s.total,
      accuracy: Math.round((s.correct / s.total) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  res.json({ success: true, topics });
});

const getHistory = asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .populate("documentId", "title")
    .limit(20);
  res.json({ success: true, attempts });
});

module.exports = { generateQuiz, getQuizzes, getQuiz, submitQuiz, getWeakTopics, getHistory };