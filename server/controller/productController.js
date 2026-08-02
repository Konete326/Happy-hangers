const Product = require("../model/product");
const productService = require("../services/productService");
const notificationService = require("../services/notificationService");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const getAdminId = (req) => req.user.role === "admin" ? req.user._id : req.user.adminId;

exports.createProduct = catchAsync(async (req, res, next) => {
    const adminId = getAdminId(req);
    const { images, ...productData } = req.body;
    if (!productData.barcode) productData.barcode = null;
    const uploadedImages = await productService.processImages(images);
    const product = await Product.create({ ...productData, images: uploadedImages, adminId });
    res.status(201).json({ status: "success", data: product });
});

exports.getAllProducts = catchAsync(async (req, res, next) => {
    const adminId = getAdminId(req);
    const { page = 1, limit = 25, search, category, stockStatus } = req.query;
    const skip = (page - 1) * limit;

    let query = { adminId, isActive: { $ne: false } };
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
        else if (stockStatus === "on-sale") query.onSale = true;
    }

    const [total, products, summaryStats] = await Promise.all([
        Product.countDocuments(query),
        Product.find(query).populate("category", "name").populate("subCategory", "name").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
        Product.aggregate([
            { $match: { adminId, isActive: { $ne: false } } },
            { $group: { _id: null, totalItems: { $sum: 1 }, outOfStock: { $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] } }, lowStock: { $sum: { $cond: [{ $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", { $ifNull: ["$minStockLevel", 5] }] }] }, 1, 0] } }, onSale: { $sum: { $cond: [{ $eq: ["$onSale", true] }, 1, 0] } } } }
        ])
    ]);

    const stats = summaryStats[0] || { totalItems: total, outOfStock: 0, lowStock: 0, onSale: 0 };
    res.status(200).json({ status: "success", total, page: Number(page), pages: Math.ceil(total / limit), stats, data: products });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
    const adminId = getAdminId(req);
    const { id } = req.params;
    const { images, ...updateData } = req.body;
    if (!updateData.subCategory) updateData.subCategory = null;
    if (!updateData.barcode) updateData.barcode = null;
    if (images) updateData.images = await productService.processImages(images);

    const product = await Product.findOneAndUpdate({ _id: id, adminId, isActive: { $ne: false } }, updateData, { new: true, runValidators: true });
    if (!product) return next(new AppError("Product not found", 404));

    await notificationService.checkAndNotifyLowStock([product._id], adminId);
    await notificationService.resolveStockAlert(product._id, adminId);
    res.status(200).json({ status: "success", data: product });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
    const adminId = getAdminId(req);
    const product = await Product.findOneAndUpdate({ _id: req.params.id, adminId, isActive: { $ne: false } }, { $set: { isActive: false } }, { new: true });
    if (!product) return next(new AppError("Product not found", 404));
    await notificationService.cleanupNotifications([req.params.id]);
    res.status(200).json({ status: "success", data: null });
});

exports.deleteBulkProducts = catchAsync(async (req, res, next) => {
    const adminId = getAdminId(req);
    const { productIds } = req.body;
    const deletedCount = await productService.deleteBulkLogic(productIds, adminId);
    await notificationService.cleanupNotifications(productIds);
    res.status(200).json({ success: true, message: `Successfully deleted ${deletedCount} products.` });
});

exports.getStockAlerts = catchAsync(async (req, res, next) => {
    const adminId = getAdminId(req);
    const outOfStock = await Product.find({ adminId, stock: 0, isActive: { $ne: false } }).populate("category", "name").populate("subCategory", "name").sort({ name: 1 }).lean();
    const lowStock = await Product.find({ adminId, isActive: { $ne: false }, $expr: { $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", "$minStockLevel"] }] } }).populate("category", "name").populate("subCategory", "name").sort({ stock: 1 }).lean();
    res.status(200).json({ success: true, data: { outOfStock, lowStock } });
});

exports.updateStockLevel = catchAsync(async (req, res, next) => {
    const adminId = getAdminId(req);
    const { id } = req.params;
    const { stock } = req.body;
    if (stock === undefined || stock < 0) return next(new AppError("Invalid stock value", 400));
    const product = await Product.findOneAndUpdate({ _id: id, adminId, isActive: { $ne: false } }, { stock }, { new: true });
    if (!product) return next(new AppError("Product not found", 404));
    await notificationService.checkAndNotifyLowStock([product._id], adminId);
    await notificationService.resolveStockAlert(product._id, adminId);
    res.status(200).json({ success: true, data: product });
});

exports.updateBulkSale = catchAsync(async (req, res, next) => {
    const adminId = getAdminId(req);
    const { productIds, saleLabel, discountPercentage, onSale } = req.body;
    const updatedCount = await productService.updateBulkSaleLogic(productIds, saleLabel, discountPercentage, onSale, adminId);
    res.status(200).json({ success: true, message: `Successfully updated ${updatedCount} products.` });
});

exports.getMinimalProducts = catchAsync(async (req, res, next) => {
    const adminId = getAdminId(req);
    const products = await Product.find(
        { adminId, isActive: { $ne: false } },
        "name sku barcode price stock minStockLevel discountPrice onSale category saleLabel images"
    ).sort({ name: 1 }).lean();

    const sanitizedProducts = products.map(p => ({
        ...p,
        images: Array.isArray(p.images) && p.images.length > 0 ? [p.images[0]] : []
    }));

    res.status(200).json({ status: "success", data: sanitizedProducts });
});
