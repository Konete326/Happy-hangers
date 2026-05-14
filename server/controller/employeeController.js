const User = require("../model/user");

exports.addEmployee = async (req, res) => {
    try {
        const { name, email, password, permissions, dataVisibility } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists with this email" });
        }

        const employee = await User.create({
            name,
            email,
            password,
            role: "employee",
            permissions,
            dataVisibility,
            adminId: req.user._id,
            brandName: req.user.brandName,
            brandLogo: req.user.brandLogo,
            phoneNumber: req.user.phoneNumber
        });

        res.status(201).json({ success: true, data: employee });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getEmployees = async (req, res) => {
    try {
        const employees = await User.find({ adminId: req.user._id });
        res.status(200).json({ success: true, data: employees });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.updateEmployee = async (req, res) => {
    try {
        const { permissions, dataVisibility } = req.body;
        const employee = await User.findOneAndUpdate(
            { _id: req.params.id, adminId: req.user._id },
            { permissions, dataVisibility },
            { new: true }
        );

        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        res.status(200).json({ success: true, data: employee });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.deleteEmployee = async (req, res) => {
    try {
        const employee = await User.findOneAndDelete({ _id: req.params.id, adminId: req.user._id });
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }
        res.status(200).json({ success: true, message: "Employee deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
