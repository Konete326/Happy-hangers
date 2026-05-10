const User = require("../model/user");
const jwt = require("jsonwebtoken");

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
            data: { user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } },
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
            data: { user: { id: user._id, name: user.name, email: user.email, role: user.role } },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
