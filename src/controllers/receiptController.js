const Receipt = require("../models/Receipt");
const Loan = require("../models/Loan");

exports.collectPayment = async (req, res) => {
  try {
    const { loanId, amountPaid, panaltyPaid, installmentNumbers } = req.body;

    const receipt = await Receipt.create({
      ...req.body,
      receiptNo: `RCP-${Date.now()}`,
      collectorId: req.user.id,
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
