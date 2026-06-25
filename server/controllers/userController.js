// ייבוא mongoose לבדיקת תקינות של ObjectId
const mongoose = require("mongoose");

// ייבוא מודל המשתמש
const User = require("../models/User");

// ייבוא bcrypt להצפנת סיסמאות
const bcrypt = require("bcryptjs");

// ייבוא JWT ליצירת טוקן התחברות
const jwt = require("jsonwebtoken");

// בדיקת תקינות בסיסית של אימייל
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// בדיקת תקינות של MongoDB id
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// בדיקת חיבור בסיסית ל-controller של משתמשים
const testUsers = (req, res) => {
  res.json({
    message: "User controller is working",
  });
};

// הרשמת משתמש חדש
const registerUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // בדיקה שכל השדות קיימים
    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "Full name, email and password are required",
      });
    }

    // בדיקה שהשם לא ריק אחרי הסרת רווחים
    if (!fullName.trim()) {
      return res.status(400).json({
        message: "Full name cannot be empty",
      });
    }

    // בדיקת פורמט אימייל בסיסית
    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // בדיקת אורך סיסמה מינימלי
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // בדיקה אם האימייל כבר קיים
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }

    // הצפנת הסיסמה לפני שמירה
    const hashedPassword = await bcrypt.hash(password, 10);

    // יצירת משתמש חדש
    const newUser = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,

      // שמירת תמונת פרופיל אם נשלחה בהרשמה
      profileImageUrl: req.file
        ? `/uploads/profiles/${req.file.filename}`
        : "",
    });

    // החזרת תשובה בלי הסיסמה
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        bio: newUser.bio,
        favoriteGenres: newUser.favoriteGenres,
        profileImageUrl: newUser.profileImageUrl,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while registering user",
      error: error.message,
    });
  }
};

// התחברות משתמש קיים
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // בדיקה שכל השדות קיימים
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // בדיקת פורמט אימייל בסיסית
    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // חיפוש משתמש לפי אימייל
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // בדיקת התאמה בין הסיסמה שהוקלדה לבין הסיסמה המוצפנת
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // יצירת טוקן התחברות
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // התחברות הצליחה
    res.status(200).json({
      message: "User logged in successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        bio: user.bio,
        favoriteGenres: user.favoriteGenres,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while logging in",
      error: error.message,
    });
  }
};

// קבלת כל המשתמשים בלי סיסמאות
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching users",
      error: error.message,
    });
  }
};

// חיפוש משתמשים לפי שם
const searchUsers = async (req, res) => {
  try {
    const { name } = req.query;

    // בדיקה שנשלח שם תקין לחיפוש
    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Search name is required",
      });
    }

    // חיפוש משתמשים שהשם שלהם מכיל את הטקסט שהוקלד
    const users = await User.find({
      fullName: { $regex: name.trim(), $options: "i" },
    }).select("-password");

    res.status(200).json({
      message: "Users search completed successfully",
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while searching users",
      error: error.message,
    });
  }
};

// קבלת משתמש אחד לפי מזהה
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // בדיקת id לא תקין כדי למנוע שגיאת שרת
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    // חיפוש משתמש לפי id בלי להחזיר סיסמה
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching user",
      error: error.message,
    });
  }
};

// עדכון פרטי המשתמש המחובר בלבד
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, bio, favoriteGenres } = req.body;

    // בדיקת id לא תקין כדי למנוע שגיאת שרת
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    // בדיקה שהמשתמש המחובר עורך רק את עצמו
    if (req.user._id.toString() !== id) {
      return res.status(403).json({
        message: "You can update only your own profile",
      });
    }

    // חיפוש המשתמש לפי id
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // עדכון שם רק אם נשלח ולא ריק
    if (fullName !== undefined) {
      if (!fullName.trim()) {
        return res.status(400).json({
          message: "Full name cannot be empty",
        });
      }

      user.fullName = fullName.trim();
    }

    // עדכון Bio אם נשלח
    if (bio !== undefined) {
      user.bio = bio;
    }

    // עדכון ז'אנרים מועדפים אם נשלחו
    if (favoriteGenres !== undefined) {
      if (Array.isArray(favoriteGenres)) {
        user.favoriteGenres = favoriteGenres
          .map((genre) => genre.trim())
          .filter((genre) => genre !== "");
      } else {
        user.favoriteGenres = favoriteGenres
          .split(",")
          .map((genre) => genre.trim())
          .filter((genre) => genre !== "");
      }
    }

    // עדכון תמונת פרופיל אם נשלח קובץ
    if (req.file) {
      user.profileImageUrl = `/uploads/profiles/${req.file.filename}`;
    }

    // שמירת השינויים במסד הנתונים
    const updatedUser = await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        bio: updatedUser.bio,
        favoriteGenres: updatedUser.favoriteGenres,
        profileImageUrl: updatedUser.profileImageUrl,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while updating user",
      error: error.message,
    });
  }
};

// מחיקת המשתמש המחובר בלבד
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // בדיקת id לא תקין כדי למנוע שגיאת שרת
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    // בדיקה שהמשתמש המחובר מוחק רק את עצמו
    if (req.user._id.toString() !== id) {
      return res.status(403).json({
        message: "You can delete only your own profile",
      });
    }

    // חיפוש המשתמש לפי id
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // מחיקת המשתמש ממסד הנתונים
    await User.findByIdAndDelete(id);

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while deleting user",
      error: error.message,
    });
  }
};

// ייצוא הפונקציות לשימוש ב-routes
module.exports = {
  testUsers,
  registerUser,
  loginUser,
  getAllUsers,
  searchUsers,
  getUserById,
  updateUser,
  deleteUser,
};