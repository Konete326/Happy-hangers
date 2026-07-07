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
    subCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null,
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
        validate: {
            validator: function (val) {
                // If it's a new product or price is being updated, we check against price
                // But we allow it if the user explicitly wants to sell (clearance)
                return true; // We will handle business logic in controller for better UX
            },
            message: "Cost price validation error"
        }
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
    },
    onSale: {
        type: Boolean,
        default: false,
    },
    discountPrice: {
        type: Number,
        default: 0,
    },
    saleLabel: {
        type: String,
        trim: true,
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
}, { timestamps: true });

productSchema.index({ name: "text", sku: "text", barcode: "text" });
productSchema.index({ category: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ adminId: 1 });

module.exports = mongoose.model("Product", productSchema);
