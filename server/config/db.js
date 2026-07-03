const mongoose = require("mongoose");
require("dotenv").config();
const getEnv = require("../utils/envWrapper");

const connectDB = async () => {
    try {
        await mongoose.connect(getEnv("MONGO_URI"), {
            family: 4, // Force IPv4
        });
        console.log("MongoDB Connected...");
    } catch (err) {
        console.error("Database connection error:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
