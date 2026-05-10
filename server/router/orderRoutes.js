const express = require("express");
const router = express.Router();
const { createOrder, getOrders } = require("../controller/orderController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.post("/", createOrder);
router.get("/", getOrders);

module.exports = router;
