const Order = require("../model/order");
const Return = require("../model/return");
const Product = require("../model/product");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");

exports.processReturn = catchAsync(async (req, res, next) => {
    const { orderId, items, refundAmount, reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return next(new AppError("Order not found", 404));

    for (const returnItem of items) {
        const orderItem = order.items.find(i => i.product.toString() === returnItem.product);
        if (!orderItem) return next(new AppError(`Product ${returnItem.name} not found in order`, 400));

        const availableToReturn = orderItem.qty - orderItem.returnedQty;
        if (returnItem.qty > availableToReturn) {
            return next(new AppError(`Cannot return more than purchased for ${returnItem.name}`, 400));
        }

        orderItem.returnedQty += returnItem.qty;
    }

    const allReturned = order.items.every(i => i.qty === i.returnedQty);
    order.status = allReturned ? "Returned" : "Partially Returned";
    await order.save();

    const stockOps = items.map(item => ({
        updateOne: {
            filter: { _id: item.product },
            update: { $inc: { stock: item.qty } }
        }
    }));
    await Product.bulkWrite(stockOps);

    const returnRecord = await Return.create({
        order: orderId,
        items,
        refundAmount,
        reason,
        processedBy: req.user._id
    });

    res.status(201).json({ status: "success", data: returnRecord });
});

exports.getReturnHistory = catchAsync(async (req, res, next) => {
    const returns = await Return.find()
        .populate("order", "status createdAt invoiceNo")
        .populate("processedBy", "name")
        .sort({ createdAt: -1 });
    res.status(200).json({ status: "success", data: returns });
});

exports.getOrderByInvoice = catchAsync(async (req, res, next) => {
    let id = req.params.id.trim();
    if (id.startsWith("#")) id = id.substring(1);

    let order;

    if (mongoose.Types.ObjectId.isValid(id)) {
        order = await Order.findById(id);
    } else {
        order = await Order.findOne({
            $or: [
                { invoiceNo: id },
                { invoiceNo: id.toUpperCase() },
                { $expr: { $eq: [{ $toUpper: { $substrCP: [{ $toString: "$_id" }, 18, 6] } }, id.toUpperCase()] } }
            ]
        });
    }

    if (!order) return next(new AppError("Order not found. Please check the ID (e.g. ED4428 or INV-...) and try again.", 404));

    await order.populate([
        { path: "cashier", select: "name" },
        { path: "items.product", select: "name sku stock images" }
    ]);

    res.status(200).json({ status: "success", data: order });
});
