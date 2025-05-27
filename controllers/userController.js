const User = require("../models/userModel"); // Importa el modelo de usuario
const Chat = require("../models/chatModel"); // Importa el modelo de Chat
const bcrypt = require("bcrypt"); // Importa la librería bcrypt para encriptar contraseñas.

// Función para cargar y mostrar la página de registro.
const registerLoad = async (req, res) => {
    try {
        res.render("register"); // Renderiza el archivo 'register.ejs'.
    } catch (error) {
        console.log(error.message); // Si hay un error, lo muestra en la consola.
    }
}

// Función para manejar el envío del formulario de registro.
const register = async (req, res) => {
    try {
        const passwordHash = await bcrypt.hash(req.body.password, 10); // Encripta la contraseña.

        
        const imageFileName = req.file ? req.file.filename : ''; // Si hay un archivo, toma el nombre; de lo contrario, cadena vacía.

        const user = new User({ // Crea una nueva instancia del modelo User.
            name: req.body.name, // Toma el nombre del formulario.
            email: req.body.email, // Toma el correo electrónico del formulario.
            image: imageFileName, // Utiliza el nombre de archivo corregido (coincide con 'userModel.js').
            password: passwordHash, // Guarda la contraseña encriptada.
            is_online: "0" // Establece el estado inicial como offline.
        });

        await user.save(); // Guarda el nuevo usuario en la base de datos.

        res.render("register", { message: "Registro exitoso!" }); // Muestra un mensaje de éxito.
    } catch (error) {
       
    }
}

// Función para cargar y mostrar la página de inicio de sesión.
const loadLogin = async (req, res) => {
    try {
        res.render("login"); // Renderiza el archivo 'login.ejs'.
    } catch (error) {
        console.log(error.message); // Si hay un error, lo muestra en la consola.
    }
}

// Función para manejar el envío del formulario de inicio de sesión.
const login = async (req, res) => {
    try {
        const email = req.body.email; // Obtiene el correo electrónico.
        const password = req.body.password; // Obtiene la contraseña.

        const userData = await User.findOne({ email: email }); // Busca un usuario por correo electrónico.

        if (userData) { // Si se encuentra un usuario.
            const passwordMatch = await bcrypt.compare(password, userData.password); // Compara contraseñas.

            if (passwordMatch) { // Si las contraseñas coinciden.
                req.session.user_id = userData._id; // Guarda el ID del usuario en la sesión.
                req.session.user = userData; // Guarda el objeto user completo en la sesión para acceso en las vistas.
                res.redirect("/dashboard"); // Redirige al dashboard.
            } else { // Si las contraseñas no coinciden.
                res.render("login", { message: "Contraseña incorrecta" }); // Muestra un mensaje de error.
            }
        } else { // Si no se encuentra el usuario.
            res.render("login", { message: "Correo electrónico no encontrado" }); // Muestra un mensaje de error.
        }
    } catch (error) {
        console.log(error.message); // Si hay un error, lo muestra en la consola.
        res.render("login", { message: "Ocurrió un error al iniciar sesión" }); // Muestra un mensaje de error genérico.
    }
}

// Función para cerrar la sesión del usuario.
const logout = async (req, res) => {
    try {
        if (req.session.user_id) { // Verifica si hay un ID de usuario en la sesión.
            // Opcional: Actualiza el estado is_online a '0' en la base de datos al cerrar sesión.
            await User.findByIdAndUpdate({ _id: req.session.user_id }, { $set: { is_online: "0" } });
        }
        req.session.destroy(); // Elimina la información del usuario de la sesión.
        res.redirect("/"); // Redirige a la página principal.
    } catch (error) {
        console.log(error.message); // Si hay un error, lo muestra en la consola.
    }
}

// Función para cargar y mostrar la página del panel de control (dashboard).
const loadDashboard = async (req, res) => {
    try {
        // Asegúrate de que el ID del usuario está disponible en la sesión.
        if (!req.session.user_id) {
            return res.redirect('/login'); // Redirige si no hay sesión.
        }

        // Obtener los datos del usuario logueado de la base de datos para asegurar que estén actualizados.
        const loggedInUser = await User.findById(req.session.user_id);
        
        if (!loggedInUser) {
            // Si por alguna razón el usuario no se encuentra en la DB, cierra la sesión y redirige.
            req.session.destroy();
            return res.redirect('/login');
        }

        // Obtener todos los demás usuarios (excluyendo al usuario logueado).
        var users = await User.find({ _id: { $nin: [loggedInUser._id] } });

        // Pasa el objeto user (con los datos frescos de la BD) y la lista de usuarios.
        res.render("dashboard", { user: loggedInUser, users: users }); // Renderiza el 'dashboard.ejs'.
    } catch (error) {
        console.log(error.message); // Si hay un error, lo muestra en la consola.
        res.status(500).send('Error interno del servidor al cargar el dashboard.'); // Mensaje de error más específico.
    }
}

const saveChat = async(req,res) => {
    try {
        var chat = new Chat ({ // Crea una nueva instancia del modelo Chat.
            sender_id:req.body.sender_id, // Toma el ID del remitente.
            receiver_id:req.body.receiver_id, // Toma el ID del receptor.
            message:req.body.message, // Toma el mensaje.
        });

        var newChat = await chat.save(); // Guarda el nuevo chat.
        res.status(200).send({ success: true, msg:"Chat guardado", data:newChat}); // Envía una respuesta de éxito.

    } catch (error) {
        res.status(400).send({ success: false, msg:error.message}); // Envía una respuesta de error.
    }
}

// Exporta las funciones para que puedan ser utilizadas en otros archivos.
module.exports = {
    registerLoad,
    register,
    loadLogin,
    login,
    logout,
    loadDashboard,
    saveChat
}