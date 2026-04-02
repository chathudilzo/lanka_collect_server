const express = require("express");
const router = express.Router();
const upload = require("../middlewares/uploadMiddleware");

const {
  getCustomerByNIC,
  createCustomer,
  checkCustomerStatus,
} = require("../controllers/customerController");

const { protect } = require("../middlewares/authMiddleware");

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

router.get("/check/:nic", protect, checkCustomerStatus);

module.exports = router;
