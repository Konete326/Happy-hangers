const express = require("express");
const productController = require("../controller/productController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/")
    .get(productController.getAllProducts)
    .post(productController.createProduct);

router.route("/:id")
    .patch(productController.updateProduct)
    .delete(productController.deleteProduct);

module.exports = router;
