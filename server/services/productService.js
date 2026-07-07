const Product = require("../model/product");
const { uploadImage } = require("../utils/cloudinary");

const processImages = async (images) => {
    if (!images || images.length === 0) return [];
    
    const uploadedImages = [];
    for (const img of images) {
        if (img.startsWith("data:image")) {
            const uploadRes = await uploadImage(img);
            uploadedImages.push(uploadRes.secure_url);
        } else {
            uploadedImages.push(img);
        }
    }
    return uploadedImages;
};

const updateBulkSaleLogic = async (productIds, saleLabel, discountPercentage, onSale, adminId) => {
    const query = productIds && productIds.length > 0 ? { _id: { $in: productIds }, adminId } : { adminId };
    const products = await Product.find(query);

    const updates = products.map(p => {
        let updateItems = { onSale, saleLabel };
        if (onSale) {
            const discountAmount = p.price * (Number(discountPercentage) / 100);
            updateItems.discountPrice = Math.max(0, Math.round(p.price - discountAmount));
        } else {
            updateItems.discountPrice = 0;
        }
        return Product.updateOne({ _id: p._id, adminId }, { $set: updateItems });
    });

    await Promise.all(updates);
    return products.length;
};

const deleteBulkLogic = async (productIds, adminId) => {
    if (!productIds || productIds.length === 0) return 0;
    const result = await Product.updateMany(
        { _id: { $in: productIds }, adminId },
        { $set: { isActive: false } }
    );
    return result.modifiedCount;
};

module.exports = {
    processImages,
    updateBulkSaleLogic,
    deleteBulkLogic
};
