
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    searchUsers,
    sendFriendRequest,
    getFriendRequests,
    respondToRequest,
    getFriends,
    removeFriend
} = require("../controllers/friendController");

router.get("/search", authMiddleware, searchUsers);

router.post("/request", authMiddleware, sendFriendRequest);

router.get("/requests", authMiddleware, getFriendRequests);

router.patch("/request/:id", authMiddleware, respondToRequest);

router.get("/list", authMiddleware, getFriends);

router.delete("/:id", authMiddleware, removeFriend);

module.exports = router;
