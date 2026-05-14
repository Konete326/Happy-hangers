const express = require("express");
const router = express.Router();
const employeeController = require("../controller/employeeController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/", employeeController.addEmployee);
router.get("/", employeeController.getEmployees);
router.put("/:id", employeeController.updateEmployee);
router.delete("/:id", employeeController.deleteEmployee);

module.exports = router;
