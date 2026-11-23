
const prisma = require("../config/db");

const getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const friendId = Number(req.params.friendId);

        if (!Number.isInteger(friendId) || friendId <= 0) {
            return res.status(400).json({
                message: "Valid friend ID is required"
            });
        }

        const friendship = await prisma.friendRequest.findFirst({
            where: {
                status: "ACCEPTED",
                OR: [
                    { senderId: userId, receiverId: friendId },
                    { senderId: friendId, receiverId: userId }
                ]
            }
        });

        if (!friendship) {
            return res.status(403).json({
                message: "You can only chat with accepted friends"
            });
        }

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: friendId },
                    { senderId: friendId, receiverId: userId }
                ]
            },
            orderBy: {
                createdAt: "asc"
            }
        });

        return res.status(200).json({ messages });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to fetch messages"
        });
    }
};

module.exports = { getMessages };
