
const prisma = require("../config/db");

const searchUsers = async (req, res) => {
    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({
                message: "Username is required"
            });
        }

        const users = await prisma.user.findMany({
            where: {
                username: {
                    contains: username,
                    mode: "insensitive"
                },
                id: {
                    not: req.user.id
                }
            },
            select: {
                id: true,
                name: true,
                username: true
            },
            take: 10
        });

        return res.status(200).json({ users });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to search users"
        });
    }
};

const sendFriendRequest = async (req, res) => {
    try {
        const senderId = req.user.id;
        const receiverId = Number(req.body.receiverId);

        if (!receiverId || !Number.isInteger(receiverId)) {
            return res.status(400).json({
                message: "Valid receiver ID is required"
            });
        }

        if (senderId === receiverId) {
            return res.status(400).json({
                message: "You cannot send a request to yourself"
            });
        }

        const receiver = await prisma.user.findUnique({
            where: { id: receiverId }
        });

        if (!receiver) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const existingRequest = await prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId }
                ]
            }
        });

        if (existingRequest) {
            return res.status(409).json({
                message: "Friend request already exists"
            });
        }

        const request = await prisma.friendRequest.create({
            data: {
                senderId,
                receiverId
            }
        });

        return res.status(201).json({
            message: "Friend request sent",
            request
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to send friend request"
        });
    }
};

const getFriendRequests = async (req, res) => {
    try {
        const requests = await prisma.friendRequest.findMany({
            where: {
                receiverId: req.user.id,
                status: "PENDING"
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        username: true
                    }
                }
            }
        });

        return res.status(200).json({ requests });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to fetch friend requests"
        });
    }
};

const respondToRequest = async (req, res) => {
    try {
        const requestId = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                message: "Valid request ID is required"
            });
        }

        if (!["ACCEPTED", "REJECTED"].includes(status)) {
            return res.status(400).json({
                message: "Status must be ACCEPTED or REJECTED"
            });
        }

        const request = await prisma.friendRequest.findFirst({
            where: {
                id: requestId,
                receiverId: req.user.id,
                status: "PENDING"
            }
        });

        if (!request) {
            return res.status(404).json({
                message: "Friend request not found"
            });
        }

        const updatedRequest = await prisma.friendRequest.update({
            where: { id: requestId },
            data: { status }
        });

        return res.status(200).json({
            message: `Friend request ${status.toLowerCase()}`,
            request: updatedRequest
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to respond to friend request"
        });
    }
};

const getFriends = async (req, res) => {
    try {
        const userId = req.user.id;

        const friendships = await prisma.friendRequest.findMany({
            where: {
                status: "ACCEPTED",
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        username: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        username: true
                    }
                }
            }
        });

        const friends = friendships.map((friendship) =>
            friendship.senderId === userId
                ? friendship.receiver
                : friendship.sender
        );

        return res.status(200).json({ friends });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to fetch friends"
        });
    }
};

module.exports = {
    searchUsers,
    sendFriendRequest,
    getFriendRequests,
    respondToRequest,
    getFriends
};
