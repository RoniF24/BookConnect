const express = require("express");
const {
  getChatUsers,
  getUnreadCount,
  getConversation,
  sendMessage,
} = require("../controllers/chatController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// שליפת משתמשים לצ'אט
router.get("/users", protect, getChatUsers);

// ספירת הודעות שלא נקראו
router.get("/unread-count", protect, getUnreadCount);

// שליפת שיחה עם משתמש מסוים
router.get("/conversation/:userId", protect, getConversation);

// שליחת הודעה
router.post("/messages", protect, sendMessage);

module.exports = router;