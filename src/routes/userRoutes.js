const express = require("express");
const router = express.Router();
const { loginUser, registerUser } = require("../controllers/userController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.post("/login", loginUser);

router.post("/register", protect, authorize("admin"), registerUser);

module.exports = router;
