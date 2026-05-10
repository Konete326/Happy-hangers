const Product = require("../model/product");
const { uploadImage } = require("../utils/cloudinary");

exports.createProduct = async (req, res) => {
    try {
        const { images, ...productData } = req.body;

        let uploadedImages = [];
        if (images && images.length > 0) {
            for (const img of images) {
                if (img.startsWith("data:image")) {
                    const uploadRes = await uploadImage(img);
                    uploadedImages.push(uploadRes.secure_url);
                } else {
                    uploadedImages.push(img);
                }
            }
        }

        const product = await Product.create({
            ...productData,
            images: uploadedImages
        });

        res.status(201).json({ status: "success", data: product });
    } catch (err) {
        res.status(400).json({ status: "fail", message: err.message });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().populate("category", "name");
        res.status(200).json({ status: "success", results: products.length, data: products });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { images, ...updateData } = req.body;

        let uploadedImages = [];
        if (images && images.length > 0) {
            for (const img of images) {
                if (img.startsWith("data:image")) {
                    const uploadRes = await uploadImage(img);
                    uploadedImages.push(uploadRes.secure_url);
                } else {
                    uploadedImages.push(img);
                }
            }
            updateData.images = uploadedImages;
        }

        const product = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!product) return res.status(404).json({ status: "fail", message: "Product not found" });

        res.status(200).json({ status: "success", data: product });
    } catch (err) {
        res.status(400).json({ status: "fail", message: err.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        if (!product) return res.status(404).json({ status: "fail", message: "Product not found" });
        res.status(204).json({ status: "success", data: null });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};
