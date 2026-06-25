// ייבוא mongoose לעבודה מול MongoDB
const mongoose = require("mongoose");

// יצירת מבנה נתונים לתגובה על פוסט
const commentSchema = new mongoose.Schema(
  {
    // המשתמש שכתב את התגובה
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // תוכן התגובה
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    // מוסיף createdAt ו-updatedAt לתגובה
    timestamps: true,
  }
);

// יצירת מבנה הנתונים של פוסט
const postSchema = new mongoose.Schema(
  {
    // תוכן טקסטואלי של הפוסט
    text: {
      type: String,
      default: "",
      trim: true,
    },

    // מזהה תמונה שנשמרה ב-MongoDB GridFS
    imageFileId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // סוג הקובץ של התמונה
    imageMimeType: {
      type: String,
      default: "",
      trim: true,
    },

    // מזהה סרטון שנשמר ב-MongoDB GridFS
    videoFileId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // סוג הקובץ של הסרטון
    videoMimeType: {
      type: String,
      default: "",
      trim: true,
    },

    // שדות ישנים שנשאיר זמנית כדי שפוסטים קיימים לא יישברו
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    videoUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // המשתמש שיצר את הפוסט
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // הקבוצה שאליה הפוסט שייך
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },

    // תגובות לפוסט
    comments: [commentSchema],
  },
  {
    // מוסיף createdAt ו-updatedAt אוטומטית
    timestamps: true,
  }
);

// ולידציה: פוסט חייב להכיל טקסט או תמונה או סרטון
postSchema.pre("validate", function () {
  if (
    !this.text &&
    !this.imageFileId &&
    !this.videoFileId &&
    !this.imageUrl &&
    !this.videoUrl
  ) {
    this.invalidate(
      "text",
      "Post must contain text, an image, or a video"
    );
  }
});

// יצירת מודל Post מתוך הסכמה
const Post = mongoose.model("Post", postSchema);

// ייצוא המודל לשימוש בקבצים אחרים
module.exports = Post;