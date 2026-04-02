const Customer = require("../models/Customer");
const Loan = require("../models/Loan");
const Receipt = require("../models/Receipt");
const CollectionHandover = require("../models/CollectionHandover");
const Center = require("../models/Center");
exports.getCollectionSheet = async (req, res) => {
  try {
    const { centerId } = req.params;

    const customers = await Customer.find({
      centerId: centerId,
      activeLoanId: { $ne: null },
    })
      .populate("activeLoanId")
      .select("fullName nic phone customerPhoto activeLoanId");

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sheet = customers.map((customer) => {
      const loan = customer.activeLoanId;
      if (!loan) return null;

      let totalDue = 0;
      let arrears = 0;
      let nextInstallment = null;
      let status = "paid";
      for (const installment of loan.schedule) {
        if (new Date(installment.dueDate) <= today) {
          const pending =
            installment.amountDue +
            installment.penalty -
            installment.paidAmount;
          if (pending > 0) {
            totalDue += pending;
            const dueDate = new Date(installment.dueDate);
            const isToday =
              dueDate.toDateString() === new Date().toDateString();

            if (!isToday) {
              arrears += pending;
            }
          }
        }
      }
      if (totalDue > 0) {
        status = arrears > 0 ? "overdue" : "due";
      }
      return {
        customerId: customer._id,
        name: customer.fullName,
        nic: customer.nic,
        phone: customer.phone,
        loanId: loan.loanId,
        loanDbId: loan._id,
        totalDue: totalDue,
        arrears: arrears,
        weeklyAmount: loan.schedule[0].amountDue,
        status: status,
        photo: customer.customerPhoto,
      };
    });

    const sortedSheet = sheet.sort((a, b) => {
      const priority = { overdue: 0, due: 1, paid: 2 };
      return priority[a.status] - priority[b.status];
    });

    res.json({ success: true, count: sortedSheet.length, data: sortedSheet });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getLoanDetails = async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findOne({ loanId: loanId })
      .populate("customerId", "fullName nic phone address location")
      .populate("schedule");

    if (!loan) {
      return res
        .status(404)
        .json({ success: false, message: "Loan not found" });
    }

    const receipts = await Receipt.find({ loanId: loan._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        loan: loan,
        customer: loan.customerId,
        receipts: receipts,
      },
    });
  } catch (error) {
    console.error("Loan Details Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getDailyReport = async (req, res) => {
  try {
    const { _id: collectorId } = req.user;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const receipts = await Receipt.find({
      collectorId: collectorId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: "valid",
      handoverId: null,
    }).populate("loanId", "centerId");

    const allCenters = await Center.find();
    const centerNameMap = {};
    allCenters.forEach((c) => {
      centerNameMap[c.centerId] = c.centerName;
    });

    const centerMap = {};
    let grandTotal = 0;

    for (const r of receipts) {
      if (!r.loanId || !r.loanId.centerId) continue;

      const centerIdString = r.loanId.centerId;

      const centerNameString = centerNameMap[centerIdString] || centerIdString;

      const amount = r.totalReceived;

      if (!centerMap[centerIdString]) {
        centerMap[centerIdString] = {
          centerId: centerIdString,
          centerName: centerNameString,
          total: 0,
          count: 0,
        };
      }
      centerMap[centerIdString].total += amount;
      centerMap[centerIdString].count += 1;
      grandTotal += amount;
    }

    const breakdown = Object.values(centerMap);

    res.json({
      success: true,
      data: {
        totalCollected: grandTotal,
        totalReceipts: receipts.length,
        breakdown: breakdown,
      },
    });
  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.submitDailyHandover = async (req, res) => {
  try {
    const collectorId = req.user._id;
    const branchId = req.user.branchId;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const newReceipts = await Receipt.find({
      collectorId: collectorId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: "valid",
      handoverId: null,
    });

    if (newReceipts.length === 0) {
      const existingHandover = await CollectionHandover.findOne({
        collectorId,
        createdAt: { $gte: startOfDay },
      });

      if (existingHandover) {
        return res.status(200).json({
          success: true,
          message: "All collected cash has already been handed over today.",
          data: existingHandover,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "No receipts found to handover.",
        });
      }
    }

    let cashTotal = 0;
    let bankTotal = 0;
    let grandTotal = 0;

    newReceipts.forEach((r) => {
      if (r.paymentMethod === "Cash") cashTotal += r.totalReceived;
      else bankTotal += r.totalReceived;
      grandTotal += r.totalReceived;
    });

    const handoverId = `HO-${collectorId.toString().slice(-4)}-${Date.now()}`;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const newHandover = await CollectionHandover.create({
      handoverId: handoverId,
      collectorId: collectorId,
      branchId: branchId,
      date: new Date(),
      totalAmount: grandTotal,
      cashAmount: cashTotal,
      bankTransferAmount: bankTotal,
      receipts: newReceipts.map((r) => r._id),
      verificationCode: otp,
      status: "pending",
    });

    await Receipt.updateMany(
      { _id: { $in: newReceipts.map((r) => r._id) } },
      { $set: { handoverId: newHandover._id } },
    );

    res.status(201).json({
      success: true,
      message: `Handover submitted for LKR ${grandTotal} Ask Manager for the Verification Code.`,
      data: newHandover,
    });
  } catch (error) {
    console.error("Handover Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.verifyHandoverCode = async (req, res) => {
  try {
    const { handoverId, code } = req.body;
    const collectorId = req.user._id;

    const handover = await CollectionHandover.findOne({
      _id: handoverId,
      collectorId: collectorId,
    });

    if (!handover) {
      return res
        .status(404)
        .json({ success: false, message: "Handover record not found." });
    }

    if (handover.status === "verified") {
      return res.status(400).json({
        success: false,
        message: "This handover is already verified.",
      });
    }

    if (handover.verificationCode !== code) {
      return res.status(400).json({
        success: false,
        message: "Invalid Verification Code. Please check with Manager.",
      });
    }

    handover.status = "verified";
    handover.verifiedAt = new Date();
    await handover.save();

    res.json({
      success: true,
      message: "Handover verified successfully. Your cash account is cleared.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getHandoverHisatory = async (req, res) => {
  try {
    const collectorId = req.user._id;
    const handovers = await CollectionHandover.find({
      collectorId: collectorId,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: handovers,
    });
  } catch (error) {
    console.error("History Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getBranchHandovers = async (req, res) => {
  try {
    const branchId = req.user.branchId;

    const handovers = await CollectionHandover.find({ branchId: branchId })
      .populate("collectorId", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: handovers });
  } catch (error) {
    console.error("Branch Handovers Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.adminVerifyHandover = async (req, res) => {
  try {
    const { handoverId, code } = req.body;
    const adminId = req.user._id;

    const handover = await CollectionHandover.findById(handoverId);

    if (!handover) {
      return res
        .status(404)
        .json({ success: false, message: "Handover not found." });
    }

    if (handover.status === "verified") {
      return res
        .status(400)
        .json({ success: false, message: "Already verified." });
    }

    if (handover.verificationCode !== code) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Verification Code!" });
    }

    handover.status = "verified";
    handover.verifiedAt = new Date();
    handover.verifiedBy = adminId;
    await handover.save();

    res.json({
      success: true,
      message:
        "Cash handover verified successfully. Collector account cleared.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
