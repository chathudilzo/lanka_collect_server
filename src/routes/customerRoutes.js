const express = require("express");
const router = express.Router();

const {
  getCustomerByNIC,
  createCustomer,
} = require("../controllers/customerController");

const { protect } = require("../middlewares/authMiddleware");

router.get("/search/:nic", protect, getCustomerByNIC);

router.post("/", protect, createCustomer);

module.exports = router;
