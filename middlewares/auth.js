const isLogin = async (req, res, next) => {
    try {
        if (req.session.user) {
            next();
        } else {
            // Si es una petición AJAX, responde con JSON
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(401).json({ success: false, msg: "Sesión expirada. Por favor inicia sesión de nuevo." });
            }
            // Si es una petición normal, redirige
            return res.redirect("/");
        }
    } catch (error) {
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(401).json({ success: false, msg: "Sesión expirada. Por favor inicia sesión de nuevo." });
        }
        return res.redirect("/");
    }
};



const isLogout = async (req, res, next) => {
    try {
        // Verifica si existe la propiedad 'user' dentro del objeto 'session' en la petición (req).
        // La existencia de 'req.session.user' generalmente indica que un usuario ha iniciado sesión.
        if (req.session.user) {
            // Si la condición anterior es verdadera (el usuario ha iniciado sesión),
            // redirige al usuario a la ruta '/dashboard'. Esto se usa para evitar que
            // usuarios logueados accedan a páginas de registro o inicio de sesión.
            return res.redirect("/dashboard"); // Si hay usuario en la sesión, redirige y DETIENE la ejecución.
        }
        // Si la condición anterior es falsa (el usuario NO ha iniciado sesión),
        // llama a la función 'next()' para pasar el control al siguiente middleware
        // o al controlador de la ruta (generalmente las páginas de registro o inicio de sesión).
        next(); // Si no hay usuario, permite el acceso a la ruta (registro/login).
    } catch (error) {
        // Este bloque 'catch' captura cualquier error que pueda ocurrir dentro del bloque 'try'.
        // 'console.log(error.message)' muestra el mensaje del error en la consola del servidor.
        console.log(error.message);
        // Este comentario sugiere una mejora en el manejo de errores: se podría renderizar
        // una página de error en lugar de simplemente continuar con 'next()', dependiendo
        // de la lógica de la aplicación.
        // Considera renderizar una página de error aquí en lugar de solo loguear.
        next(); // En caso de error, permite continuar (quizás mostrar un error genérico en la página).
    }
}

// Exporta un objeto que contiene las dos funciones middleware ('isLogin' y 'isLogout')
// para que puedan ser utilizadas en otros archivos de la aplicación (generalmente en los archivos de rutas).
module.exports = {
    isLogin,
    isLogout
}