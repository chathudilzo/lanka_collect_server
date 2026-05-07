const LoanApplication = require("../models/LoanApplication");
const Customer = require("../models/Customer");
const Loan = require("../models/Loan");
const loanService = require("../services/loanService");
const User = require("../models/User");

exports.submitApplication = async (req, res) => {
  try {
    const {
      fullName,
      nic,
      phone,
      address,
      gender,
      centerId,
      loanAmount,
      duration,
      latitude,
      longitude,
    } = req.body;

    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/`;

    const nicFront = req.files["nicFront"]
      ? baseUrl + req.files["nicFront"][0].filename
      : null;
    const nicBack = req.files["nicBack"]
      ? baseUrl + req.files["nicBack"][0].filename
      : null;
    const photo = req.files["customerPhoto"]
      ? baseUrl + req.files["customerPhoto"][0].filename
      : null;

    const application = await LoanApplication.create({
      fullName,
      nic,
      phone,
      address,
      gender,
      location: { latitude, longitude },

      loanAmount,
      duration: duration || 12,

      nicFrontImage: nicFront,
      nicBackImage: nicBack,
      customerPhoto: photo,

      collectorId: req.user._id,
      branchId: req.user.branchId,
      centerId: centerId,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    console.error("Application Submit Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    console.log(req.user._id);
    const collectorId = req.user._id;
    const { status } = req.query;

    let query = { collectorId: collectorId };

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }
    const applications = await LoanApplication.find(query)
      .sort({ createdAt: -1 })
      .select("-nicFrontImage -nicBackImage -customerPhoto")
      .populate("reviewedBy", "name email");

    console.log(applications);
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error("Get My Apps Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBranchApplications = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const { status } = req.query;

    let query = { branchId: branchId };

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }

    const applications = await LoanApplication.find(query)
      .sort({ createdAt: -1 })
      .populate("collectorId", "name email");

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error("Get Branch Apps Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.reviewApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, reviewNote } = req.body; // status will be "approved" or "rejected"
    const adminId = req.user._id;

    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status update" });
    }

    const application = await LoanApplication.findById(applicationId);

    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Application is already ${application.status}`,
      });
    }

    if (status === "rejected") {
      application.status = "rejected";
      application.reviewNote = reviewNote;
      application.reviewedBy = adminId;
      application.reviewedAt = new Date();
      await application.save();

      return res.json({
        success: true,
        message: "Application rejected.",
        data: application,
      });
    }

    if (status === "approved") {
      const newCustomer = await Customer.create({
        nic: application.nic,
        fullName: application.fullName,
        phone: application.phone,
        address: application.address,
        gender: application.gender,
        location: application.location,
        branchId: application.branchId,
        centerId: application.centerId,
        idFrontImage: application.nicFrontImage,
        idBackImage: application.nicBackImage,
        customerPhoto: application.customerPhoto,
      });

      const principal = application.loanAmount;
      const totalInterest = principal * 0.15;
      const totalPayable = principal + totalInterest;

      const schedule = loanService.generateSchedule(
        totalPayable,
        application.duration || 12,
        application.repaymentFrequency || "weekly",
        new Date(),
      );

      const newLoan = await Loan.create({
        loanId: `L-${application.centerId}-${Date.now().toString().slice(-6)}`,
        customerId: newCustomer._id,
        loanTypeId: "W-PRO-15",
        principalAmount: principal,
        totalInterest: totalInterest,
        totalPayable: totalPayable,
        duration: application.duration || 12,
        repaymentType: application.repaymentFrequency || "weekly",
        penaltyRate: 5.0,
        status: "approved",
        approvedBy: adminId,
        centerId: application.centerId,
        branchId: application.branchId,
        schedule: schedule,
      });

      newCustomer.activeLoanId = newLoan._id;
      await newCustomer.save();

      application.status = "approved";
      application.reviewNote = reviewNote || "Approved by Admin";
      application.reviewedBy = adminId;
      application.reviewedAt = new Date();
      application.createdCustomerId = newCustomer._id;
      application.createdLoanId = newLoan._id;
      await application.save();

      return res.json({
        success: true,
        message:
          "Application approved! Customer and Loan generated successfully.",
        data: {
          application,
          customer: newCustomer,
          loan: newLoan,
        },
      });
    }
  } catch (error) {
    console.error("Review Application Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.adminSubmitWalkIn = async (req, res) => {
  try {
    const {
      fullName,
      nic,
      phone,
      address,
      gender,
      centerId,
      loanAmount,
      duration,
    } = req.body;

    const collector = await User.findOne({
      assignedCenters: centerId,
      role: "collector",
    });

    if (!collector) {
      return res.status(400).json({
        success: false,
        message:
          "No Collector is assigned to this Center. Please check Center assignments.",
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/`;
    const nicFront = req.files["nicFront"]
      ? baseUrl + req.files["nicFront"][0].filename
      : null;
    const nicBack = req.files["nicBack"]
      ? baseUrl + req.files["nicBack"][0].filename
      : null;
    const photo = req.files["customerPhoto"]
      ? baseUrl + req.files["customerPhoto"][0].filename
      : null;

    // 3. Create the Application
    const application = await LoanApplication.create({
      fullName,
      nic,
      phone,
      address,
      gender,
      location: { latitude: 0, longitude: 0 },
      loanAmount,
      duration: duration || 12,
      nicFrontImage: nicFront,
      nicBackImage: nicBack,
      customerPhoto: photo,
      collectorId: collector._id,
      branchId: req.user.branchId,
      centerId: centerId,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Walk-in application created and assigned to " + collector.name,
      data: application,
    });
  } catch (error) {
    console.error("Walk-in Submit Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
