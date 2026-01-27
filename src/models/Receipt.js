const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    receiptNo: { type: String, required: true, unique: true },
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    collectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amountPaid: { type: Number, required: true },
    panaltyPaid: { type: Number, default: 0 },
    totalReceived: { type: Number, required: true },

    paymentMethod: {
      type: String,
      enum: ["Cash", "Cheque", "Bank Transfer"],
      default: "Cash",
    },
    location: {
      latitude: Number,
      longitude: Number,
    },
    status: { type: String, enum: ["valid", "cancelled"], default: "valid" },
    remarks: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Receipt", receiptSchema);
