const express = require("express");
const router = express.Router();
const {
  getBranchCollectors,
  createCollector,
  getCollectorPerformance,
} = require("../controllers/teamController");

const { protect, authorize } = require("../middlewares/authMiddleware");

router.get("/collectors", protect, authorize("admin"), getBranchCollectors);

router.post("/collectors", protect, authorize("admin"), createCollector);

router.get(
  "/collectors/:id/performance",
  protect,
  authorize("admin"),
  getCollectorPerformance,
);

module.exports = router;
