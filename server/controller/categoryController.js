const Category = require("../model/category");
const Product = require("../model/product");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createCategory = catchAsync(async (req, res, next) => {
    const { name, description, parent } = req.body;
    const category = await Category.create({ name, description, parent: parent || null });
    res.status(201).json({ status: "success", data: category });
});

exports.getAllCategories = catchAsync(async (req, res, next) => {
    const categories = await Category.find().populate("parent", "name");
    res.status(200).json({ status: "success", results: categories.length, data: categories });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const category = await Category.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!category) return next(new AppError("Category not found", 404));
    res.status(200).json({ status: "success", data: category });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const productCount = await Product.countDocuments({
        $or: [{ category: id }, { subCategory: id }]
    });

    if (productCount > 0) {
        return next(new AppError(`This category is assigned to ${productCount} products. Please reassign them before deleting.`, 400));
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) return next(new AppError("Category not found", 404));

    await Category.updateMany({ parent: id }, { parent: null });
    res.status(200).json({ status: "success", message: "Category deleted successfully" });
});
