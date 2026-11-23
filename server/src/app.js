
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const friendRoutes = require("./routes/friendRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Welcome to Denden API");
});

app.use("/api/auth", authRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/messages", messageRoutes);

module.exports = app;
