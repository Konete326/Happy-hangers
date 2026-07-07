const express = require("express");
const categoryController = require("../controller/categoryController");
const { protect, restrictToPermission } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/")
    .get(categoryController.getAllCategories)
    .post(restrictToPermission("inventory"), categoryController.createCategory);

router.route("/:id")
    .patch(restrictToPermission("inventory"), categoryController.updateCategory)
    .delete(restrictToPermission("inventory"), categoryController.deleteCategory);

module.exports = router;
