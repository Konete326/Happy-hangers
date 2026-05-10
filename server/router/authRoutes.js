const express = require("express");
const authController = require("../controller/authController");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.patch("/update-profile", protect, authController.updateProfile);

module.exports = router;
