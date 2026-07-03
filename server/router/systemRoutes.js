const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");

const Product = require("../model/product");
const Category = require("../model/category");
const Order = require("../model/order");
const Return = require("../model/return");
const User = require("../model/user");

router.post("/reset-data", protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ status: "fail", message: "Forbidden: Admin access required" });
        }

        const { password, options } = req.body;
        if (!password || !options) {
            return res.status(400).json({ status: "fail", message: "Password and options are required" });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, req.user.password);
        if (!isMatch) {
            return res.status(401).json({ status: "fail", message: "Incorrect password" });
        }

        // Perform deletions
        if (options.products) await Product.deleteMany({});
        if (options.categories) await Category.deleteMany({});
        if (options.orders) {
            await Order.deleteMany({});
            await Return.deleteMany({});
        }
        if (options.employees) await User.deleteMany({ role: 'employee' });

        res.status(200).json({ status: "success", message: "System data reset successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "fail", message: "Server error during reset" });
    }
});

module.exports = router;
