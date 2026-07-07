const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: 6,
    },
    role: {
        type: String,
        enum: ["admin", "employee"],
        default: "admin",
    },
    permissions: [{
        type: String,
        enum: ["inventory", "pos", "orders", "customers", "reports", "employees"]
    }],
    dataVisibility: {
        type: String,
        enum: ["all", "own"],
        default: "all"
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    brandName: {
        type: String,
        default: "Happy Hangers",
    },
    brandLogo: {
        type: String,
        default: "",
    },
    phoneNumber: {
        type: String,
        default: "+92 300 0000000",
    },
    websiteUrl: {
        type: String,
        default: "Happyhangers.com.pk",
    },
}, { timestamps: true });


userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);
});


userSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model("User", userSchema);
