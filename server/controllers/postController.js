// ייבוא mongoose לעבודה מול MongoDB ו-GridFS
const mongoose = require("mongoose");

// ייבוא מודל פוסטים
const Post = require("../models/Post");

// ייבוא מודל קבוצות
const Group = require("../models/Group");

// ייבוא מודל משתמשים
const User = require("../models/User");

// בדיקת תקינות של MongoDB id
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ניקוי טקסט לפני שימוש בחיפוש Regex
const escapeRegex = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// בדיקת תאריך תקין
const isValidDate = (dateValue) => {
  const date = new Date(dateValue);
  return !Number.isNaN(date.getTime());
};

// שמירת קובץ בתוך MongoDB GridFS
const saveFileToGridFS = (file) => {
  return new Promise((resolve, reject) => {
    // יצירת bucket לשמירת קבצים ב-MongoDB
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "postFiles",
    });

    // שם ייחודי לקובץ
    const fileName = `${Date.now()}-${file.originalname}`;

    // פתיחת stream להעלאת הקובץ ל-GridFS
    const uploadStream = bucket.openUploadStream(fileName, {
      contentType: file.mimetype,
    });

    uploadStream.on("error", (error) => {
      reject(error);
    });

    uploadStream.on("finish", () => {
      resolve(uploadStream.id);
    });

    // כתיבת תוכן הקובץ מתוך הזיכרון ל-GridFS
    uploadStream.end(file.buffer);
  });
};

// בדיקה אם משתמש רשאי לראות פוסט מסוים
const canUserViewPost = (post, userId) => {
  const group = post.group;

  if (!group) {
    return false;
  }

  // קבוצה ציבורית פתוחה לצפייה
  if (!group.isPrivate) {
    return true;
  }

  // אם אין משתמש מחובר — אין גישה לקבוצה פרטית
  if (!userId) {
    return false;
  }

  // בקבוצה פרטית רק חברי הקבוצה יכולים לראות
  return group.members?.some(
    (memberId) => memberId.toString() === userId.toString()
  );
};

// שליפת פוסט מלא אחרי שינוי
const getPopulatedPostById = async (postId) => {
  return Post.findById(postId)
    .populate("author", "fullName email")
    .populate("group", "name isPrivate members")
    .populate("comments.user", "fullName email");
};

// יצירת פוסט חדש בקבוצה
const createPost = async (req, res) => {
  try {
    const { text, groupId } = req.body;

    // בדיקה שהתקבלה קבוצה
    if (!groupId) {
      return res.status(400).json({
        message: "Group id is required",
      });
    }

    // בדיקת id לא תקין
    if (!isValidObjectId(groupId)) {
      return res.status(400).json({
        message: "Invalid group id",
      });
    }

    // בדיקה שהקבוצה קיימת
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // בדיקה שהמשתמש חבר בקבוצה
    const isMember = group.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "Only group members can create posts",
      });
    }

    // מזהי קבצים שישמרו ב-MongoDB GridFS
    let imageFileId = null;
    let imageMimeType = "";
    let videoFileId = null;
    let videoMimeType = "";

    // שמירת תמונה ב-GridFS אם הועלתה
    if (req.files?.image?.[0]) {
      const imageFile = req.files.image[0];

      imageFileId = await saveFileToGridFS(imageFile);
      imageMimeType = imageFile.mimetype;
    }

    // שמירת סרטון ב-GridFS אם הועלה
    if (req.files?.video?.[0]) {
      const videoFile = req.files.video[0];

      videoFileId = await saveFileToGridFS(videoFile);
      videoMimeType = videoFile.mimetype;
    }

    const cleanText = text?.trim() || "";

    // בדיקה שלא יוצרים פוסט ריק
    if (!cleanText && !imageFileId && !videoFileId) {
      return res.status(400).json({
        message: "Post must contain text, an image, or a video",
      });
    }

    // יצירת הפוסט
    const post = await Post.create({
      text: cleanText,
      imageFileId,
      imageMimeType,
      videoFileId,
      videoMimeType,
      author: req.user._id,
      group: groupId,
      comments: [],
    });

    // החזרת פוסט מלא עם פרטי המשתמש והקבוצה
    const populatedPost = await getPopulatedPostById(post._id);

    res.status(201).json({
      message: "Post created successfully",
      post: populatedPost,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while creating post",
      error: error.message,
    });
  }
};

