const mongoose = require("mongoose");

const installmentSchema = new mongoose.Schema({
  installmentNo: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  amountDue: { type: Number, required: true },
  panalty: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["unpaid", "partial", "paid", "overdue"],
    default: "unpaid",
  },
  paidDate: { type: Date },
});

const loanSchema = new mongoose.Schema(
  {
    loanId: { type: String, required: true, unique: true },
    customerId: {
      type: mongoose.Schema.ObjectId,
      ref: "Customer",
      required: true,
    },
    loanTypeId: { type: String, required: true },

    principalAmount: { type: Number, required: true },
    totalInterest: { type: Number, required: true },
    totalPayble: { type: Number, required: true },

    repaymentType: {
      type: String,
      enum: ["weekly", "monthly"],
      default: "weekly",
    },
    panaltyRate: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "approved", "disbursed", "closed", "rejected"],
      default: "pending",
    },
    approvedBy: { type: mongoose.Schema.ObjectId, ref: "User" },
    centerId: { type: String, required: true },
    branchId: { type: String, required: true },

    schedule: [installmentSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Loan", loanSchema);
