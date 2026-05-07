const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  submitApplication,
  getMyApplications,
  getBranchApplications,
  reviewApplication,
  adminSubmitWalkIn,
} = require("../controllers/applicationController");
const upload = require("../middlewares/uploadMiddleware");

router.post(
  "/submit",
  protect,
  upload.fields([
    { name: "nicFront", maxCount: 1 },
    { name: "nicBack", maxCount: 1 },
    { name: "customerPhoto", maxCount: 1 },
  ]),
  submitApplication,
);

router.get("/mine", protect, getMyApplications);
router.get("/branch", protect, authorize("admin"), getBranchApplications);
router.patch(
  "/:applicationId/review",
  protect,
  authorize("admin"),
  reviewApplication,
);
router.post(
  "/walk-in",
  protect,
  authorize("admin"),
  upload.fields([
    { name: "nicFront", maxCount: 1 },
    { name: "nicBack", maxCount: 1 },
    { name: "customerPhoto", maxCount: 1 },
  ]),
  adminSubmitWalkIn,
);
module.exports = router;
