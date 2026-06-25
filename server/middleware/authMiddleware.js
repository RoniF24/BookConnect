// ייבוא JWT כדי לבדוק את הטוקן
const jwt = require("jsonwebtoken");

// ייבוא מודל המשתמש
const User = require("../models/User");

// שליפת token מתוך Authorization header
const getTokenFromRequest = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    return req.headers.authorization.split(" ")[1];
  }

  return null;
};

// Middleware שבודק אם המשתמש מחובר
const protect = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    // אם לא נשלח token
    if (!token) {
      return res.status(401).json({
        message: "Not authorized, no token",
      });
    }

    // פענוח הטוקן
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // מציאת המשתמש המחובר לפי ה-id שבטוקן, בלי סיסמה
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        message: "Not authorized, user not found",
      });
    }

    // מעבר לפונקציה הבאה
    next();
  } catch (error) {
    res.status(401).json({
      message: "Not authorized, token failed",
    });
  }
};

// Middleware אופציונלי: אם יש token תקין נטען משתמש, אם אין ממשיכים כאורח
const optionalAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    // אין token — ממשיכים כאורח
    if (!token) {
      req.user = null;
      return next();
    }

    // יש token — ננסה לזהות את המשתמש
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    // גם אם המשתמש לא נמצא, ממשיכים כאורח
    if (!req.user) {
      req.user = null;
    }

    next();
  } catch (error) {
    // token לא תקין — לא מפילים את הבקשה, ממשיכים כאורח
    req.user = null;
    next();
  }
};

// ייצוא ה-Middleware
module.exports = {
  protect,
  optionalAuth,
};