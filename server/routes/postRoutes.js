// ייבוא Express ליצירת נתיבים
const express = require("express");

// יצירת router לפוסטים
const router = express.Router();

// ייבוא פונקציות הפוסטים מה-controller
const {
  createPost,
  getGroupPosts,
  getPostFile,
  deletePost,
  updatePost,
  searchPosts,
  getMyPosts,
  getFeedPosts,
  getUserPosts,
  addCommentToPost,
  deleteCommentFromPost,
} = require("../controllers/postController");

// ייבוא Middleware שבודק הרשאות
const { protect, optionalAuth } = require("../middleware/authMiddleware");

// ייבוא middleware להעלאת קבצים
const uploadPostFiles = require("../middleware/uploadMiddleware");

// יצירת פוסט חדש עם טקסט/תמונה/סרטון
router.post("/", protect, uploadPostFiles, createPost);

// שליפת קובץ תמונה/וידאו מתוך MongoDB GridFS
router.get("/file/:fileId", getPostFile);

// שליפת כל הפוסטים של קבוצה
// אורח יכול לראות פוסטים בקבוצה ציבורית בלבד
router.get("/group/:groupId", optionalAuth, getGroupPosts);

// שליפת הפוסטים של המשתמש המחובר
router.get("/my-posts", protect, getMyPosts);

// שליפת פיד של פוסטים מקבוצות שהמשתמש חבר בהן
router.get("/feed", protect, getFeedPosts);

// פוסטים של משתמש מסוים לפי הרשאות צפייה
// אורח יכול לראות רק פוסטים מקבוצות ציבוריות
router.get("/user/:userId", optionalAuth, getUserPosts);

// הוספת תגובה לפוסט
router.post("/:postId/comments", protect, addCommentToPost);

// מחיקת תגובה מפוסט
router.delete("/:postId/comments/:commentId", protect, deleteCommentFromPost);

// עדכון פוסט
router.put("/:postId", protect, updatePost);

// מחיקת פוסט
router.delete("/:postId", protect, deletePost);

// חיפוש פוסטים
router.get("/search", protect, searchPosts);

// ייצוא ה-router לשימוש ב-server.js
module.exports = router;