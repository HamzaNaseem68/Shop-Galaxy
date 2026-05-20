const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        orderId: { type: String, required: true, unique: true },
        items: { type: Array, required: true },
        subtotal: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        paymentMethod: { type: String, default: 'card' },
        customer: { type: Object },
        status: { type: String, default: 'Processing' },
        history: { type: Array, default: [] },
    },
    { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
