const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    invoiceNo: { type: String, unique: true },
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
            name: { type: String, required: true },
            sku: { type: String },
            price: { type: Number, required: true },
            qty: { type: Number, required: true },
            returnedQty: { type: Number, default: 0 }
        }
    ],
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    status: { type: String, enum: ["Completed", "Partially Returned", "Returned"], default: "Completed" },
    paymentMethod: { type: String, required: true, enum: ["Cash", "Card"] },
    amountRendered: { type: Number, default: 0 },
    changeReturned: { type: Number, default: 0 },
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, {
    timestamps: true
});

orderSchema.pre("save", async function () {
    if (!this.invoiceNo) {
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.invoiceNo = `INV-${dateStr}-${randomStr}`;
    }
});

module.exports = mongoose.model("Order", orderSchema);
