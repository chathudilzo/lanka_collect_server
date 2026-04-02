const express = require("express");
const router = express.Router();
const {
  getDailyRoute,
  getCollectionSummary,
  getBranchSummary,
} = require("../controllers/dashBoardController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.get("/route", protect, getDailyRoute);
router.get("/summary", protect, getCollectionSummary);

router.get("/branch-summary", protect, authorize("admin"), getBranchSummary);

module.exports = router;
