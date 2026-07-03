const jwt = require("jsonwebtoken");
const User = require("../model/user");
const getEnv = require("../utils/envWrapper");

exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ status: "fail", message: "Not logged in" });
        }

        const decoded = jwt.verify(token, getEnv("JWT_SECRET"));
        const currentUser = await User.findById(decoded.id);

        if (!currentUser) {
            return res.status(401).json({ status: "fail", message: "User no longer exists" });
        }

        req.user = currentUser;
        next();
    } catch (err) {
        res.status(401).json({ status: "fail", message: "Invalid token" });
    }
};
