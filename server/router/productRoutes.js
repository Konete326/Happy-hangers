const express = require("express");
const productController = require("../controller/productController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/")
    .get(productController.getAllProducts)
    .post(productController.createProduct);

router.get("/alerts", productController.getStockAlerts);
router.patch("/bulk/sale", productController.updateBulkSale);

router.route("/:id")
    .patch(productController.updateProduct)
    .delete(productController.deleteProduct);

router.post("/batch-delete", productController.deleteBulkProducts);


router.patch("/:id/stock", productController.updateStockLevel);

module.exports = router;
