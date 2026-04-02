const Receipt = require("../models/Receipt");
const Loan = require("../models/Loan");

exports.collectPayment = async (req, res) => {
  try {
    const { loanId, amountPaid, panaltyPaid, installmentNumbers } = req.body;

    const receipt = await Receipt.create({
      ...req.body,
      receiptNo: `RCP-${Date.now()}`,
      collectorId: req.user.id,
      branchId: req.user.branchId,
      totalReceived: amountPaid + panaltyPaid,
    });
    const loan = await Loan.findById(loanId);

    loan.schedule.forEach((inst) => {
      if (installmentNumbers.includes(inst.installmentNo)) {
        ((inst.status = "paid"), (inst.paidAmount = inst.amountDue));
        inst.paidDate = new Date();
      }
    });

    await loan.save();
    res.status(201).json({ success: true, receipt });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
exports.getTodayReceiptsByCenter = async (req, res) => {
  try {
    const { centerId } = req.params;
    const collectorId = req.user._id;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const receipts = await Receipt.find({
      collectorId: collectorId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: "valid",
      handoverId: null,
    })
      .populate({
        path: "loanId",
        match: { centerId: centerId },
        select: "centerId loanId",
      })
      .populate("customerId", "fullName nic phone")
      .sort({ createdAt: -1 });

    const filtered = receipts.filter((r) => r.loanId !== null);

    res.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    console.error("Center Receipts Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
