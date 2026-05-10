const User = require("../model/user");
const jwt = require("jsonwebtoken");
const { uploadImage } = require("../utils/cloudinary");

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "fallback-secret", {
        expiresIn: "30d",
    });
};

exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const newUser = await User.create({ name, email, password });
        const token = signToken(newUser._id);

        res.status(201).json({
            status: "success",
            token,
            data: {
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    brandName: newUser.brandName,
                    brandLogo: newUser.brandLogo,
                    phoneNumber: newUser.phoneNumber
                }
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password, user.password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = signToken(user._id);
        res.status(200).json({
            status: "success",
            token,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    brandName: user.brandName,
                    brandLogo: user.brandLogo,
                    phoneNumber: user.phoneNumber
                }
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, brandName, brandLogo, phoneNumber } = req.body;
        const userId = req.user._id;

        let updateData = { name, brandName, phoneNumber };

        if (brandLogo && brandLogo.startsWith("data:image")) {
            const uploadRes = await uploadImage(brandLogo);
            updateData.brandLogo = uploadRes.secure_url;
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            status: "success",
            data: {
                user: {
                    id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    brandName: updatedUser.brandName,
                    brandLogo: updatedUser.brandLogo,
                    phoneNumber: updatedUser.phoneNumber
                }
            }
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select("+password");

        if (!(await user.comparePassword(currentPassword, user.password))) {
            return res.status(401).json({ status: "fail", message: "Current password is incorrect" });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            status: "success",
            message: "Password updated successfully"
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};
