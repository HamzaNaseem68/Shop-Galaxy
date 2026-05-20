const express = require('express')
const router = express.Router()
const User = require('../database/models/User')
const Order = require('../database/models/Order')

// --- GET all users (Admin only) ---
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 })
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// --- GET all orders (Admin only) ---
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 })
    res.json(orders)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// --- UPDATE order status (Admin only) ---
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body || {}
    const { id } = req.params

    if (!status) return res.status(400).json({ error: 'Status is required' })

    const order = await Order.findOneAndUpdate(
      { orderId: id },
      {
        $set: { status },
        $push: { history: { label: status, at: new Date().toISOString() } }
      },
      { new: true }
    )

    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
  } catch (error) {
    res.status(500).json({ error: 'Server error updating status' })
  }
})

module.exports = router
