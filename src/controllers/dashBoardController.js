const Center = require("../models/Center");
const Receipt = require("../models/Receipt");
const Loan = require("../models/Loan");

const LoanApplication = require("../models/LoanApplication");
const Customer = require("../models/Customer");

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
exports.getBranchSummary = async (req, res) => {
  try {
    const branchId = req.user.branchId;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. TODAY'S COLLECTIONS
    const todayReceipts = await Receipt.aggregate([
      {
        $match: {
          branchId: branchId,
          createdAt: { $gte: todayStart, $lte: todayEnd },
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
    const collectedToday =
      todayReceipts.length > 0 ? todayReceipts[0].totalCollected : 0;
    const receiptCount = todayReceipts.length > 0 ? todayReceipts[0].count : 0;

    // 2. PORTFOLIO, TARGETS, AND ARREARS (Looping through active loans)
    const activeLoans = await Loan.find({
      branchId: branchId,
      status: { $in: ["approved", "disbursed"] }, // Assuming approved means active here
    });

    let expectedToday = 0;
    let totalPortfolio = 0;
    let totalRecovered = 0;
    let totalArrears = 0;

    activeLoans.forEach((loan) => {
      totalPortfolio += loan.totalPayable;

      loan.schedule.forEach((inst) => {
        totalRecovered += inst.paidAmount;

        const dueDate = new Date(inst.dueDate);
        const instTotalDue = inst.amountDue + inst.penalty;

        // Is this installment due strictly today?
        if (dueDate >= todayStart && dueDate <= todayEnd) {
          expectedToday += instTotalDue;
        }

        // Is this installment overdue? (Due before today and not fully paid)
        if (dueDate < todayStart && inst.status !== "paid") {
          totalArrears += instTotalDue - inst.paidAmount;
        }
      });
    });

    // 3. CHART DATA: LAST 7 DAYS COLLECTIONS
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(todayStart.getDate() - 6); // 7 days including today

    const weeklyCollections = await Receipt.aggregate([
      {
        $match: {
          branchId: branchId,
          createdAt: { $gte: sevenDaysAgo, $lte: todayEnd },
          status: "valid",
        },
      },
      {
        $group: {
          // Group by Date string (YYYY-MM-DD)
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$totalReceived" },
        },
      },
      { $sort: { _id: 1 } }, // Sort chronologically
    ]);

    // 4. ACTIONABLE METRICS
    const pendingApplications = await LoanApplication.countDocuments({
      branchId: branchId,
      status: "pending",
    });

    res.json({
      success: true,
      data: {
        branchId,
        collectedToday,
        receiptCount,
        expectedToday,
        totalPortfolio,
        totalRecovered,
        totalArrears,
        pendingApplications,
        chartData: weeklyCollections.map((item) => ({
          date: item._id,
          amount: item.total,
        })),
      },
    });
  } catch (error) {
    console.error("Branch Summary Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
