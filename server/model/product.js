const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    sku: {
        type: String,
        required: [true, "SKU is required"],
        unique: true,
        trim: true,
    },
    barcode: {
        type: String,
        unique: true,
        trim: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: [true, "Category is required"],
    },
    price: {
        type: Number,
        required: [true, "Sale price is required"],
        min: 0,
    },
    costPrice: {
        type: Number,
        required: [true, "Cost price is required"],
        min: 0,
    },
    stock: {
        type: Number,
        required: [true, "Stock quantity is required"],
        default: 0,
    },
    minStockLevel: {
        type: Number,
        default: 5,
    },
    images: [{
        type: String,
    }],
    isActive: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

productSchema.index({ name: "text", sku: "text", barcode: "text" });

module.exports = mongoose.model("Product", productSchema);
