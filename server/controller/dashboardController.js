const Order = require("../model/order");
const Product = require("../model/product");

exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalProducts,
            lowStockProducts,
            outOfStockProducts,
            totalOrders,
            todayOrders,
            allOrders,
            allProducts
        ] = await Promise.all([
            Product.countDocuments(),
            Product.countDocuments({ $expr: { $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", "$minStockLevel"] }] } }),
            Product.countDocuments({ stock: 0 }),
            Order.countDocuments(),
            Order.find({ createdAt: { $gte: today } }),
            Order.find().sort({ createdAt: 1 }),
            Product.find({}, "name stock minStockLevel").sort({ stock: 1 }).limit(5)
        ]);

        const todayRevenue = todayOrders.reduce((s, o) => s + o.grandTotal, 0);
        const totalRevenue = allOrders.reduce((s, o) => s + o.grandTotal, 0);

        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - i);
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            const dayOrders = allOrders.filter(o => new Date(o.createdAt) >= d && new Date(o.createdAt) < next);
            last7Days.push({
                day: d.toLocaleDateString("en-US", { weekday: "short" }),
                revenue: dayOrders.reduce((s, o) => s + o.grandTotal, 0),
                orders: dayOrders.length
            });
        }

        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setDate(1);
            d.setHours(0, 0, 0, 0);
            d.setMonth(d.getMonth() - i);
            const next = new Date(d);
            next.setMonth(next.getMonth() + 1);
            const monthOrders = allOrders.filter(o => new Date(o.createdAt) >= d && new Date(o.createdAt) < next);
            last6Months.push({
                month: d.toLocaleDateString("en-US", { month: "short" }),
                revenue: monthOrders.reduce((s, o) => s + o.grandTotal, 0),
                orders: monthOrders.length
            });
        }

        const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);

        res.status(200).json({
            success: true,
            data: {
                stats: { totalProducts, lowStockProducts, outOfStockProducts, totalOrders, todayRevenue, totalRevenue },
                last7Days,
                last6Months,
                lowStockItems: allProducts,
                recentOrders
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch dashboard data" });
    }
};
