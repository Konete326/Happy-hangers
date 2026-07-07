const express = require("express");
const router = express.Router();
const employeeController = require("../controller/employeeController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

router.use(protect);
router.use(restrictTo("admin"));

router.post("/", employeeController.addEmployee);
router.get("/", employeeController.getEmployees);
router.put("/:id", employeeController.updateEmployee);
router.delete("/:id", employeeController.deleteEmployee);

module.exports = router;
