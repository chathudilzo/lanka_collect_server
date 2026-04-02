const express = require("express");
const router = express.Router();
const {
  collectPayment,
  getTodayReceiptsByCenter,
} = require("../controllers/receiptController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.post("/collect", protect, authorize("collector"), collectPayment);

router.get("/today/:centerId", protect, getTodayReceiptsByCenter);

module.exports = router;
