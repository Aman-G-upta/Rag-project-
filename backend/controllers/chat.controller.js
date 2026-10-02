const asyncHandler = require("express-async-handler");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Document = require("../models/Document");
const Chunk = require("../models/Chunk");
const { embedText } = require("../services/embedding.service");
const { searchTopK } = require("../services/vector.service");
const { generateAnswer } = require("../services/llm.service");
const { RELEVANCE_THRESHOLD, buildMessages, bestScore, isSelfRefusal } = require("../services/rag.service");

const askQuestion = asyncHandler(async (req, res) => {
  const { documentId, question, conversationId } = req.body;

  if (!documentId || !question) {
    res.status(400);
    throw new Error("documentId and question are required");
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

  let conversation;
  if (conversationId) {
    conversation = await Conversation.findOne({ _id: conversationId, userId: req.user._id });
    if (!conversation) {
      res.status(404);
      throw new Error("Conversation not found");
    }
  } else {
    conversation = await Conversation.create({
      userId: req.user._id,
      documentId,
      title: question.slice(0, 60),
    });
  }

  await Message.create({ conversationId: conversation._id, role: "user", content: question });

  const queryEmbedding = await embedText(question);
  const topChunks = await searchTopK(Chunk, req.user._id, documentId, queryEmbedding, 5);

  if (bestScore(topChunks) < RELEVANCE_THRESHOLD) {
    const refusalText =
      "I couldn't find this in your uploaded material. Try rephrasing, or upload material that covers this topic.";
    const assistantMessage = await Message.create({
      conversationId: conversation._id,
      role: "assistant",
      content: refusalText,
      sources: [],
    });
    return res.json({
      success: true,
      conversationId: conversation._id,
      answer: refusalText,
      sources: [],
      refused: true,
      messageId: assistantMessage._id,
    });
  }

  const messages = buildMessages(question, topChunks);
  const answer = await generateAnswer(messages);

  const refused = isSelfRefusal(answer);
  const sources = refused
    ? []
    : topChunks.map((c) => ({
      pageNumber: c.pageNumber,
      snippet: c.content.slice(0, 180),
      score: Number(c.score.toFixed(3)),
    }));

  const assistantMessage = await Message.create({
    conversationId: conversation._id,
    role: "assistant",
    content: answer,
    sources,
  });

  res.json({
    success: true,
    conversationId: conversation._id,
    answer,
    sources,
    refused,
    messageId: assistantMessage._id,
  });
});

const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ userId: req.user._id }).sort({ updatedAt: -1 });
  res.json({ success: true, conversations });
});

const getConversationMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.user._id });
  if (!conversation) {
    res.status(404);
    throw new Error("Conversation not found");
  }
  const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });
  res.json({ success: true, conversation, messages });
});

module.exports = { askQuestion, getConversations, getConversationMessages };