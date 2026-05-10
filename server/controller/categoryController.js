const Category = require("../model/category");

exports.createCategory = async (req, res) => {
    try {
        const { name, description, parent } = req.body;
        const category = await Category.create({ name, description, parent: parent || null });
        res.status(201).json({ status: "success", data: category });
    } catch (err) {
        res.status(400).json({ status: "fail", message: err.message });
    }
};


exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().populate("parent", "name");
        res.status(200).json({ status: "success", results: categories.length, data: categories });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!category) return res.status(404).json({ status: "fail", message: "Category not found" });
        res.status(200).json({ status: "success", data: category });
    } catch (err) {
        res.status(400).json({ status: "fail", message: err.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByIdAndDelete(id);
        if (!category) return res.status(404).json({ status: "fail", message: "Category not found" });


        await Category.updateMany({ parent: id }, { parent: null });

        res.status(204).json({ status: "success", data: null });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};
