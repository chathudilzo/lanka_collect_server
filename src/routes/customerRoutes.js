const express = require("express");
const router = express.Router();
const upload = require("../middlewares/uploadMiddleware");
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  getCustomerByNIC,
  createCustomer,
  checkCustomerStatus,
  getBranchCustomers,
  getCustomer360,
} = require("../controllers/customerController");

router.get("/search/:nic", protect, getCustomerByNIC);

//router.post("/", protect, createCustomer);

router.post(
  "/create",
  protect,
  upload.fields([
    { name: "nicFront", maxCount: 1 },
    { name: "nicBack", maxCount: 1 },
    { name: "customerPhoto", maxCount: 1 },
  ]),
  createCustomer,
);
router.get("/branch", protect, authorize("admin"), getBranchCustomers);
router.get("/360/:id", protect, authorize("admin"), getCustomer360);
router.get("/check/:nic", protect, checkCustomerStatus);

module.exports = router;
