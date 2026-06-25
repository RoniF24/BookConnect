// ייבוא Express
const express = require("express");

// יצירת router עבור נתיבי קבוצות
const router = express.Router();

// ייבוא פונקציות מה-controller
const {
  testGroups,
  createGroup,
  getAllGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  searchGroups,
  updateGroup,
  deleteGroup,
  requestJoinGroup,
  approveJoinRequest,
  rejectJoinRequest,
} = require("../controllers/groupController");

// ייבוא Middleware שבודק אם המשתמש מחובר
const { protect } = require("../middleware/authMiddleware");

// נתיב בדיקה לקבוצות
router.get("/test", testGroups);

// נתיב לקבלת כל הקבוצות
router.get("/", getAllGroups);

// חיפוש קבוצות
router.get("/search", searchGroups);

// נתיב לקבלת קבוצה אחת לפי id
router.get("/:id", getGroupById);

// נתיב להצטרפות לקבוצה ציבורית
router.post("/:id/join", protect, joinGroup);

// שליחת בקשת הצטרפות לקבוצה פרטית
router.post("/:id/request-join", protect, requestJoinGroup);

// אישור בקשת הצטרפות
router.post("/:id/approve-request/:userId", protect, approveJoinRequest);

// דחיית בקשת הצטרפות
router.post("/:id/reject-request/:userId", protect, rejectJoinRequest);

// נתיב ליציאה מקבוצה
router.post("/:id/leave", protect, leaveGroup);

// עדכון קבוצה
router.put("/:id", protect, updateGroup);

// מחיקת קבוצה
router.delete("/:id", protect, deleteGroup);

// נתיב ליצירת קבוצה חדשה
router.post("/", protect, createGroup);

// ייצוא ה-router לשימוש ב-server.js
module.exports = router;