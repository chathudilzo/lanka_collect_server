const mongoose = require("mongoose");

const loanApplicationSchema = new mongoose.Schema(
  {
    nic: { type: String, required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    gender: { type: String, enum: ["Male", "Female"] },

    location: {
      latitude: Number,
      longitude: Number,
    },

    loanAmount: { type: Number, required: true },
    duration: { type: Number, default: 12 },
    repaymentFrequency: { type: String, default: "weekly" },

    nicFrontImage: { type: String },
    nicBackImage: { type: String },
    customerPhoto: { type: String },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    collectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewNote: { type: String, default: "" },
    reviewedAt: { type: Date },
    branchId: { type: String, required: true },
    centerId: { type: String, required: true },

    createdCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    createdLoanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("LoanApplication", loanApplicationSchema);
