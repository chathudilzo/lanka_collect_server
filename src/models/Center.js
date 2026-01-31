const mongoose = require("mongoose");

const centerSchema = new mongoose.Schema(
  {
    centerId: { type: String, required: true, unique: true },
    centerName: { type: String, required: true },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    routeId: { type: String, required: true },
    dayOfWeek: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },
    meetingTime: { type: String, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Center", centerSchema);
