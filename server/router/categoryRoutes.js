const express = require("express");
const categoryController = require("../controller/categoryController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/")
    .get(categoryController.getAllCategories)
    .post(categoryController.createCategory);

router.route("/:id")
    .patch(categoryController.updateCategory)
    .delete(categoryController.deleteCategory);

module.exports = router;
