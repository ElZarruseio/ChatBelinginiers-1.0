const express = require("express");
const user_route = express();

const bodyParser = require("body-parser");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const userController = require("../controllers/userController");
const auth = require("../middlewares/auth");
const Chat = require("../models/chatModel");

user_route.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));
user_route.use(express.static("public"));

user_route.set("view engine", "ejs");
user_route.set("views", "./views");

const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "../public/images")),
  filename: (req, file, cb) => cb(null, Date.now() + file.originalname),
});
const upload = multer({ storage });

user_route.get("/register", auth.isLogout, userController.registerLoad);
user_route.post("/register", upload.single("Image"), userController.register);

user_route.get("/", auth.isLogout, userController.loadLogin);
user_route.post("/", userController.login);

user_route.get("/logout", auth.isLogin, userController.logout);
user_route.get("/dashboard", auth.isLogin, userController.loadDashboard);
user_route.post("/save-chat", userController.saveChat);
user_route.post("/delete-chat", userController.deleteChat);

user_route.post("/get-old-chats", auth.isLogin, async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.body;

    if (!sender_id || !receiver_id) {
      return res
        .status(400)
        .send({ success: false, msg: "Faltan IDs de usuarios." });
    }

    const chats = await Chat.find({
      $or: [
        { sender_id, receiver_id },
        { sender_id: receiver_id, receiver_id: sender_id },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).send({ success: true, chats });
  } catch (error) {
    console.error("Error al obtener chats:", error);
    res.status(500).send({ success: false, msg: "Error al cargar chats." });
  }
});

user_route.get(
  /^(?!\/register|\/$|\/logout|\/dashboard|\/get-old-chats|\/save-chat).*$/,
  (req, res) => {
    res.redirect("/");
  }
);

module.exports = user_route;
