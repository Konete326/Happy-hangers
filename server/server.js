const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express"); // Vercel Deployment Trigger
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./router/authRoutes");
const categoryRoutes = require("./router/categoryRoutes");
const productRoutes = require("./router/productRoutes");
const orderRoutes = require("./router/orderRoutes");
const dashboardRoutes = require("./router/dashboardRoutes");
const reportRoutes = require("./router/reportRoutes");
const employeeRoutes = require("./router/employeeRouter");

const app = express();

connectDB();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/employees", employeeRoutes);

const clientBuildPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientBuildPath));
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production' || process.env.DESKTOP_ENV === 'true') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;