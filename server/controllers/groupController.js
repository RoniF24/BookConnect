// ייבוא mongoose לבדיקת תקינות של ObjectId
const mongoose = require("mongoose");

// ייבוא מודל הקבוצה
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

// המרת ערך פרטיות לערך boolean
const parseBoolean = (value) => {
  return value === true || value === "true";
};

// בדיקה אם המשתמש הוא בעלים או מנהל בקבוצה
const isGroupOwnerOrAdmin = (group, userId) => {
  const isOwner = group.owner.toString() === userId.toString();

  const isAdmin = group.admins.some(
    (adminId) => adminId.toString() === userId.toString()
  );

  return isOwner || isAdmin;
};

// החזרת קבוצה מלאה עם populate
const getPopulatedGroupById = async (groupId) => {
  return Group.findById(groupId)
    .populate("owner", "fullName email")
    .populate("admins", "fullName email")
    .populate("members", "fullName email")
    .populate("pendingRequests", "fullName email");
};

// בדיקת חיבור בסיסית ל-controller של קבוצות
const testGroups = (req, res) => {
  res.json({
    message: "Group controller is working",
  });
};

// יצירת קבוצה חדשה
const createGroup = async (req, res) => {
  try {
    const { name, description, category, isPrivate } = req.body;

    // בדיקה שכל השדות החשובים קיימים
    if (!name || !category) {
      return res.status(400).json({
        message: "Group name and category are required",
      });
    }

    // בדיקה שהשם לא ריק אחרי הסרת רווחים
    if (!name.trim()) {
      return res.status(400).json({
        message: "Group name cannot be empty",
      });
    }

    // בדיקה שהקטגוריה לא ריקה אחרי הסרת רווחים
    if (!category.trim()) {
      return res.status(400).json({
        message: "Group category cannot be empty",
      });
    }

    // יצירת קבוצה חדשה
    const newGroup = await Group.create({
      name: name.trim(),
      description: description?.trim() || "",
      category: category.trim(),
      isPrivate: parseBoolean(isPrivate),
      owner: req.user._id,
      admins: [req.user._id],
      members: [req.user._id],
      pendingRequests: [],
    });

    const populatedGroup = await getPopulatedGroupById(newGroup._id);

    res.status(201).json({
      message: "Group created successfully",
      group: populatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while creating group",
      error: error.message,
    });
  }
};

// קבלת כל הקבוצות
const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("owner", "fullName email")
      .populate("admins", "fullName email")
      .populate("members", "fullName email")
      .populate("pendingRequests", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Groups fetched successfully",
      groups,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching groups",
      error: error.message,
    });
  }
};

// קבלת קבוצה אחת לפי id
const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    // בדיקת id לא תקין כדי למנוע שגיאת שרת
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid group id",
      });
    }

    const group = await getPopulatedGroupById(id);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    res.status(200).json({
      message: "Group fetched successfully",
      group,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching group",
      error: error.message,
    });
  }
};

// הצטרפות לקבוצה ציבורית
const joinGroup = async (req, res) => {
  try {
    const { id } = req.params;

    // בדיקת id לא תקין
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid group id",
      });
    }

    const group = await Group.findById(id);

    // בדיקה שהקבוצה קיימת
    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // לא מאפשרים להצטרף ישירות לקבוצה פרטית
    if (group.isPrivate) {
      return res.status(403).json({
        message: "This group is private. Please send a join request.",
      });
    }

    // בדיקה האם המשתמש כבר חבר בקבוצה
    const isAlreadyMember = group.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({
        message: "You are already a member of this group",
      });
    }

    // הסרת בקשת הצטרפות ישנה אם הייתה קיימת
    group.pendingRequests = group.pendingRequests.filter(
      (pendingUserId) => pendingUserId.toString() !== req.user._id.toString()
    );

    // הוספת המשתמש לרשימת החברים
    group.members.push(req.user._id);
    await group.save();

    const updatedGroup = await getPopulatedGroupById(group._id);

    res.status(200).json({
      message: "Joined group successfully",
      group: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while joining group",
      error: error.message,
    });
  }
};

