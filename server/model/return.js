const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            price: { type: Number, required: true },
            subtotal: { type: Number, required: true }
        }
    ],
    refundAmount: { type: Number, required: true },
    reason: { type: String },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model("Return", returnSchema);
