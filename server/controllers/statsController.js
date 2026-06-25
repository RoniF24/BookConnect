const Group = require("../models/Group");
const Post = require("../models/Post");

// שליפת נתונים סטטיסטיים לגרפים
const getStats = async (req, res) => {
  try {
    // שליפת כל הקבוצות כדי להציג גם קבוצות בלי פוסטים
    const groups = await Group.find().select("name");

    // ספירת פוסטים לפי קבוצה
    const postsPerGroupAggregation = await Post.aggregate([
      {
        $group: {
          _id: "$group",
          count: { $sum: 1 },
        },
      },
    ]);

    // מיפוי groupId לכמות פוסטים
    const postsCountByGroupId = {};

    postsPerGroupAggregation.forEach((item) => {
      postsCountByGroupId[item._id?.toString()] = item.count;
    });

    const postsPerGroup = groups.map((group) => ({
      groupId: group._id,
      groupName: group.name,
      postsCount: postsCountByGroupId[group._id.toString()] || 0,
    }));

    // שליפת פוסטים לצורך חישוב סוגי מדיה
    const posts = await Post.find().select(
      "imageFileId imageUrl videoFileId videoUrl"
    );

    const postsByMediaType = {
      text: 0,
      image: 0,
      video: 0,
    };

    posts.forEach((post) => {
      const hasVideo = post.videoFileId || post.videoUrl;
      const hasImage = post.imageFileId || post.imageUrl;

      if (hasVideo) {
        postsByMediaType.video += 1;
      } else if (hasImage) {
        postsByMediaType.image += 1;
      } else {
        postsByMediaType.text += 1;
      }
    });

    res.status(200).json({
      message: "Stats fetched successfully",
      postsPerGroup,
      postsByMediaType: [
        {
          type: "Text only",
          count: postsByMediaType.text,
        },
        {
          type: "Image",
          count: postsByMediaType.image,
        },
        {
          type: "Video",
          count: postsByMediaType.video,
        },
      ],
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getStats,
};