// יציאה מקבוצה
const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;

    // בדיקת id לא תקין
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid group id",
      });
    }

    const group = await Group.findById(id);

    // בדיקה שהקבוצה קיימת
    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // בעל הקבוצה לא יכול לצאת מהקבוצה שלו
    if (group.owner.toString() === req.user._id.toString()) {
      return res.status(403).json({
        message: "Group owner cannot leave the group",
      });
    }

    // בדיקה האם המשתמש בכלל חבר בקבוצה
    const isMember = group.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(400).json({
        message: "You are not a member of this group",
      });
    }

    // הסרת המשתמש מרשימת החברים
    group.members = group.members.filter(
      (memberId) => memberId.toString() !== req.user._id.toString()
    );

    // אם המשתמש היה מנהל, נסיר אותו גם מרשימת המנהלים
    group.admins = group.admins.filter(
      (adminId) => adminId.toString() !== req.user._id.toString()
    );

    await group.save();

    const updatedGroup = await getPopulatedGroupById(group._id);

    res.status(200).json({
      message: "Left group successfully",
      group: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while leaving group",
      error: error.message,
    });
  }
};

// חיפוש קבוצות לפי כמה פרמטרים
const searchGroups = async (req, res) => {
  try {
    const { name, category, isPrivate, owner } = req.query;

    const filter = {};

    // חיפוש לפי שם קבוצה
    if (name && name.trim()) {
      filter.name = {
        $regex: escapeRegex(name.trim()),
        $options: "i",
      };
    }

    // חיפוש לפי קטגוריה
    if (category && category.trim()) {
      filter.category = {
        $regex: escapeRegex(category.trim()),
        $options: "i",
      };
    }

    // חיפוש לפי ציבורית / פרטית
    if (isPrivate === "true") {
      filter.isPrivate = true;
    }

    if (isPrivate === "false") {
      filter.isPrivate = false;
    }

    // חיפוש לפי שם או מייל של בעל הקבוצה
    if (owner && owner.trim()) {
      const cleanOwner = escapeRegex(owner.trim());

      const matchingOwners = await User.find({
        $or: [
          { fullName: { $regex: cleanOwner, $options: "i" } },
          { email: { $regex: cleanOwner, $options: "i" } },
        ],
      }).select("_id");

      filter.owner = {
        $in: matchingOwners.map((user) => user._id),
      };
    }

    const groups = await Group.find(filter)
      .populate("owner", "fullName email")
      .populate("admins", "fullName email")
      .populate("members", "fullName email")
      .populate("pendingRequests", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Groups search completed successfully",
      count: groups.length,
      groups,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while searching groups",
      error: error.message,
    });
  }
};

// עדכון קבוצה
const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, isPrivate } = req.body;

    // בדיקת id לא תקין
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid group id",
      });
    }

    // בדיקה שהקבוצה קיימת
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // בדיקה שהמשתמש הוא owner או admin
    if (!isGroupOwnerOrAdmin(group, req.user._id)) {
      return res.status(403).json({
        message: "Only group owner or admins can update this group",
      });
    }

    // ולידציה בסיסית
    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Group name is required",
      });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({
        message: "Group category is required",
      });
    }

    // עדכון השדות
    group.name = name.trim();
    group.description = description?.trim() || "";
    group.category = category.trim();

    // עדכון פרטיות אם נשלח ערך
    if (isPrivate !== undefined) {
      group.isPrivate = parseBoolean(isPrivate);
    }

    await group.save();

    // החזרת קבוצה מעודכנת עם populate
    const updatedGroup = await getPopulatedGroupById(group._id);

    res.status(200).json({
      message: "Group updated successfully",
      group: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while updating group",
      error: error.message,
    });
  }
};

// מחיקת קבוצה
const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    // בדיקת id לא תקין
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid group id",
      });
    }

    // בדיקה שהקבוצה קיימת
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // רק בעל הקבוצה יכול למחוק אותה
    if (group.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only the group owner can delete this group",
      });
    }

    // מחיקת הקבוצה מה-DB
    await Group.findByIdAndDelete(id);

    res.status(200).json({
      message: "Group deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while deleting group",
      error: error.message,
    });
  }
};

