const Customer = require("../models/Customer");
const Loan = require("../models/Loan");

exports.getCustomerByNIC = async (req, res) => {
  try {
    const customer = await Customer.findOne({ nic: req.params.nic });
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const customerData = { ...req.body, branchId: req.user.branchId };
    const customer = await Customer.create(customerData);
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { fullName, nic, phone, address, gender, centerId } = req.body;
    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/`;

    const nicFrontUrl = req.files["nicFront"]
      ? baseUrl + req.files["nicFront"][0].filename
      : null;
    const nicBackUrl = req.files["nicBack"]
      ? baseUrl + req.files["nicBack"][0].filename
      : null;
    const photoUrl = req.files["customerPhoto"]
      ? baseUrl + req.files["customerPhoto"][0].filename
      : null;

    const branchId = req.user.branchId;

    const newCustomer = await Customer.create({
      fullName,
      nic,
      phone,
      address,
      gender,
      centerId,
      branchId,
      idFrontImage: nicFrontUrl,
      idBackImage: nicBackUrl,
      customerPhoto: photoUrl,

      location: {
        latitude: req.body.latitude,
        longitude: req.body.longitude,
      },
    });

    res.status(201).json({ success: true, data: newCustomer });
  } catch (error) {
    console.error("Create Customer Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.checkCustomerStatus = async (req, res) => {
  console.log(req.params);

  try {
    const { nic } = req.params;
    console.log(nic);

    const customer = await Customer.findOne({ nic: nic }).populate(
      "activeLoanId",
    );

    if (!customer) {
      return res.json({
        success: true,
        status: "NEW",
        message: "Customer not found. You can register them.",
      });
    }

    if (customer.activeLoanId) {
      const loan = customer.activeLoanId;
      if (loan.status !== "closed" && loan.status !== "rejected") {
        return res.json({
          success: true,
          status: "BLOCKED",
          message: `Customer has an active loan (${loan.loanId}). Status: ${loan.status}`,
          customer: customer,
          loan: loan,
        });
      }
    }

    return res.json({
      success: true,
      status: "EXISTING",
      message: "Customer exists. Proceed with application.",
      customer: customer,
    });
  } catch (error) {
    console.error("Check Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
