const isLogin = async (req, res, next) => {
    try {
        if (req.session.user) {
            next();
        } else {
            if (req.xhr || req.headers.accept.indexOf("json") > -1) {
                return res.status(401).json({ success: false, msg: "Sesión expirada." });
            }
            return res.redirect("/");
        }
    } catch (error) {
        console.log(error.message);
        return req.xhr || req.headers.accept.indexOf("json") > -1
            ? res.status(401).json({ success: false, msg: "Error de sesión." })
            : res.redirect("/");
    }
};

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user) {
            return res.redirect("/dashboard");
        }
        next();
    } catch (error) {
        console.log(error.message);
        next();
    }
};

module.exports = { isLogin, isLogout };
