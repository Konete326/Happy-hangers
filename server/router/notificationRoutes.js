const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markAsRead);
router.delete("/clear", notificationController.clearAll);
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
