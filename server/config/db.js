const mongoose = require("mongoose");
require("dotenv").config();
const getEnv = require("../utils/envWrapper");

let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }
    if (!cached.promise) {
        cached.promise = mongoose.connect(getEnv("MONGO_URI"), {
            family: 4,
            bufferCommands: false
        }).then((m) => {
            console.log("MongoDB Connected...");
            return m;
        });
    }
    try {
        cached.conn = await cached.promise;
    } catch (err) {
        cached.promise = null;
        console.error("Database connection error:", err.message);
        throw err;
    }
    return cached.conn;
};

module.exports = connectDB;
