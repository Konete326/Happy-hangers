const Order = require("../model/order");
const Product = require("../model/product");
const catchAsync = require("../utils/catchAsync");
const mongoose = require("mongoose");

exports.getDashboardStats = catchAsync(async (req, res, next) => {
    const { cashierId } = req.query;
    let filter = {};
    if (req.user.role === "employee" && req.user.dataVisibility === "own") {
        filter.cashier = req.user._id;
    } else if (cashierId && cashierId !== "all") {
        filter.cashier = new mongoose.Types.ObjectId(cashierId);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [counts, revenueStats, chartData7Days, chartData6Months, recentOrders] = await Promise.all([
        Promise.all([
            Product.countDocuments(),
            Product.countDocuments({ $expr: { $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", "$minStockLevel"] }] } }),
            Product.countDocuments({ stock: 0 }),
            Order.countDocuments(filter)
        ]),
        Order.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$grandTotal" },
                    todayRevenue: { $sum: { $cond: [{ $gte: ["$createdAt", today] }, "$grandTotal", 0] } }
                }
            }
        ]),
        Order.aggregate([
            { $match: { ...filter, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$grandTotal" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        Order.aggregate([
            { $match: { ...filter, createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    revenue: { $sum: "$grandTotal" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        Order.find(filter).populate("cashier", "name").sort({ createdAt: -1 }).limit(5)
    ]);

    const lowStockItems = await Product.find({}, "name stock minStockLevel").sort({ stock: 1 }).limit(5);

    res.status(200).json({
        success: true,
        data: {
            stats: {
                totalProducts: counts[0],
                lowStockProducts: counts[1],
                outOfStockProducts: counts[2],
                totalOrders: counts[3],
                totalRevenue: revenueStats[0]?.totalRevenue || 0,
                todayRevenue: revenueStats[0]?.todayRevenue || 0
            },
            last7Days: chartData7Days.map(d => ({ day: d._id, revenue: d.revenue, orders: d.orders })),
            last6Months: chartData6Months.map(m => ({ month: m._id, revenue: m.revenue, orders: m.orders })),
            lowStockItems,
            recentOrders
        }
    });
});
