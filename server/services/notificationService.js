const Notification = require("../model/notification");
const Product = require("../model/product");

exports.checkAndNotifyLowStock = async (productIds, adminId) => {
    try {
        if (!adminId) return;

        const products = await Product.find({
            _id: { $in: productIds },
            $expr: { $lte: ["$stock", "$minStockLevel"] }
        });

        for (const product of products) {
            const existing = await Notification.findOne({
                product: product._id,
                isRead: false,
                adminId
            });

            if (!existing) {
                await Notification.create({
                    title: "Low Stock Alert",
                    message: `${product.name} is low on stock (${product.stock} remaining).`,
                    product: product._id,
                    adminId,
                    type: "low-stock"
                });
            }
        }
    } catch (err) {
        console.error("Notification Service Error:", err);
    }
};

exports.resolveStockAlert = async (productId, adminId) => {
    try {
        if (!adminId) return;
        const product = await Product.findById(productId);
        if (product && product.stock > product.minStockLevel) {
            await Notification.updateMany(
                { product: productId, adminId, isRead: false },
                { isRead: true }
            );
        }
    } catch (err) {
        console.error("Auto-Resolve Error:", err);
    }
};

exports.cleanupNotifications = async (productIds) => {
    try {
        await Notification.deleteMany({ product: { $in: productIds } });
    } catch (err) {
        console.error("Cleanup Notification Error:", err);
    }
};
