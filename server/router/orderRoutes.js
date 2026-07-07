const express = require("express");
const router = express.Router();
const { createOrder, getOrders } = require("../controller/orderController");
const { protect, restrictToPermission } = require("../middleware/authMiddleware");

router.use(protect);
router.post("/", restrictToPermission("pos"), createOrder);
router.get("/", restrictToPermission("orders"), getOrders);

module.exports = router;
