const express = require("express");
const router = express.Router();

const {
  createBranch,
  getBranches,
  createCenter,
  getCentersByBranch,
} = require("../controllers/orgController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router
  .route("/branches")
  .post(protect, authorize("admin"), createBranch)
  .get(protect, getBranches);

router.route("/centers").post(protect, authorize("admin"), createCenter);

router.get("/centers/:branchId", protect, getCentersByBranch);

module.exports = router;
