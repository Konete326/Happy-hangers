const Order = require("../model/order");
const Product = require("../model/product");
const User = require("../model/user");
const notificationService = require("../services/notificationService");
const AppError = require("../utils/appError");

exports.createOrder = async (req, res, next) => {
    try {
        const { items, subtotal, tax, discount, grandTotal, paymentMethod, amountRendered, changeReturned } = req.body;
        if (!items || items.length === 0) return next(new AppError("Cart is empty", 400));

        const productIds = items.map(item => item.product);
        const stockOps = items.map(item => ({
            updateOne: {
                filter: { _id: item.product, stock: { $gte: item.qty } },
                update: { $inc: { stock: -item.qty } }
            }
        }));

        const bulkResult = await Product.bulkWrite(stockOps);
        if (bulkResult.modifiedCount !== items.length) {
            return next(new AppError("Inventory sync error. Some items may have gone out of stock.", 400));
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

        const adminId = req.user.role === "admin" ? req.user._id : req.user.adminId;
        if (adminId) {
            await notificationService.checkAndNotifyLowStock(productIds, adminId);
        }

        res.status(201).json({ success: true, data: order });
    } catch (err) {
        next(err);
    }
};

const catchAsync = require("../utils/catchAsync");

exports.getOrders = catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.user.role === "employee" && req.user.dataVisibility === "own") {
        filter.cashier = req.user._id;
    } else if (req.user.role === "admin") {
        const employees = await User.find({ adminId: req.user._id }).select("_id");
        filter.cashier = { $in: [req.user._id, ...employees.map(e => e._id)] };
    } else {
        const adminId = req.user.adminId;
        const peers = await User.find({ adminId }).select("_id");
        filter.cashier = { $in: [adminId, ...peers.map(e => e._id)] };
    }

    const orders = await Order.find(filter)
        .populate("items.product", "sku")
        .populate("cashier", "name")
        .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
});
