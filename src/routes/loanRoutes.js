const express = require("express");
const router = express.Router();

const {
  createLoan,
  updateLoanStatus,
} = require("../controllers/loanController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.post("/", protect, authorize("collector", "admin"), createLoan);

router.patch("/:id/status", protect, authorize("admin"), updateLoanStatus);

module.exports = router;
