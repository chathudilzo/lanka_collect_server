const Loan = require("../models/Loan");
const Receipt = require("../models/Receipt");
const Customer = require("../models/Customer");

exports.processPayment = async (req, res) => {
  try {
    const { loanId, collectorId, amount, location } = req.body;
    console.log(loanId);
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid Amount" });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(400).json({ message: "Loan not found!" });
    }

    let remainingCash = Number(amount);
    let receiptPenaltyPaid = 0;
    let receiptBasePaid = 0;

    for (const installment of loan.schedule) {
      if (remainingCash <= 0) break;

      const totalInstDue = installment.amountDue + installment.penalty;
      const alreadyPaid = installment.paidAmount;
      const outstanding = totalInstDue - alreadyPaid;

      if (outstanding > 0) {
        const paymentForThis = Math.min(remainingCash, outstanding);

        const penaltyCoveredBefore = Math.min(alreadyPaid, installment.penalty);

        installment.paidAmount += paymentForThis;
        remainingCash -= paymentForThis;

        const penaltyCoveredAfter = Math.min(
          installment.paidAmount,
          installment.penalty,
        );

        const penaltyJustPaid = penaltyCoveredAfter - penaltyCoveredBefore;
        const baseJustPaid = paymentForThis - penaltyJustPaid;

        receiptPenaltyPaid += penaltyJustPaid;

        receiptBasePaid += baseJustPaid;

        if (installment.paidAmount >= totalInstDue - 1) {
          installment.status = "paid";
          installment.paidDate = new Date();
        } else {
          installment.status = "partial";
        }
      }
    }
    if (remainingCash > 0) {
      return res.status(400).json({
        message: `Amount exceeds total loan balance Max Accepted:${amount - remainingCash}`,
      });
    }

    const receipt = await Receipt.create({
      receiptNo: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      loanId: loan._id,
      customerId: loan.customerId,
      collectorId: collectorId,
      branchId: req.user.branchId,
      amountPaid: receiptBasePaid,
      panaltyPaid: receiptPenaltyPaid,
      totalReceived: amount,

      paymentMethod: "Cash",
      location: location,
      status: "valid",
    });

    const isFullyPaid = loan.schedule.every((i) => i.status === "paid");
    if (isFullyPaid) {
      loan.status = "closed";
    }
    await loan.save();

    res.json({ success: true, receipt });
  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ message: error.message });
  }
};