// שליפת כל הפוסטים של קבוצה
const getGroupPosts = async (req, res) => {
  try {
    const { groupId } = req.params;
    const viewerId = req.user?._id;

    // בדיקת id לא תקין
    if (!isValidObjectId(groupId)) {
      return res.status(400).json({
        message: "Invalid group id",
      });
    }

    // בדיקה שהקבוצה קיימת
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // אם הקבוצה פרטית, רק חברים יכולים לראות פוסטים
    if (group.isPrivate) {
      // אורח לא יכול לראות פוסטים בקבוצה פרטית
      if (!viewerId) {
        return res.status(403).json({
          message: "Only group members can view posts in this private group",
        });
      }

      const isMember = group.members.some(
        (memberId) => memberId.toString() === viewerId.toString()
      );

      if (!isMember) {
        return res.status(403).json({
          message: "Only group members can view posts in this private group",
        });
      }
    }

    // שליפת פוסטים מהחדש לישן
    const posts = await Post.find({ group: groupId })
      .populate("author", "fullName email")
      .populate("group", "name isPrivate")
      .populate("comments.user", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Group posts fetched successfully",
      posts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching group posts",
      error: error.message,
    });
  }
};

// מחיקת פוסט
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    // בדיקת id לא תקין
    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        message: "Invalid post id",
      });
    }

    // בדיקה שהפוסט קיים
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    // רק כותב הפוסט יכול למחוק אותו
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can delete only your own posts",
      });
    }

    // מחיקת הפוסט מה-DB
    await Post.findByIdAndDelete(postId);

    res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while deleting post",
      error: error.message,
    });
  }
};

// עדכון פוסט
const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    // בדיקת id לא תקין
    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        message: "Invalid post id",
      });
    }

    // בדיקה שהפוסט קיים
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    // רק כותב הפוסט יכול לערוך אותו
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can update only your own posts",
      });
    }

    const cleanText = text?.trim() || "";

    // אם אין טקסט חדש וגם אין מדיה קיימת — הפוסט יהיה ריק
    if (
      !cleanText &&
      !post.imageFileId &&
      !post.videoFileId &&
      !post.imageUrl &&
      !post.videoUrl
    ) {
      return res.status(400).json({
        message: "Post must contain text, an image, or a video",
      });
    }

    // עדכון הטקסט בלבד
    post.text = cleanText;

    await post.save();

    // החזרת הפוסט המעודכן עם פרטי המשתמש והקבוצה
    const updatedPost = await getPopulatedPostById(post._id);

    res.status(200).json({
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while updating post",
      error: error.message,
    });
  }
};

// שליפת קובץ מתוך MongoDB GridFS
const getPostFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    // בדיקה שה-id תקין
    if (!isValidObjectId(fileId)) {
      return res.status(400).json({
        message: "Invalid file id",
      });
    }

    const objectId = new mongoose.Types.ObjectId(fileId);

    // יצירת bucket שממנו נקרא את הקבצים
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "postFiles",
    });

    // בדיקה שהקובץ קיים
    const files = await mongoose.connection.db
      .collection("postFiles.files")
      .find({ _id: objectId })
      .toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    const file = files[0];

    // הגדרת סוג הקובץ כדי שהדפדפן ידע להציג תמונה/וידאו
    res.set("Content-Type", file.contentType || "application/octet-stream");

    // שליחת הקובץ לדפדפן
    const downloadStream = bucket.openDownloadStream(objectId);

    downloadStream.on("error", () => {
      if (!res.headersSent) {
        return res.status(404).json({
          message: "File not found",
        });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching file",
      error: error.message,
    });
  }
};

