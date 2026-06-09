const Order = require("../model/order");
const User = require("../model/user");
const mongoose = require("mongoose");
const { subDays, startOfDay } = require("date-fns");

exports.getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, range } = req.query;
        let dateFilter = {};
        let cashierFilter = {};

        if (startDate && endDate) {
            dateFilter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else {
            let start = subDays(new Date(), 7);
            if (range === "today") start = startOfDay(new Date());
            else if (range === "30days") start = subDays(new Date(), 30);

            dateFilter.createdAt = { $gte: start };
        }

        if (req.user.role === "employee" && req.user.dataVisibility === "own") {
            cashierFilter.cashier = req.user._id;
        } else if (req.user.role === "admin") {
            const employees = await User.find({ adminId: req.user._id }).select("_id");
            cashierFilter.cashier = { $in: [req.user._id, ...employees.map(e => e._id)] };
        } else {
            const adminId = req.user.adminId;
            const peers = await User.find({ adminId }).select("_id");
            cashierFilter.cashier = { $in: [adminId, ...peers.map(e => e._id)] };
        }

        const matchStage = { ...dateFilter, ...cashierFilter };

        const summary = await Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$grandTotal" },
                    totalOrders: { $sum: 1 },
                    avgOrderValue: { $avg: "$grandTotal" }
                }
            }
        ]);

        const topProducts = await Order.aggregate([
            { $match: matchStage },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    name: { $first: "$items.name" },
                    sku: { $first: "$items.sku" },
                    totalQty: { $sum: "$items.qty" },
                    totalRevenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 10 }
        ]);

        const categorySales = await Order.aggregate([
            { $match: matchStage },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productDoc"
                }
            },
            { $unwind: "$productDoc" },
            {
                $lookup: {
                    from: "categories",
                    localField: "productDoc.category",
                    foreignField: "_id",
                    as: "categoryDoc"
                }
            },
            { $unwind: "$categoryDoc" },
            {
                $group: {
                    _id: "$categoryDoc.name",
                    revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
                    qty: { $sum: "$items.qty" }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        const paymentStats = await Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$paymentMethod",
                    revenue: { $sum: "$grandTotal" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const timeline = await Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$grandTotal" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                summary: summary[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 },
                topProducts,
                categorySales,
                paymentStats,
                timeline
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