// שליחת בקשת הצטרפות לקבוצה פרטית
const requestJoinGroup = async (req, res) => {
  try {
    const { id } = req.params;

    // בדיקת id לא תקין
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid group id",
      });
    }

    // בדיקה שהקבוצה קיימת
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // אם הקבוצה ציבורית, אין צורך בבקשת הצטרפות
    if (!group.isPrivate) {
      return res.status(400).json({
        message: "This group is public. You can join it directly.",
      });
    }

    // בדיקה אם המשתמש כבר חבר בקבוצה
    const isMember = group.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (isMember) {
      return res.status(400).json({
        message: "You are already a member of this group",
      });
    }

    // בדיקה אם המשתמש כבר שלח בקשה
    const alreadyRequested = group.pendingRequests.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (alreadyRequested) {
      return res.status(400).json({
        message: "Join request already sent",
      });
    }

    // הוספת המשתמש לרשימת הבקשות הממתינות
    group.pendingRequests.push(req.user._id);

    await group.save();

    const updatedGroup = await getPopulatedGroupById(group._id);

    res.status(200).json({
      message: "Join request sent successfully",
      group: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while sending join request",
      error: error.message,
    });
  }
};

// אישור בקשת הצטרפות לקבוצה
const approveJoinRequest = async (req, res) => {
  try {
    const { id, userId } = req.params;

    // בדיקת ids לא תקינים
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid group id",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    // בדיקה שהקבוצה קיימת
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // בדיקה שהמשתמש הנוכחי הוא owner או admin
    if (!isGroupOwnerOrAdmin(group, req.user._id)) {
      return res.status(403).json({
        message: "Only group owner or admins can approve requests",
      });
    }

    // בדיקה שהמשתמש קיים
    const requestedUser = await User.findById(userId);

    if (!requestedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // בדיקה שהמשתמש באמת נמצא בבקשות הממתינות
    const hasRequest = group.pendingRequests.some(
      (pendingUserId) => pendingUserId.toString() === userId
    );

    if (!hasRequest) {
      return res.status(404).json({
        message: "Join request not found",
      });
    }

    // אם המשתמש עדיין לא חבר, מוסיפים אותו לחברים
    const isAlreadyMember = group.members.some(
      (memberId) => memberId.toString() === userId
    );

    if (!isAlreadyMember) {
      group.members.push(userId);
    }

    // הסרת המשתמש מרשימת הבקשות הממתינות
    group.pendingRequests = group.pendingRequests.filter(
      (pendingUserId) => pendingUserId.toString() !== userId
    );

    await group.save();

    const updatedGroup = await getPopulatedGroupById(group._id);

    res.status(200).json({
      message: "Join request approved successfully",
      group: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while approving join request",
      error: error.message,
    });
  }
};

// דחיית בקשת הצטרפות לקבוצה
const rejectJoinRequest = async (req, res) => {
  try {
    const { id, userId } = req.params;

    // בדיקת ids לא תקינים
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid group id",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    // בדיקה שהקבוצה קיימת
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // בדיקה שהמשתמש הנוכחי הוא owner או admin
    if (!isGroupOwnerOrAdmin(group, req.user._id)) {
      return res.status(403).json({
        message: "Only group owner or admins can reject requests",
      });
    }

    // בדיקה שהמשתמש קיים
    const requestedUser = await User.findById(userId);

    if (!requestedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // בדיקה שהמשתמש באמת נמצא בבקשות הממתינות
    const hasRequest = group.pendingRequests.some(
      (pendingUserId) => pendingUserId.toString() === userId
    );

    if (!hasRequest) {
      return res.status(404).json({
        message: "Join request not found",
      });
    }

    // הסרת המשתמש מרשימת הבקשות הממתינות
    group.pendingRequests = group.pendingRequests.filter(
      (pendingUserId) => pendingUserId.toString() !== userId
    );

    await group.save();

    const updatedGroup = await getPopulatedGroupById(group._id);

    res.status(200).json({
      message: "Join request rejected successfully",
      group: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while rejecting join request",
      error: error.message,
    });
  }
};

// ייצוא הפונקציות לשימוש ב-routes
module.exports = {
  testGroups,
  createGroup,
  searchGroups,
  getAllGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  updateGroup,
  deleteGroup,
  requestJoinGroup,
  approveJoinRequest,
  rejectJoinRequest,
};