// חיפוש פוסטים לפי כמה פרמטרים
const searchPosts = async (req, res) => {
  try {
    const { text, author, mediaType, dateFrom, dateTo, groupId } = req.query;

    // קבוצות שהמשתמש רשאי לראות
    const accessibleGroups = await Group.find({
      $or: [{ isPrivate: false }, { members: req.user._id }],
    }).select("_id");

    const accessibleGroupIds = accessibleGroups.map((group) => group._id);

    const filter = {
      group: { $in: accessibleGroupIds },
    };

    // חיפוש בתוך קבוצה מסוימת אם נשלחה
    if (groupId) {
      if (!isValidObjectId(groupId)) {
        return res.status(400).json({
          message: "Invalid group id",
        });
      }

      if (!accessibleGroupIds.some((id) => id.toString() === groupId)) {
        return res.status(403).json({
          message: "You are not allowed to search posts in this group",
        });
      }

      filter.group = groupId;
    }

    // חיפוש לפי טקסט
    if (text && text.trim()) {
      filter.text = {
        $regex: escapeRegex(text.trim()),
        $options: "i",
      };
    }

    // חיפוש לפי כותב הפוסט
    if (author && author.trim()) {
      const cleanAuthor = escapeRegex(author.trim());

      const matchingUsers = await User.find({
        $or: [
          { fullName: { $regex: cleanAuthor, $options: "i" } },
          { email: { $regex: cleanAuthor, $options: "i" } },
        ],
      }).select("_id");

      filter.author = {
        $in: matchingUsers.map((user) => user._id),
      };
    }

    // חיפוש לפי סוג מדיה
    if (mediaType) {
      const allowedMediaTypes = ["text", "image", "video"];

      if (!allowedMediaTypes.includes(mediaType)) {
        return res.status(400).json({
          message: "Invalid media type",
        });
      }

      if (mediaType === "text") {
        filter.text = { $ne: "" };
        filter.imageFileId = null;
        filter.videoFileId = null;
      }

      if (mediaType === "image") {
        filter.imageFileId = { $ne: null };
      }

      if (mediaType === "video") {
        filter.videoFileId = { $ne: null };
      }
    }

    // חיפוש לפי טווח תאריכים
    if (dateFrom || dateTo) {
      filter.createdAt = {};

      if (dateFrom) {
        if (!isValidDate(dateFrom)) {
          return res.status(400).json({
            message: "Invalid start date",
          });
        }

        filter.createdAt.$gte = new Date(dateFrom);
      }

      if (dateTo) {
        if (!isValidDate(dateTo)) {
          return res.status(400).json({
            message: "Invalid end date",
          });
        }

        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }

      if (
        filter.createdAt.$gte &&
        filter.createdAt.$lte &&
        filter.createdAt.$gte > filter.createdAt.$lte
      ) {
        return res.status(400).json({
          message: "Start date cannot be after end date",
        });
      }
    }

    const posts = await Post.find(filter)
      .populate("author", "fullName email")
      .populate("group", "name isPrivate")
      .populate("comments.user", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Posts search completed successfully",
      count: posts.length,
      posts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while searching posts",
      error: error.message,
    });
  }
};

// שליפת כל הפוסטים של המשתמש המחובר
const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .populate("author", "fullName email")
      .populate("group", "name isPrivate")
      .populate("comments.user", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "My posts fetched successfully",
      count: posts.length,
      posts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching my posts",
      error: error.message,
    });
  }
};

// שליפת פיד של פוסטים מקבוצות שהמשתמש חבר בהן
const getFeedPosts = async (req, res) => {
  try {
    const userId = req.user._id;

    // מציאת כל הקבוצות שהמשתמש חבר בהן
    const groups = await Group.find({
      members: userId,
    }).select("_id");

    const groupIds = groups.map((group) => group._id);

    const posts = await Post.find({
      group: { $in: groupIds },
    })
      .populate("author", "fullName email")
      .populate("group", "name isPrivate")
      .populate("comments.user", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Feed posts fetched successfully",
      count: posts.length,
      posts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching feed posts",
      error: error.message,
    });
  }
};

