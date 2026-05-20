require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const connectDB = require('./database/db.js')
const User = require('./database/models/User')
const Order = require('./database/models/Order')
const Product = require('./database/models/Product')

const app = express()
const PORT = process.env.PORT || 5000

// Connect to MongoDB
connectDB()

// CORS Config for Vercel and local development
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // Allow if origin matches configured frontend URL, local development, Vercel or Netlify domains
    if (
      allowedOrigins.includes(origin) || 
      /\.vercel\.app$/.test(origin) ||
      /\.netlify\.app$/.test(origin)
    ) {
      callback(null, true);
    } else {
      // Fallback to allowing in non-production, otherwise block
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Ecommerce backend running with MongoDB Atlas' })
})

// --- Auth Endpoints ---
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {}
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' })
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' })
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password, // demo only
      isAdmin: email.toLowerCase().includes('admin'),
    })

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      wishlist: [],
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    // In a real application, you want a secure password check
    const user = await User.findOne({ email: email.toLowerCase(), password }).populate('wishlist')
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    res.json({
      token: `demo-${user._id}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        wishlist: user.wishlist || [],
      },
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// --- Orders API ---
app.post('/api/orders', async (req, res) => {
  try {
    const { items, subtotal, total, paymentMethod, customer } = req.body || {}

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'Order items are required.' })
    }

    const orderId = 'SG-' + Date.now().toString(36).toUpperCase()

    const order = await Order.create({
      orderId,
      items,
      subtotal: Number(subtotal) || 0,
      total: Number(total) || 0,
      paymentMethod: paymentMethod || 'card',
      customer: customer || {},
      status: 'Processing',
      history: [
        { label: 'Order placed', at: new Date().toISOString() },
        { label: 'Processing', at: new Date().toISOString() },
      ],
    })

    res.status(201).json({
      orderId: order.orderId,
      status: order.status,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// --- Admin Analytics & Orders ---
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 })
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 })
    res.json(orders)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

app.put('/api/admin/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body || {};
    const { id } = req.params;
    
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const order = await Order.findOneAndUpdate(
      { orderId: id }, 
      { 
        $set: { status },
        $push: { history: { label: status, at: new Date().toISOString() } }
      },
      { new: true }
    );
    
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch(error) {
    res.status(500).json({ error: 'Server error updating status' });
  }
})

app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params
    const order = await Order.findOne({ orderId: id })

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' })
    }

    res.json({
      orderId: order.orderId,
      status: order.status,
      createdAt: order.createdAt,
      itemsCount: Array.isArray(order.items) ? order.items.length : 0,
      paymentMethod: order.paymentMethod,
      history: order.history || [],
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// --- Products API ---
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({})

    // Send mapped payload to match frontend perfectly
    const mapped = products.map((p) => ({
      id: p.id,
      _id: p._id,
      name: p.name,
      price: p.price,
      badge: p.badge,
      image: p.image,
      seo_title: p.seo_title,
      seo_description: p.seo_description,
      description: p.description,
      keywords: p.keywords,
      alt_text: p.alt_text,
      slug: p.slug,
      category: p.category,
    }))

    res.json(mapped)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    const product = await Product.findOne({ id })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/products', async (req, res) => {
  try {
    const data = req.body || {}

    const newProduct = {
      id: data.id || Date.now().toString(),
      name: data.name || 'New Product',
      price: data.price || '₹0',
      badge: data.badge || '',
      image: data.image || '/images/default.png',
      seo_title: data.seo_title || '',
      seo_description: data.seo_description || '',
      description: data.description || '',
      keywords: data.keywords || '',
      alt_text: data.alt_text || '',
      slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, '-') || 'new-product',
      category: data.category || 'all'
    }

    const created = await Product.create(newProduct)
    res.status(201).json(created)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error adding product' })
  }
})

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body || {}

    const updated = await Product.findOneAndUpdate(
      { id },
      { $set: data },
      { new: true }
    )

    if (!updated) return res.status(404).json({ error: 'Product not found' })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: 'Server error updating product' })
  }
})

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await Product.findOneAndDelete({ id })

    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json({ success: true, message: 'Product deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting product' })
  }
})

// --- AI Auto SEO Routes (Modular Routing) ---
app.use('/api/seo', require('./seo/seoRouter'))
app.use('/api/products', require('./seo/seoRouter'))

// --- Get User Orders ---
app.get('/api/users/:id/orders', async (req, res) => {
  try {
    const orders = await Order.find({ 'customer.id': req.params.id }).sort({ createdAt: -1 })
    res.json(orders)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// --- Wishlist APIs ---

// 1. Get user wishlist
app.get('/api/users/:id/wishlist', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('wishlist')
    if (!user) return res.status(404).json({ error: 'User not found' })
    
    // Sort logic or map logic if needed as per UI
    res.json(user.wishlist || [])
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching wishlist' })
  }
})

// 2. Toggle wishlist item (Add or Remove)
app.post('/api/users/:id/wishlist', async (req, res) => {
  try {
    const { productId } = req.body || {}
    if (!productId) return res.status(400).json({ error: 'Product ID is required' })

    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const exists = user.wishlist.includes(productId)
    if (exists) {
      // Remove it
      user.wishlist = user.wishlist.filter(id => id.toString() !== productId)
    } else {
      // Add it
      user.wishlist.push(productId)
    }

    await user.save()
    // Populate and return updated list
    const updatedUser = await User.findById(req.params.id).populate('wishlist')
    res.json(updatedUser.wishlist)
  } catch (error) {
    res.status(500).json({ error: 'Server error updating wishlist' })
  }
})

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})

module.exports = app;
