const Order = require("../model/order");
const mongoose = require("mongoose");
const { startOfDay, endOfDay, subDays, startOfMonth, format } = require("date-fns");

exports.getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};

        if (startDate && endDate) {
            dateFilter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else {
            const sevenDaysAgo = subDays(new Date(), 7);
            dateFilter.createdAt = { $gte: sevenDaysAgo };
        }

        const summary = await Order.aggregate([
            { $match: dateFilter },
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
            { $match: dateFilter },
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
            { $match: dateFilter },
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
            { $match: dateFilter },
            {
                $group: {
                    _id: "$paymentMethod",
                    revenue: { $sum: "$grandTotal" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const timeline = await Order.aggregate([
            { $match: dateFilter },
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
