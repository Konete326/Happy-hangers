const User = require("../model/user");
const { uploadImage } = require("../utils/cloudinary");
const authService = require("../services/authService");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.signup = catchAsync(async (req, res, next) => {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) return next(new AppError("User already exists", 400));

    const newUser = await User.create({ name, email, password });
    res.status(201).json({
        status: "success",
        token: authService.signToken(newUser._id),
        data: { user: authService.formatUserResponse(newUser) }
    });
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password, user.password))) {
        return next(new AppError("Invalid credentials", 401));
    }
    res.status(200).json({
        status: "success",
        token: authService.signToken(user._id),
        data: { user: authService.formatUserResponse(user) }
    });
});

exports.updateProfile = catchAsync(async (req, res, next) => {
    const { name, brandName, brandLogo, phoneNumber } = req.body;
    let updateData = { name, brandName, phoneNumber };
    if (brandLogo && brandLogo.startsWith("data:image")) {
        const uploadRes = await uploadImage(brandLogo);
        updateData.brandLogo = uploadRes.secure_url;
    }
    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
    res.status(200).json({ status: "success", data: { user: authService.formatUserResponse(updatedUser) } });
});

exports.changePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword, user.password))) {
        return next(new AppError("Current password incorrect", 401));
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ status: "success", message: "Password updated" });
});
