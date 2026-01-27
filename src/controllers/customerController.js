const Customer = require("../models/Customer");

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
