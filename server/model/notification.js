const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    type: { type: String, enum: ["low-stock", "system"], default: "low-stock" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    isRead: { type: Boolean, default: false },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model("Notification", notificationSchema);
