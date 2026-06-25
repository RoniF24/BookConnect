// ייבוא mongoose לעבודה מול MongoDB
const mongoose = require("mongoose");

// יצירת מבנה הנתונים של קבוצה
const groupSchema = new mongoose.Schema(
  {
    // שם הקבוצה
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // תיאור הקבוצה
    description: {
      type: String,
      default: "",
      trim: true,
    },

    // קטגוריה או ז׳אנר של הקבוצה
    category: {
      type: String,
      required: true,
      trim: true,
    },

    // האם הקבוצה פרטית
    isPrivate: {
      type: Boolean,
      default: false,
    },

    // המשתמש שיצר את הקבוצה
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // מנהלי הקבוצה
admins: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
],

    // חברי הקבוצה
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // בקשות הצטרפות שממתינות לאישור
    pendingRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    // מוסיף createdAt ו-updatedAt אוטומטית
    timestamps: true,
  }
);

// יצירת מודל Group מתוך הסכמה
const Group = mongoose.model("Group", groupSchema);

// ייצוא המודל לשימוש בקבצים אחרים
module.exports = Group;