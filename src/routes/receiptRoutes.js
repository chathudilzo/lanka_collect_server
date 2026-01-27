const express = require("express");
const router = express.Router();
const { collectPayment } = require("../controllers/receiptController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.post("/collect", protect, authorize("collector"), collectPayment);

module.exports = router;