// שליפת פוסטים של משתמש מסוים לפי הרשאות צפייה
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user?._id;

    // בדיקת id לא תקין
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    // בדיקה שהמשתמש קיים
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // שליפת כל הפוסטים של המשתמש המבוקש
    const posts = await Post.find({ author: userId })
      .populate("author", "fullName email")
      .populate("group", "name isPrivate members")
      .populate("comments.user", "fullName email")
      .sort({ createdAt: -1 });

    // הסתרת פוסטים מקבוצות פרטיות שהצופה לא חבר בהן
    const postsWithPermissions = posts.map((post) => {
      const group = post.group;

      if (!group) {
        return post;
      }

      const isPublicGroup = !group.isPrivate;

      // פוסטים מקבוצות ציבוריות פתוחים גם לאורחים
      if (isPublicGroup) {
        return post;
      }

      // אם אין משתמש מחובר — מסתירים פוסטים מקבוצות פרטיות
      if (!viewerId) {
        return {
          _id: post._id,
          author: post.author,
          group: {
            _id: group._id,
            name: group.name,
            isPrivate: group.isPrivate,
          },
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          isHidden: true,
          hiddenReason: "Private group",
        };
      }

      const isViewerMember = group.members?.some(
        (memberId) => memberId.toString() === viewerId.toString()
      );

      if (isViewerMember) {
        return post;
      }

      return {
        _id: post._id,
        author: post.author,
        group: {
          _id: group._id,
          name: group.name,
          isPrivate: group.isPrivate,
        },
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        isHidden: true,
        hiddenReason: "Private group",
      };
    });

    res.status(200).json({
      message: "User posts fetched successfully",
      count: postsWithPermissions.length,
      posts: postsWithPermissions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching user posts",
      error: error.message,
    });
  }
};

// הוספת תגובה לפוסט
const addCommentToPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    // בדיקת id לא תקין
    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        message: "Invalid post id",
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Comment text is required",
      });
    }

    const post = await Post.findById(postId).populate(
      "group",
      "name isPrivate members"
    );

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (!canUserViewPost(post, req.user._id)) {
      return res.status(403).json({
        message: "You are not allowed to comment on this post",
      });
    }

    post.comments.push({
      user: req.user._id,
      text: text.trim(),
    });

    await post.save();

    const updatedPost = await getPopulatedPostById(post._id);

    res.status(201).json({
      message: "Comment added successfully",
      post: updatedPost,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while adding comment",
      error: error.message,
    });
  }
};

// מחיקת תגובה מפוסט
const deleteCommentFromPost = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    // בדיקת ids לא תקינים
    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        message: "Invalid post id",
      });
    }

    if (!isValidObjectId(commentId)) {
      return res.status(400).json({
        message: "Invalid comment id",
      });
    }

    const post = await Post.findById(postId).populate(
      "group",
      "name isPrivate members"
    );

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (!canUserViewPost(post, req.user._id)) {
      return res.status(403).json({
        message: "You are not allowed to access comments on this post",
      });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    const isCommentAuthor =
      comment.user.toString() === req.user._id.toString();

    const isPostAuthor = post.author.toString() === req.user._id.toString();

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({
        message: "You can delete only your own comments",
      });
    }

    comment.deleteOne();
    await post.save();

    const updatedPost = await getPopulatedPostById(post._id);

    res.status(200).json({
      message: "Comment deleted successfully",
      post: updatedPost,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while deleting comment",
      error: error.message,
    });
  }
};

module.exports = {
  createPost,
  getGroupPosts,
  getPostFile,
  deletePost,
  updatePost,
  searchPosts,
  getMyPosts,
  getFeedPosts,
  getUserPosts,
  addCommentToPost,
  deleteCommentFromPost,
};