const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  submitApplication,
  getMyApplications,
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

module.exports = router;
