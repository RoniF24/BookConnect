// ייבוא mongoose לעבודה מול MongoDB
const mongoose = require("mongoose");

// יצירת מבנה הנתונים של משתמש
const userSchema = new mongoose.Schema(
  {
    // שם מלא של המשתמש
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    // אימייל ייחודי להתחברות
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // סיסמה מוצפנת
    password: {
      type: String,
      required: true,
    },

    // תיאור קצר בפרופיל
    bio: {
      type: String,
      default: "",
      trim: true,
    },

    // ז׳אנרים אהובים
    favoriteGenres: {
      type: [String],
      default: [],
    },

    // תמונת פרופיל
    profileImageUrl: {
      type: String,
      default: "",
    },

    // רשימת חברים
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // תפקיד כללי במערכת
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    // מוסיף createdAt ו-updatedAt אוטומטית
    timestamps: true,
  }
);

// יצירת מודל User מתוך הסכמה
const User = mongoose.model("User", userSchema);

// ייצוא המודל לשימוש בקבצים אחרים
module.exports = User;