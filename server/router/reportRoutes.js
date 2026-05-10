const express = require("express");
const router = express.Router();
const reportController = require("../controller/reportController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, reportController.getSalesReport);

module.exports = router;
