const Product = require("../model/product");
const productService = require("../services/productService");
const notificationService = require("../services/notificationService");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createProduct = catchAsync(async (req, res, next) => {
    const { images, ...productData } = req.body;
    const uploadedImages = await productService.processImages(images);
    const product = await Product.create({ ...productData, images: uploadedImages });
    res.status(201).json({ status: "success", data: product });
});

exports.getAllProducts = catchAsync(async (req, res, next) => {
    const { page = 1, limit = 50, search, category, stockStatus } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { sku: { $regex: search, $options: "i" } },
            { barcode: { $regex: search, $options: "i" } }
        ];
    }
    if (category && category !== "all") query.category = category;

    if (stockStatus) {
        if (stockStatus === "out-of-stock") query.stock = 0;
        else if (stockStatus === "low-stock") query.$expr = { $lte: ["$stock", "$minStockLevel"] };
        else if (stockStatus === "in-stock") query.$expr = { $gt: ["$stock", "$minStockLevel"] };
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
        .populate("category", "name").populate("subCategory", "name")
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    res.status(200).json({ status: "success", total, page: Number(page), pages: Math.ceil(total / limit), data: products });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { images, ...updateData } = req.body;
    if (updateData.subCategory === "" || updateData.subCategory === undefined) updateData.subCategory = null;
    if (images) updateData.images = await productService.processImages(images);

    const product = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!product) return next(new AppError("Product not found", 404));

    const adminId = req.user.role === 'admin' ? req.user._id : req.user.adminId;
    if (adminId) {
        await notificationService.checkAndNotifyLowStock([product._id], adminId);
        await notificationService.resolveStockAlert(product._id, adminId);
    }
    res.status(200).json({ status: "success", data: product });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return next(new AppError("Product not found", 404));

    await notificationService.cleanupNotifications([req.params.id]);
    res.status(204).json({ status: "success", data: null });
});

exports.deleteBulkProducts = catchAsync(async (req, res, next) => {
    const { productIds } = req.body;
    const deletedCount = await productService.deleteBulkLogic(productIds);
    await notificationService.cleanupNotifications(productIds);
    res.status(200).json({ success: true, message: `Successfully deleted ${deletedCount} products.` });
});

exports.getStockAlerts = catchAsync(async (req, res, next) => {
    const outOfStock = await Product.find({ stock: 0 }).populate("category", "name").populate("subCategory", "name").sort({ name: 1 });
    const lowStock = await Product.find({
        $expr: { $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", "$minStockLevel"] }] }
    }).populate("category", "name").populate("subCategory", "name").sort({ stock: 1 });

    res.status(200).json({ success: true, data: { outOfStock, lowStock } });
});

exports.updateStockLevel = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { stock } = req.body;
    if (stock === undefined || stock < 0) return next(new AppError("Invalid stock value", 400));

    const product = await Product.findByIdAndUpdate(id, { stock }, { new: true });
    if (!product) return next(new AppError("Product not found", 404));

    const adminId = req.user.role === 'admin' ? req.user._id : req.user.adminId;
    if (adminId) {
        await notificationService.checkAndNotifyLowStock([product._id], adminId);
        await notificationService.resolveStockAlert(product._id, adminId);
    }
    res.status(200).json({ success: true, data: product });
});

exports.updateBulkSale = catchAsync(async (req, res, next) => {
    const { productIds, saleLabel, discountPercentage, onSale } = req.body;
    const updatedCount = await productService.updateBulkSaleLogic(productIds, saleLabel, discountPercentage, onSale);
    res.status(200).json({ success: true, message: `Successfully updated ${updatedCount} products.` });
});
