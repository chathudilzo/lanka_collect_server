const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    nic: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    nameWithInitials: { type: String },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"] },

    branchId: { type: String, required: true },
    centerId: { type: String, required: true },
    totalLoansTaken: { type: Number, default: 0 },
    activeLoanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      default: null,
    },
    creditStatus: {
      type: String,
      enum: ["Good", "AtRisk", "BlackListed"],
      default: "Good",
    },
    idFrontImage: { type: String },
    idBackImage: { type: String },
    customerPhoto: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Customer", customerSchema);
