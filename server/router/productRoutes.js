const express = require("express");
const productController = require("../controller/productController");
const { protect, restrictToPermission } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/minimal", productController.getMinimalProducts);
router.get("/alerts", restrictToPermission("inventory"), productController.getStockAlerts);
router.patch("/bulk/sale", restrictToPermission("inventory"), productController.updateBulkSale);
router.post("/batch-delete", restrictToPermission("inventory"), productController.deleteBulkProducts);

router.route("/")
    .get(productController.getAllProducts)
    .post(restrictToPermission("inventory"), productController.createProduct);

router.route("/:id")
    .patch(restrictToPermission("inventory"), productController.updateProduct)
    .delete(restrictToPermission("inventory"), productController.deleteProduct);

router.patch("/:id/stock", restrictToPermission("inventory"), productController.updateStockLevel);

module.exports = router;
