const Order = require("../model/order");
const Product = require("../model/product");

exports.createOrder = async (req, res) => {
    try {
        const { items, subtotal, tax, discount, grandTotal, paymentMethod, amountRendered, changeReturned } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Order items are required" });
        }

        const order = await Order.create({
            items,
            subtotal,
            tax,
            discount,
            grandTotal,
            paymentMethod,
            amountRendered,
            changeReturned,
            cashier: req.user._id
        });

        for (const item of items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.qty }
            });
        }

        res.status(201).json({ success: true, data: order });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error processing the order" });
    }
};

exports.getOrders = async (req, res) => {
    try {
        let filter = {};

        // Data Visibility Logic
        if (req.user.role === "employee" && req.user.dataVisibility === "own") {
            filter.cashier = req.user._id;
        } else if (req.user.role === "employee") {
            // Employee can see all data of their admin's brand
            filter.cashier = { $in: await getRelatedUserIds(req.user.adminId) };
        } else if (req.user.role === "admin") {
            // Admin sees everything related to them and their employees
            const relatedIds = await getRelatedUserIds(req.user._id);
            filter.cashier = { $in: relatedIds };
        }

        const orders = await Order.find(filter)
            .populate("items.product", "sku")
            .populate("cashier", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("Fetch orders error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
};

// Helper function to get all user IDs associated with an admin
const getRelatedUserIds = async (adminId) => {
    const User = require("../model/user");
    const employees = await User.find({ adminId: adminId }).select("_id");
    return [adminId, ...employees.map(emp => emp._id)];
};
