const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const registerLoad = async (req, res) => {
  try {
    res.render("register");
  } catch (error) {
    console.log(error.message);
  }
};

const register = async (req, res) => {
  try {
    if (!req.body.name || !req.body.email || !req.body.password || !req.file) {
      return res.render("register", {
        message: "Completa todos los campos requeridos, incluyendo la imagen.",
      });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      image: req.file.filename,
      password: passwordHash,
      is_online: "0",
    });

    await user.save();
    res.render("register", { message: "Registro exitoso!" });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.render("register", {
        message: "Este correo ya está registrado.",
      });
    }
    console.error("Error en el registro:", error);
    res.render("register", { message: "Error durante el registro." });
  }
};

const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email });

    if (userData && (await bcrypt.compare(password, userData.password))) {
      req.session.user_id = userData._id;
      req.session.user = userData;
      return res.redirect("/dashboard");
    }

    res.render("login", { message: "Correo o contraseña incorrectos." });
  } catch (error) {
    console.log(error.message);
    res.render("login", { message: "Ocurrió un error al iniciar sesión." });
  }
};

const logout = async (req, res) => {
  try {
    if (req.session.user_id) {
      await User.findByIdAndUpdate(req.session.user_id, { is_online: "0" });
    }
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

const loadDashboard = async (req, res) => {
  try {
    if (!req.session.user_id) return res.redirect("/login");

    const loggedInUser = await User.findById(req.session.user_id);
    if (!loggedInUser) {
      req.session.destroy();
      return res.redirect("/login");
    }

    const users = await User.find({ _id: { $ne: loggedInUser._id } });
    res.render("dashboard", { user: loggedInUser, users });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Error interno al cargar el dashboard.");
  }
};

const saveChat = async (req, res) => {
  try {
    const { sender_id, receiver_id, message } = req.body;

    if (!sender_id || !receiver_id || !message) {
      return res
        .status(400)
        .send({ success: false, msg: "Faltan datos requeridos" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(sender_id) ||
      !mongoose.Types.ObjectId.isValid(receiver_id)
    ) {
      return res.status(400).send({ success: false, msg: "IDs inválidos" });
    }

    // Ignora el _id si es un valor temporal enviado desde el cliente (como "local-...")
    if (
      req.body._id &&
      typeof req.body._id === "string" &&
      req.body._id.startsWith("local-")
    ) {
      delete req.body._id;
    }

    const chat = new Chat({ sender_id, receiver_id, message });
    const newChat = await chat.save();

    res
      .status(200)
      .send({ success: true, msg: "Chat guardado", data: newChat });
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};

const deleteChat = async (req, res) => {
  try {
    //console.log("Body recibido:", req.body); // Depuración clave
    const messageId = req.body.message_id;
    if (!messageId) {
      return res
        .status(400)
        .send({ success: false, msg: "ID de mensaje faltante" });
    }
    const result = await Chat.deleteOne({ _id: messageId });
    //console.log("Resultado de deleteOne:", result); // Depuración
    res.status(200).send({ success: true });
  } catch (error) {
    //console.error("Error en deleteChat:", error); // Depuración
    res.status(400).send({ success: false, msg: error.message });
  }
};

module.exports = {
  registerLoad,
  register,
  loadLogin,
  login,
  logout,
  loadDashboard,
  saveChat,
  deleteChat,
};
