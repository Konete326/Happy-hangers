const mongoose = require("mongoose");
const User = require("./model/user");
require("dotenv").config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        const adminEmail = "admin@gmail.com";
        const adminPassword = "admin@123";

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log("Admin user already exists.");
            process.exit(0);
        }

        // Create admin user
        await User.create({
            name: "Main Admin",
            email: adminEmail,
            password: adminPassword,
            role: "admin",
        });

        console.log("Admin user seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding error:", err.message);
        process.exit(1);
    }
};

seedAdmin();
