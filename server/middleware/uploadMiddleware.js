// ייבוא multer לטיפול בהעלאת קבצים
const multer = require("multer");

// שמירת הקבצים בזיכרון זמני לפני שמירה ב-MongoDB GridFS
const storage = multer.memoryStorage();

// בדיקת סוגי קבצים מותרים
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  const allowedVideoTypes = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];

  if (
    allowedImageTypes.includes(file.mimetype) ||
    allowedVideoTypes.includes(file.mimetype)
  ) {
    cb(null, true);
    return;
  }

  cb(new Error("Only image and video files are allowed"), false);
};

// הגדרת העלאה עם מגבלת גודל
const uploadPostFiles = multer({
  storage,
  fileFilter,
  limits: {
    // עד 25MB לקובץ
    fileSize: 25 * 1024 * 1024,
  },
}).fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 },
]);

module.exports = uploadPostFiles;