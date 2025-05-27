const express = require("express");
const user_route = express();

const bodyParser = require("body-parser");

const session = require("express-session");
const { SESSION_SECRET } = process.env;
user_route.use(session({ secret: SESSION_SECRET }));

user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

user_route.set("view engine", "ejs");
user_route.set("views", "./views");

user_route.use(express.static("public"));

const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../public/images"));
    },
    filename: function (req, file, cb) {
        const name = Date.now() + file.originalname;
        cb(null, name);
    },
});

const upload = multer({ storage: storage });

const userController = require("../controllers/userController");
const auth = require("../middlewares/auth");

// Importa tu modelo de Chat aquí
const Chat = require("../models/chatModel"); // Asegúrate de que la ruta sea correcta

user_route.get("/register", auth.isLogout, userController.registerLoad);
user_route.post("/register", upload.single("Image"), userController.register);

user_route.get("/", auth.isLogout, userController.loadLogin);
user_route.post("/", userController.login);

user_route.get("/logout", auth.isLogin, userController.logout);

user_route.get("/dashboard", auth.isLogin, userController.loadDashboard);

user_route.post("/save-chat", userController.saveChat);

// **NUEVA RUTA para cargar chats antiguos**
user_route.post("/get-old-chats", auth.isLogin, async (req, res) => {
    try {
        const { sender_id, receiver_id } = req.body;

        if (!sender_id || !receiver_id) {
            return res.status(400).send({ success: false, msg: "IDs de remitente o receptor faltantes." });
        }

        // Busca los chats entre los dos usuarios, ordenados por fecha de creación
        const chats = await Chat.find({
            $or: [
                { sender_id: sender_id, receiver_id: receiver_id },
                { sender_id: receiver_id, receiver_id: sender_id }
            ]
        }).sort({ createdAt: 1 }); // 'createdAt' es añadido automáticamente por {Timestamp: true} en tu esquema de Chat

        res.status(200).send({ success: true, chats: chats });
    } catch (error) {
        console.error("Error al obtener chats antiguos:", error);
        res.status(500).send({ success: false, msg: "Error al cargar chats antiguos." });
    }
});


user_route.get(/^(?!\/register|\/$|\/logout|\/dashboard|\/get-old-chats|\/save-chat).*$/, function (req, res) {
    res.redirect("/");
});

module.exports = user_route;