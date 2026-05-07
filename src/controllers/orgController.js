const Branch = require("../models/Branch");
const Center = require("../models/Center");

exports.createBranch = async (req, res) => {
  try {
    const branch = await Branch.create(req.body);
    res.status(201).json({ success: true, date: branch });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.find().populate("managerId", "name");
    res.status(200).json({ success: true, data: branches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCenter = async (req, res) => {
  try {
    const centerData = { ...req.body, branchId: req.user.branchId };
    const center = await Center.create(centerData);

    res.status(201).json({ success: true, data: center });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getCentersByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    console.log("Received Branch ID:", branchId);

    if (!branchId || branchId === "undefined") {
      return res
        .status(400)
        .json({ success: false, message: "Branch ID is missing from URL" });
    }

    const centers = await Center.find({ branchId: branchId });
    console.log("CENTERS:", centers);
    res.status(200).json({ success: true, data: centers });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
