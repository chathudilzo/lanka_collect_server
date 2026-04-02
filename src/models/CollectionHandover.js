const mongoose = require("mongoose");

const collectionHandoverSchema = new mongoose.Schema(
  {
    handoverId: { type: String, required: true, unique: true },

    collectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    branchId: { type: String, required: true },

    date: { type: Date, required: true },

    totalAmount: { type: Number, required: true },

    cashAmount: { type: Number, required: true, default: 0 },
    chequeAmount: { type: Number, required: true, default: 0 },
    bankTransferAmount: { type: Number, required: true, default: 0 },

    receipts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Receipt",
      },
    ],

    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    verificationCode: {
      type: String,
      required: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: { type: Date },
    adminNote: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CollectionHandover", collectionHandoverSchema);
