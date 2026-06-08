const express = require("express");
const router = express.Router();
const returnController = require("../controller/returnController");
const { protect } = require("../middleware/authMiddleware");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

router.use(protect);

router.get("/order/:id", returnController.getOrderByInvoice);
router.get("/order", catchAsync(async (req, res, next) => {
    return next(new AppError("Order ID is required", 400));
}));
router.post("/", returnController.processReturn);

router.get("/history", returnController.getReturnHistory);

module.exports = router;
