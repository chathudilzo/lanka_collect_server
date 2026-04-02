const express = require("express");
const router = express.Router();
const {
  getCollectionSheet,
  getLoanDetails,
  getDailyReport,
  submitDailyHandover,
  verifyHandoverCode,
  getHandoverHisatory,
  getBranchHandovers,
  adminVerifyHandover,
} = require("../controllers/collectionController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const { processPayment } = require("../controllers/paymentController");

router.get("/sheet/:centerId", protect, getCollectionSheet);
router.post("/pay", protect, processPayment);
router.get("/loan/:loanId", protect, getLoanDetails);
router.get("/daily-report", protect, getDailyReport);
router.post("/handover", protect, submitDailyHandover);
router.post("/very/handover", protect, verifyHandoverCode);
router.get("/handovers", protect, getHandoverHisatory);
router.get(
  "/handovers/branch",
  protect,
  authorize("admin"),
  getBranchHandovers,
);
router.post(
  "/handovers/branch/verify",
  protect,
  authorize("admin"),
  adminVerifyHandover,
);
module.exports = router;
