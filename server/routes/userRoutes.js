// ייבוא Express
const express = require("express");

// ייבוא multer להעלאת תמונת פרופיל
const multer = require("multer");

// ייבוא path לנתיבי קבצים
const path = require("path");

// ייבוא fs ליצירת תיקייה אם חסרה
const fs = require("fs");

// יצירת router עבור נתיבי משתמשים
const router = express.Router();

// ייבוא Middleware שבודק אם המשתמש מחובר
const { protect } = require("../middleware/authMiddleware");

// ייבוא פונקציות מה-controller
const {
  testUsers,
  registerUser,
  loginUser,
  getAllUsers,
  searchUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

// יצירת תיקיית תמונות פרופיל אם היא לא קיימת
const profileUploadPath = path.join(__dirname, "../uploads/profiles");

if (!fs.existsSync(profileUploadPath)) {
  fs.mkdirSync(profileUploadPath, { recursive: true });
}

// הגדרת שמירת תמונת פרופיל
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileUploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `profile-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;

    cb(null, uniqueName);
  },
});

// סינון סוגי קבצים מותרים
const profileFileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// Middleware להעלאת תמונת פרופיל
const uploadProfileImage = multer({
  storage: profileStorage,
  fileFilter: profileFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// נתיב בדיקה למשתמשים
router.get("/test", testUsers);

// נתיב קבלת כל המשתמשים
router.get("/all", getAllUsers);

// נתיב לחיפוש משתמשים לפי שם
router.get("/search", searchUsers);

// נתיב לקבלת משתמש אחד לפי מזהה
router.get("/:id", getUserById);

// נתיב לעדכון פרטי המשתמש המחובר בלבד
router.put("/:id", protect, uploadProfileImage.single("profileImage"), updateUser);

// נתיב למחיקת המשתמש המחובר בלבד
router.delete("/:id", protect, deleteUser);

// נתיב הרשמה למשתמש חדש
router.post("/register", uploadProfileImage.single("profileImage"), registerUser);

// נתיב התחברות למשתמש קיים
router.post("/login", loginUser);

// ייצוא ה-router לשימוש ב-server.js
module.exports = router;