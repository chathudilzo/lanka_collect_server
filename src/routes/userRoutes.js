const express = require("express");
const router = express.Router();
const {
  loginUser,
  registerUser,
  getProfile,
} = require("../controllers/userController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.post("/login", loginUser);
router.get("/userProfile", protect, getProfile);

router.post("/register", protect, authorize("admin"), registerUser);

module.exports = router;
