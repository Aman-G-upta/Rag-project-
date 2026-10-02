const express = require("express");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  testSearch,
} = require("../controllers/document.controller");

const router = express.Router();

router.use(protect);

router.post("/upload", upload.single("file"), uploadDocument);
router.get("/", getDocuments);
router.get("/search/test", testSearch);
router.get("/:id", getDocumentById);
router.delete("/:id", deleteDocument);

module.exports = router;