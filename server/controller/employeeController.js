const User = require("../model/user");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.addEmployee = catchAsync(async (req, res, next) => {
    const { name, email, password, permissions, dataVisibility } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return next(new AppError("User already exists with this email", 400));

    const employee = await User.create({
        name, email, password,
        role: "employee",
        permissions,
        dataVisibility,
        adminId: req.user._id,
        brandName: req.user.brandName,
        brandLogo: req.user.brandLogo,
        phoneNumber: req.user.phoneNumber
    });

    res.status(201).json({ success: true, data: employee });
});

exports.getEmployees = catchAsync(async (req, res, next) => {
    const employees = await User.find({ adminId: req.user._id });
    res.status(200).json({ success: true, data: employees });
});

exports.updateEmployee = catchAsync(async (req, res, next) => {
    const { permissions, dataVisibility } = req.body;
    const employee = await User.findOneAndUpdate(
        { _id: req.params.id, adminId: req.user._id },
        { permissions, dataVisibility },
        { new: true }
    );
    if (!employee) return next(new AppError("Employee not found", 404));
    res.status(200).json({ success: true, data: employee });
});

exports.deleteEmployee = catchAsync(async (req, res, next) => {
    const employee = await User.findOneAndDelete({ _id: req.params.id, adminId: req.user._id });
    if (!employee) return next(new AppError("Employee not found", 404));
    res.status(200).json({ success: true, message: "Employee deleted" });
});
