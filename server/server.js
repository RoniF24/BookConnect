// ייבוא ספריית Express לבניית השרת
const express = require("express");

// ייבוא http כדי לחבר Socket.io לשרת
const http = require("http");

// ייבוא Socket.io לצ'אט בזמן אמת
const { Server } = require("socket.io");

// ייבוא ספריית CORS כדי לאפשר ללקוח לפנות לשרת
const cors = require("cors");

// ייבוא path כדי לעבוד עם נתיבים של תיקיות וקבצים
const path = require("path");

// טעינת משתנים מקובץ .env
require("dotenv").config();

// ייבוא פונקציית החיבור ל-MongoDB
const connectDB = require("./config/db");

// ייבוא מודל הודעות לצ'אט
const Message = require("./models/Message");

// ייבוא נתיבי פוסטים
const postRoutes = require("./routes/postRoutes");

// ייבוא נתיבי סטטיסטיקות
const statsRoutes = require("./routes/statsRoutes");

// ייבוא נתיבי צ'אט
const chatRoutes = require("./routes/chatRoutes");

// ייבוא נתיבי משתמשים
const userRoutes = require("./routes/userRoutes");

// ייבוא נתיבי קבוצות
const groupRoutes = require("./routes/groupRoutes");

// יצירת אפליקציית שרת
const app = express();

// יצירת שרת HTTP עבור Express ו-Socket.io
const server = http.createServer(app);

// יצירת שרת Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// הגדרת פורט לשרת
const PORT = process.env.PORT || 5000;

// חיבור ל-MongoDB
connectDB();

// מאפשר בקשות מהצד לקוח
app.use(cors());

// מאפשר לשרת לקרוא מידע בפורמט JSON
app.use(express.json());

// מאפשר גישה לקבצים שהועלו לשרת
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// חיבור נתיבי משתמשים לשרת
app.use("/api/users", userRoutes);

// חיבור נתיבי קבוצות לשרת
app.use("/api/groups", groupRoutes);

// חיבור נתיבי פוסטים לשרת
app.use("/api/posts", postRoutes);

// חיבור נתיבי סטטיסטיקות לשרת
app.use("/api/stats", statsRoutes);

// חיבור נתיבי צ'אט לשרת
app.use("/api/chat", chatRoutes);

// נתיב בדיקה בסיסי לשרת
app.get("/", (req, res) => {
  res.send("BookConnect server is running");
});

// שמירת משתמשים מחוברים לפי userId
const onlineUsers = new Map();

// חיבור Socket.io
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // הצטרפות משתמש מחובר לצ'אט
  socket.on("joinChat", (userId) => {
    if (!userId) {
      return;
    }

    onlineUsers.set(userId, socket.id);
    console.log("User joined chat:", userId);
  });

  // שליחת הודעה בזמן אמת
  socket.on("sendMessage", async (messageData) => {
    try {
      const { senderId, receiverId, text } = messageData;

      if (!senderId || !receiverId || !text || !text.trim()) {
        return;
      }

      // שמירת ההודעה ב-DB
      const savedMessage = await Message.create({
        sender: senderId,
        receiver: receiverId,
        text: text.trim(),
      });

      const populatedMessage = await Message.findById(savedMessage._id)
        .populate("sender", "fullName email")
        .populate("receiver", "fullName email");

      // שליחה לשולח
      socket.emit("receiveMessage", populatedMessage);

      // שליחה למקבל אם הוא מחובר
      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", populatedMessage);
      }
    } catch (error) {
      console.log("Socket message error:", error.message);
      socket.emit("chatError", "Could not send message");
    }
  });

  // ניתוק משתמש
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);

    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});

// הפעלת השרת
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});