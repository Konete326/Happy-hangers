const jwt = require("jsonwebtoken");
const getEnv = require("../utils/envWrapper");

const signToken = (id) => {
    if (!getEnv("JWT_SECRET")) {
        throw new Error("CRITICAL: JWT_SECRET is not defined in environment variables.");
    }
    return jwt.sign({ id }, getEnv("JWT_SECRET"), {
        expiresIn: "30d",
    });
};

const formatUserResponse = (user) => {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        brandName: user.brandName,
        brandLogo: user.brandLogo,
        phoneNumber: user.phoneNumber,
        permissions: user.permissions,
        dataVisibility: user.dataVisibility
    };
};

module.exports = { signToken, formatUserResponse };
