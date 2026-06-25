const express = require("express");
const { getStats } = require("../controllers/statsController");

const router = express.Router();

// קבלת נתונים סטטיסטיים לגרפים
router.get("/", getStats);

module.exports = router;