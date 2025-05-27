// Carga variables de entorno desde .env
require("dotenv").config();

const express = require('express');
const session = require('express-session'); // Importa express-session para manejar sesiones
const mongoose = require("mongoose");

const app = express();

// Conexión a MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/chatbelinginiers")
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error de conexión a MongoDB:', err));

// Middleware para servir archivos estáticos
app.use(express.static('public'));

// Middleware para parsear JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ** Configuración del middleware de sesión **
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu-secreto', // Clave secreta para firmar la cookie
  resave: false, // No guarda sesión si no ha cambiado
  saveUninitialized: false, // No guarda sesiones vacías
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hora de duración de la cookie
    httpOnly: true, // Seguridad: no accesible desde JS cliente
    secure: false // Cambia a true si usas HTTPS
  }
}));

// Importa rutas
const userRoute = require("./routes/userRoute");
app.use("/", userRoute);

// Importa modelo User para usar en sockets
const User = require("./models/userModel");

// Configuración de Socket.IO
const http = require("http").Server(app);
const io = require("socket.io")(http);
const usp = io.of("/user-namespace");

const onlineUsers = {};

usp.on("connection", async function(socket) {
    console.log("Usuario Conectado");

    var userId = socket.handshake.auth.token;

    await User.findByIdAndUpdate({ _id: userId }, { $set: { is_online: "1" } });

    onlineUsers[userId] = socket.id;

    usp.emit("getOnlineUser", { user_id: userId });

    const currentOnlineUserIds = Object.keys(onlineUsers).filter(id => id !== userId);
    socket.emit("onlineUsersList", { onlineUserIds: currentOnlineUserIds });

    socket.on("newChat", function(data) {
        socket.broadcast.emit("loadNewChat", data);
    });

    socket.on("disconnect", async function() {
        console.log("Usuario Desconectado");

        await User.findByIdAndUpdate({ _id: userId }, { $set: { is_online: "0" } });

        delete onlineUsers[userId];

        usp.emit("getOfflineUser", { user_id: userId });
    });
});

// Servidor escuchando en puerto 3001
http.listen(3001, function() {
    console.log("Server is running on port 3001");
});
