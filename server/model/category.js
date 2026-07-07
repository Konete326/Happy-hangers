const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Category name is required"],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
}, { timestamps: true });

categorySchema.index({ parent: 1 });
categorySchema.index({ adminId: 1 });
categorySchema.index({ name: 1, adminId: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);
