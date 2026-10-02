const express = require("express");
const { protect } = require("../middleware/auth");
const { askQuestion, getConversations, getConversationMessages } = require("../controllers/chat.controller");

const router = express.Router();
router.use(protect);

router.post("/", askQuestion);
router.get("/", getConversations);
router.get("/:id", getConversationMessages);

module.exports = router;