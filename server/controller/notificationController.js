const Notification = require("../model/notification");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getNotifications = catchAsync(async (req, res, next) => {
    const adminId = req.user.role === 'admin' ? req.user._id : req.user.adminId;
    const notifications = await Notification.find({ adminId })
        .populate("product", "name sku stock")
        .sort({ createdAt: -1 })
        .limit(20);

    res.status(200).json({ status: "success", data: notifications });
});

exports.markAsRead = catchAsync(async (req, res, next) => {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    if (!notification) return next(new AppError("Notification not found", 404));
    res.status(200).json({ status: "success", message: "Marked as read" });
});

exports.deleteNotification = catchAsync(async (req, res, next) => {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return next(new AppError("Notification not found", 404));
    res.status(200).json({ status: "success", message: "Deleted" });
});

exports.clearAll = catchAsync(async (req, res, next) => {
    const adminId = req.user.role === 'admin' ? req.user._id : req.user.adminId;
    await Notification.deleteMany({ adminId });
    res.status(200).json({ status: "success", message: "All cleared" });
});
