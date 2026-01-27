const Loan = require("../models/Loan");
const loanService = require("../services/loanService");

exports.createLoan = async (req, res) => {
  try {
    const { principalAmount, duration, repaymentType, panaltyRate } = req.body;

    const totalInterest = principalAmount * 0.1;
    const totalPayble = principalAmount + totalInterest;

    const schedule = loanService.generateSchedule(
      totalPayble,
      duration,
      repaymentType,
      new Date(),
    );

    const loan = await Loan.create({
      ...req.body,
      totalInterest,
      totalPayble,
      schedule,
      branchId: req.user.branchId,
      status: "pending",
    });

    res.status(201).json(loan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateLoanStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      {
        status,
        approvedBy: req.user.id,
      },
      {
        new: true,
      },
    );
    res.json(loan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
