
require("dotenv").config();

const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const app = require("./app");
const prisma = require("./config/db");

const server = http.createServer(app);

const clientOrigin = process.env.CLIENT_URL
    ? (process.env.CLIENT_URL.includes(",") ? process.env.CLIENT_URL.split(",").map(url => url.trim()) : process.env.CLIENT_URL)
    : "http://localhost:5173";

const io = new Server(server, {
    cors: {
        origin: clientOrigin,
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.set("io", io);

const onlineUsers = new Map();

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error("Authentication required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;

        next();
    } catch (error) {
        next(new Error("Invalid or expired token"));
    }
});

io.on("connection", (socket) => {
    const userId = socket.userId;

    socket.join(`user:${userId}`);

    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
    }

    onlineUsers.get(userId).add(socket.id);

    const broadcastOnlineUsers = () => {
        io.emit("online-users", Array.from(onlineUsers.keys()));
    };

    broadcastOnlineUsers();

    console.log("User connected:", userId);

    socket.on("send-message", async (data) => {
        try {
            const receiverId = Number(data.receiverId);
            const content = data.content?.trim();

            if (!Number.isInteger(receiverId) || receiverId <= 0 || !content) {
                return socket.emit("message-error", "Invalid message details");
            }

            if (receiverId === userId) {
                return socket.emit("message-error", "Cannot message yourself");
            }

            const friendship = await prisma.friendRequest.findFirst({
                where: {
                    status: "ACCEPTED",
                    OR: [
                        { senderId: userId, receiverId },
                        { senderId: receiverId, receiverId: userId }
                    ]
                }
            });

            if (!friendship) {
                return socket.emit("message-error", "You can only message accepted friends");
            }

            const message = await prisma.message.create({
                data: {
                    senderId: userId,
                    receiverId,
                    content
                }
            });

            io.to(`user:${receiverId}`).emit("new-message", message);
            socket.emit("new-message", message);

        } catch (error) {
            console.error("Message error:", error);
            socket.emit("message-error", "Message could not be sent");
        }
    });

    socket.on("disconnect", () => {
        const userSockets = onlineUsers.get(userId);

        if (userSockets) {
            userSockets.delete(socket.id);

            if (userSockets.size === 0) {
                onlineUsers.delete(userId);
            }
        }

        broadcastOnlineUsers();
        console.log("User disconnected:", userId);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Denden server running on port ${PORT}`);
});
