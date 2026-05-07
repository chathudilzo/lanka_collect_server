const User = require("../models/User");
const LoanApplication = require("../models/LoanApplication");
const Loan = require("../models/Loan");
const Receipt = require("../models/Receipt");

exports.getBranchCollectors = async (req, res) => {
  try {
    const collectors = await User.find({
      branchId: req.user.branchId,
      role: "collector",
    }).select("-password");
    res.json({ success: true, data: collectors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCollector = async (req, res) => {
  try {
    const { name, email, password, phone, assignedCenters } = req.body;

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already in use" });

    const collector = await User.create({
      name,
      email,
      password,
      phone,
      role: "collector",
      branchId: req.user.branchId,
      assignedCenters: assignedCenters || [],
    });

    res
      .status(201)
      .json({ success: true, message: "Collector created!", data: collector });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCollectorPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query; // e.g., month=5, year=2026

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const totalApps = await LoanApplication.countDocuments({ collectorId: id });
    const approvedApps = await LoanApplication.countDocuments({
      collectorId: id,
      status: "approved",
    });
    const rejectedApps = await LoanApplication.countDocuments({
      collectorId: id,
      status: "rejected",
    });

    const activeLoans = await Loan.find({
      collectorId: id,
      status: { $in: ["approved", "disbursed"] },
    });
    const totalPortfolio = activeLoans.reduce(
      (sum, loan) => sum + loan.totalPayable,
      0,
    );

    const receipts = await Receipt.find({
      collectorId: id,
      createdAt: { $gte: startDate, $lte: endDate },
      status: "valid",
    });

    const dailyCollections = {};
    receipts.forEach((r) => {
      const day = r.createdAt.getDate();
      if (!dailyCollections[day]) dailyCollections[day] = 0;
      dailyCollections[day] += r.totalReceived;
    });

    res.json({
      success: true,
      data: {
        applications: {
          total: totalApps,
          approved: approvedApps,
          rejected: rejectedApps,
        },
        portfolio: {
          activeCount: activeLoans.length,
          totalValue: totalPortfolio,
        },
        monthlyCollections: dailyCollections,
        receiptList: receipts,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
