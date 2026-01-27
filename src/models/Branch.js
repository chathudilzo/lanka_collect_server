const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    branchId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    contactNumber: { type: String, required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Branch", branchSchema);
