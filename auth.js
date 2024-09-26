const jwt = require("jsonwebtoken");
const JWT_SECRET = "mySuperSecretJWT@123%!(*";

function auth(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(403).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid token" });
    }
}

module.exports = {
    auth,
    JWT_SECRET
};
