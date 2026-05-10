const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            qty: { type: Number, required: true }
        }
    ],
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMethod: { type: String, required: true, enum: ["Cash", "Card"] },
    amountRendered: { type: Number, default: 0 },
    changeReturned: { type: Number, default: 0 }
}, {
    timestamps: true
});

module.exports = mongoose.model("Order", orderSchema);
