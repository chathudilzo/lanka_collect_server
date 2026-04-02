const LoanApplication = require("../models/LoanApplication");

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
