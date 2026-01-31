const Center = require("../models/Center");
const Receipt = require("../models/Receipt");
const Loan = require("../models/Loan");

exports.getDailyRoute = async (req, res) => {
  try {
    const { day } = req.query;

    const centers = await Center.find({
      centerId: { $in: req.user.assignedCenters },
      dayOfWeek: day,
    });

    res.json({ success: true, count: centers.length, data: centers });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCollectionSummary = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    endOfDay = new Date();

    endOfDay.setHours(23, 59, 59, 999);

    const receipts = await Receipt.aggregate([
      {
        $match: {
          collectorId: req.user._id,
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          status: "valid",
        },
      },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: "$totalReceived" },
          count: { $sum: 1 },
        },
      },
    ]);
    const collectedAmount =
      receipts.length > 0 ? receipts[0].totalCollected : 0;

    const targetAmount = 150000;

    res.json({
      success: true,
      data: {
        target: targetAmount,
        collected: collectedAmount,
        cashInHand: collectedAmount,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
