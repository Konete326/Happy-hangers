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
const notificationRoutes = require("./router/notificationRoutes");
const returnRoutes = require("./router/returnRoutes");
const systemRoutes = require("./router/systemRoutes");

const app = express();

connectDB();

app.use(cors({
    origin: ["https://happy-hanger.vercel.app", "http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204
}));
app.use(express.json({ limit: "50mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/system", systemRoutes);

const globalErrorHandler = require("./middleware/errorMiddleware");
app.use(globalErrorHandler);

const clientBuildPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientBuildPath));
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
});

const PORT = process.env.PORT || 5000;

let serverInstance;
if (process.env.NODE_ENV !== 'production' || process.env.DESKTOP_ENV === 'true') {
    serverInstance = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
app.app = app;
app.serverInstance = serverInstance;