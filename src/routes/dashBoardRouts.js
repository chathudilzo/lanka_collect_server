const express = require("express");
const router = express.Router();
const {
  getDailyRoute,
  getCollectionSummary,
} = require("../controllers/dashBoardController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/route", protect, getDailyRoute);
router.get("/summary", protect, getCollectionSummary);

module.exports = router;
