const Order = require("../model/order");
const Product = require("../model/product");

exports.createOrder = async (req, res) => {
    try {
        const { items, subtotal, tax, discount, grandTotal, paymentMethod, amountRendered, changeReturned } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Order items are required" });
        }

        const order = await Order.create({
            items,
            subtotal,
            tax,
            discount,
            grandTotal,
            paymentMethod,
            amountRendered,
            changeReturned
        });

        for (const item of items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.qty }
            });
        }

        res.status(201).json({ success: true, data: order });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error processing the order" });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate("items.product", "sku").sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
};
