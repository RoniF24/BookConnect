const mongoose = require("mongoose");

const Message = require("../models/Message");
const User = require("../models/User");

// בדיקת תקינות של MongoDB id
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// שליפת משתמשים לצ'אט + כמות הודעות שלא נקראו מכל משתמש
const getChatUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // שליפת כל המשתמשים מלבד המשתמש המחובר
    const users = await User.find({
      _id: { $ne: currentUserId },
    }).select("fullName email");

    // ספירת הודעות שלא נקראו לפי שולח
    const unreadBySender = await Message.aggregate([
      {
        $match: {
          receiver: currentUserId,
          isRead: false,
        },
      },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 },
        },
      },
    ]);

    // המרה למפה נוחה: userId -> unread count
    const unreadMap = {};

    unreadBySender.forEach((item) => {
      unreadMap[item._id.toString()] = item.count;
    });

    // הוספת unreadCount לכל משתמש ברשימה
    const usersWithUnreadCount = users.map((user) => {
      const plainUser = user.toObject();

      return {
        ...plainUser,
        unreadCount: unreadMap[user._id.toString()] || 0,
      };
    });

    // משתמשים עם הודעות שלא נקראו יופיעו למעלה
    usersWithUnreadCount.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) {
        return -1;
      }

      if (a.unreadCount === 0 && b.unreadCount > 0) {
        return 1;
      }

      return a.fullName.localeCompare(b.fullName);
    });

    res.status(200).json({
      message: "Chat users fetched successfully",
      users: usersWithUnreadCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch chat users",
      error: error.message,
    });
  }
};

// ספירת הודעות שלא נקראו
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiver: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      message: "Unread count fetched successfully",
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch unread count",
      error: error.message,
    });
  }
};

// שליפת הודעות בין המשתמש המחובר למשתמש אחר
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    const otherUser = await User.findById(userId);

    if (!otherUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // סימון הודעות נכנסות כנקראו
    await Message.updateMany(
      {
        sender: userId,
        receiver: req.user._id,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    const messages = await Message.find({
      $or: [
        {
          sender: req.user._id,
          receiver: userId,
        },
        {
          sender: userId,
          receiver: req.user._id,
        },
      ],
    })
      .populate("sender", "fullName email")
      .populate("receiver", "fullName email")
      .sort({ createdAt: 1 });

    res.status(200).json({
      message: "Conversation fetched successfully",
      messages,
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch conversation",
      error: error.message,
    });
  }
};

// שליחת הודעה ושמירה ב-DB
const sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;

    if (!receiverId) {
      return res.status(400).json({
        message: "Receiver is required",
      });
    }

    if (!isValidObjectId(receiverId)) {
      return res.status(400).json({
        message: "Invalid receiver id",
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Message text is required",
      });
    }

    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({
        message: "You cannot send a message to yourself",
      });
    }

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        message: "Receiver not found",
      });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      text: text.trim(),
      isRead: false,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "fullName email")
      .populate("receiver", "fullName email");

    res.status(201).json({
      message: "Message sent successfully",
      chatMessage: populatedMessage,
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not send message",
      error: error.message,
    });
  }
};

module.exports = {
  getChatUsers,
  getUnreadCount,
  getConversation,
  sendMessage,
};