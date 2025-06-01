require("dotenv").config();
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const app = express();

mongoose.connect("mongodb://127.0.0.1:27017/chatbelinginiers")
    .then(() => console.log("Conectado a MongoDB"))
    .catch(err => console.error("Error de conexión:", err));

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || "secreto",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000, httpOnly: true, secure: false }
}));

const userRoute = require("./routes/userRoute");
app.use("/", userRoute);

const User = require("./models/userModel");
const http = require("http").Server(app);
const io = require("socket.io")(http);
const usp = io.of("/user-namespace");

const onlineUsers = {};

usp.on("connection", async socket => {
    const userId = socket.handshake.auth.token;
    await User.findByIdAndUpdate(userId, { is_online: "1" });
    onlineUsers[userId] = socket.id;

    usp.emit("getOnlineUser", { user_id: userId });

    const currentOnlineUserIds = Object.keys(onlineUsers).filter(id => id !== userId);
    socket.emit("onlineUsersList", { onlineUserIds: currentOnlineUserIds });

    socket.on("newChat", data => {
        socket.broadcast.emit("loadNewChat", data);
    });

    socket.on("disconnect", async () => {
        await User.findByIdAndUpdate(userId, { is_online: "0" });
        delete onlineUsers[userId];
        usp.emit("getOfflineUser", { user_id: userId });
    });
});

http.listen(3001, () => {
    console.log("Servidor ejecutándose en el puerto 3001");
});
