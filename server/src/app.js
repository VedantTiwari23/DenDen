
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const friendRoutes = require("./routes/friendRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();

const clientOrigin = process.env.CLIENT_URL
    ? (process.env.CLIENT_URL.includes(",") ? process.env.CLIENT_URL.split(",").map(url => url.trim()) : process.env.CLIENT_URL)
    : "http://localhost:5173";

app.use(cors({
    origin: clientOrigin,
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
