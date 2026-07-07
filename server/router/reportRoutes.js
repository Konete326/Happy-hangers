const express = require("express");
const router = express.Router();
const reportController = require("../controller/reportController");
const { protect, restrictToPermission } = require("../middleware/authMiddleware");

router.get("/sales", protect, restrictToPermission("reports"), reportController.getSalesReport);

module.exports = router;
