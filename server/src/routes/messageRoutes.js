
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { getMessages } = require("../controllers/messageController");

router.get("/:friendId", authMiddleware, getMessages);

module.exports = router;
