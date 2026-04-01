import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import '../index.css';

const API = 'http://localhost:5000';

const FALLBACK_PRODUCTS = [
  { id: 'p1', name: 'Classic White Sneakers', price: 'Rs 2,499', numericPrice: 2499, badge: 'New', image: 'https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=800', category: 'shoes' },
  { id: 'p2', name: 'Minimalist Wrist Watch', price: 'Rs 3,299', numericPrice: 3299, badge: 'Best Seller', image: 'https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=800', category: 'accessories' },
  { id: 'p3', name: 'Leather Backpack', price: 'Rs 1,899', numericPrice: 1899, badge: 'Limited', image: 'https://images.pexels.com/photos/1294731/pexels-photo-1294731.jpeg?auto=compress&cs=tinysrgb&w=800', category: 'bags' },
  { id: 'p4', name: 'Wireless Headphones', price: 'Rs 4,799', numericPrice: 4799, badge: 'Trending', image: 'https://images.pexels.com/photos/3394651/pexels-photo-3394651.jpeg?auto=compress&cs=tinysrgb&w=800', category: 'electronics' },
  { id: 'p5', name: 'Cozy Oversized Hoodie', price: 'Rs 3,999', numericPrice: 3999, badge: 'Winter drop', image: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=800', category: 'clothing' },
  { id: 'p6', name: 'Retro Round Sunglasses', price: 'Rs 1,299', numericPrice: 1299, badge: 'Hot', image: 'https://images.pexels.com/photos/157675/fashion-men-s-individuality-black-and-white-157675.jpeg?auto=compress&cs=tinysrgb&w=800', category: 'accessories' },
];

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'shoes', label: 'Shoes' },
  { key: 'clothing', label: 'Shirts & hoodies' },
  { key: 'perfumes', label: 'Perfumes' },
  { key: 'accessories', label: 'Accessories' },
  { key: 'bags', label: 'Bags' },
  { key: 'phone-covers', label: 'Phone covers' },
  { key: 'electronics', label: 'Electronics' },
];

function parsePrice(priceStr) {
  if (typeof priceStr === 'number') return priceStr;
  return parseInt(String(priceStr).replace(/[^0-9]/g, ''), 10) || 0;
}

function formatPrice(amount) {
  return 'Rs ' + amount.toLocaleString('en-PK');
}

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('shopGalaxy_cart_v1') || '[]'));
  const [cartOpen, setCartOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('shopGalaxy_user_v1') || 'null'));
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem('shopGalaxy_wishlist') || '[]'));
  const [trackData, setTrackData] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackMsg, setTrackMsg] = useState('');
  const [manualOrderId, setManualOrderId] = useState('');
  const [orderMsg, setOrderMsg] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    address: '',
    paymentMethod: 'card'
  });
  const [myOrdersOpen, setMyOrdersOpen] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  const productGridRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('shopGalaxy_cart_v1', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('shopGalaxy_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.pageYOffset > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchProducts = () => {
    fetch(`${API}/api/products`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data.map(p => ({ ...p, numericPrice: parsePrice(p.price) })));
        } else {
          setProducts(FALLBACK_PRODUCTS);
        }
        setLoading(false);
      })
      .catch(() => {
        setProducts(FALLBACK_PRODUCTS);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const scrollToProducts = () => {
    if (productGridRef.current) {
      productGridRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const addToCart = (productId) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === productId);
      if (existing) return prev.map(i => i.id === productId ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: productId, qty: 1 }];
    });
    setCartOpen(true);
  };

  const toggleWishlist = async (productId) => {
    // Local update first for snappy UI
    const isPresent = wishlist.includes(productId);
    const updated = isPresent ? wishlist.filter(id => id !== productId) : [...wishlist, productId];
    setWishlist(updated);

    // Backend sync if user is logged in
    if (currentUser) {
      try {
        const p = products.find(prod => prod.id === productId);
        const targetId = p?._id || productId; // Fallback to provided id if _id doesn't exist
        
        await fetch(`${API}/api/users/${currentUser._id || currentUser.id}/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: targetId })
        });
      } catch (err) {
        console.error('Wishlist sync failed');
      }
    }
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQty = (id, delta) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const cartSubtotal = cart.reduce((sum, item) => {
    const p = products.find(prod => prod.id === item.id);
    return sum + (p ? p.numericPrice : 0) * item.qty;
  }, 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!cart.length) return;
    
    const orderData = {
      items: cart.map(item => {
        const p = products.find(prod => prod.id === item.id);
        return {
          id: item.id,
          name: p?.name || 'Product',
          price: p?.price || 'Rs 0',
          qty: item.qty
        };
      }),
      subtotal: cartSubtotal,
      total: cartSubtotal, // Logic for shipping/tax can be added here
      paymentMethod: checkoutForm.paymentMethod,
      customer: {
        id: currentUser?._id || currentUser?.id,
        name: checkoutForm.name,
        email: checkoutForm.email,
        address: checkoutForm.address
      }
    };

    try {
      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (!res.ok) throw new Error('Failed to place order.');
      
      const data = await res.json();
      localStorage.setItem('shopGalaxy_lastOrderId', data.orderId);
      setCart([]);
      setShowCheckout(false);
      setCartOpen(false);
      alert(`Order Placed! ID: ${data.orderId}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = authTab === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const payload = authTab === 'login' 
      ? { email: checkoutForm.email, password: checkoutForm.password } 
      : { name: checkoutForm.name, email: checkoutForm.email, password: checkoutForm.password };

    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Auth failed');
      
      const user = data.user || data;
      setCurrentUser(user);
      localStorage.setItem('shopGalaxy_user_v1', JSON.stringify(user));
      
      // Update wishlist from backend (mapping Mongo objects to local IDs)
      if (user.wishlist && Array.isArray(user.wishlist)) {
        const ids = user.wishlist.map(p => typeof p === 'string' ? p : p.id).filter(id => !!id);
        setWishlist(ids);
      }
      
      setAuthOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('shopGalaxy_user_v1');
    setWishlist([]); // Clear wishlist on logout
    setCheckoutForm({ name: '', email: '', address: '', paymentMethod: 'card' });
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    let id = manualOrderId || localStorage.getItem('shopGalaxy_lastOrderId');
    if (!id) { setTrackMsg('Please enter an Order ID.'); return; }
    
    // Sanitize ID (Remove #, spaces, and make uppercase)
    id = id.replace('#', '').trim().toUpperCase();
    
    setTrackLoading(true); setTrackMsg(''); setTrackData(null);
    try {
      const res = await fetch(`${API}/api/orders/${id}`);
      if (!res.ok) throw new Error('Order not found.');
      const data = await res.json();
      setTrackData(data);
    } catch (err) { setTrackMsg(err.message); }
    setTrackLoading(false);
  };

  const fetchMyOrders = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API}/api/users/${currentUser._id || currentUser.id}/orders`);
      const data = await res.json();
      setMyOrders(data);
      setMyOrdersOpen(true);
    } catch (err) {
      alert('Failed to load orders.');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const renderProduct = (p) => (
    <div key={p.id} className="product-card">
      <div className="product-image-wrapper">
        <img src={p.image} alt={p.name} className="product-image" loading="lazy" />
        {p.badge && <span className="product-badge">{p.badge}</span>}
        <button className="wishlist-btn" onClick={() => toggleWishlist(p.id)}>
          {wishlist.includes(p.id) ? '❤️' : '🤍'}
        </button>
      </div>
      <div className="product-info">
        <h3>{p.name}</h3>
        <p className="product-price">{formatPrice(p.numericPrice)}</p>
        <button className="add-to-cart-btn" onClick={() => addToCart(p.id)}>Add to Cart</button>
      </div>
    </div>
  );

  return (
    <div className="app">
      <Helmet>
        <title>{activeCategory === 'all' ? 'ShopGalaxy - Premium E-Commerce Store' : `ShopGalaxy - Buy ${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}`}</title>
        <meta name="description" content={`Explore our curated collection of ${activeCategory === 'all' ? 'premium shoes, electronics, and fashion' : activeCategory}. High quality products with fast delivery.`} />
        <meta name="keywords" content={`ecommerce, shopping, ${activeCategory}, premium brands, ShopGalaxy`} />
      </Helmet>

      <header className="navbar">
        <div className="navbar-left">
          <span className="brand-logo">🛍️</span>
          <span className="brand-name">ShopGalaxy</span>
        </div>
        <div className="navbar-center">
          <input className="search-input" placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="navbar-right">
          {currentUser ? (
            <>
              <span style={{fontSize: '0.9rem', fontWeight: 600}}>Hi, {currentUser.name.split(' ')[0]} 👋</span>
              <button className="nav-btn outline" onClick={fetchMyOrders}>My Orders</button>
              <button className="nav-btn outline" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="nav-btn outline" onClick={() => { setAuthTab('login'); setAuthOpen(true); }}>Login</button>
              <button className="nav-btn primary" onClick={() => { setAuthTab('signup'); setAuthOpen(true); }}>Sign Up</button>
            </>
          )}
          <Link to="/admin" className="nav-btn outline" style={{textDecoration: 'none'}}>Admin</Link>
          <button className="cart-btn wishlist-nav" onClick={() => setWishlistOpen(true)}>
            <span>❤️</span>
            {wishlist.length > 0 && <span className="cart-count wishlist-count">{wishlist.length}</span>}
          </button>
          <button className="cart-btn" onClick={() => setCartOpen(true)}>
            <span>🛒</span>
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <h1>Discover your <span className="highlight">perfect style</span></h1>
            <p className="hero-subtitle">Premium collections curated for the modern lifestyle. Shop the latest trends with ShopGalaxy.</p>
            <div className="hero-actions">
              <button className="hero-btn primary" onClick={scrollToProducts}>Shop Now</button>
              <button className="hero-btn ghost" onClick={() => { setActiveCategory('all'); scrollToProducts(); }}>View All</button>
            </div>
            <div className="hero-metrics" style={{ display: 'flex', gap: '2rem', marginTop: '3rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '2rem' }}>
              <div><h3 style={{ margin: 0, fontSize: '1.5rem' }}>10K+</h3><p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Happy Customers</p></div>
              <div><h3 style={{ margin: 0, fontSize: '1.5rem' }}>4.9★</h3><p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Average Rating</p></div>
              <div><h3 style={{ margin: 0, fontSize: '1.5rem' }}>2-3 days</h3><p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Fast Delivery</p></div>
            </div>
          </div>
          <div className="hero-card" style={{ background: 'linear-gradient(135deg, #fff 0%, #f0f7ff 100%)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%' }}></div>
            <span className="badge" style={{ background: '#000', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>TODAY'S PICK</span>
            <h3 style={{ marginTop: '1rem', fontSize: '1.4rem' }}>Street Style Essentials</h3>
            <p style={{ fontSize: '0.9rem', color: '#444' }}>Curated outfits with shoes, bags and accessories that go together perfectly.</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              {['#streetwear', '#minimal', '#unisex'].map(tag => (
                <span key={tag} style={{ fontSize: '0.8rem', color: '#666', background: '#eee', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{tag}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Premium Curated Sections */}
        {!loading && (
          <div style={{ marginTop: '4rem', marginBottom: '4rem' }}>
            <section className="section-header">
              <h2>Trending Accessories & Perfumes ⌚</h2>
            </section>
            <div className="premium-scroller">
              {products
                .filter(p => ['accessories', 'perfumes', 'bags', 'phone-covers'].includes(p.category))
                .slice(0, 6)
                .map(renderProduct)}
            </div>

            <section className="section-header" style={{ marginTop: '4rem' }}>
              <h2>Streetwear & Style 👟</h2>
            </section>
            <div className="product-grid">
              {products
                .filter(p => ['shoes', 'clothing'].includes(p.category))
                .slice(0, 4)
                .map(renderProduct)}
            </div>
            
            <section className="section-header" style={{ marginTop: '4rem' }}>
              <h2>Tech & Gadgets 🎧</h2>
            </section>
            <div className="product-grid">
              {products
                .filter(p => ['electronics'].includes(p.category))
                .slice(0, 4)
                .map(renderProduct)}
            </div>
          </div>
        )}

        <section className="section-header" ref={productGridRef}>
          <h2>Browse All Collections 🛒</h2>
        </section>

        <div className="category-bar">
          {CATEGORIES.map(cat => (
            <button key={cat.key} className={`category-pill ${activeCategory === cat.key ? 'active' : ''}`} onClick={() => setActiveCategory(cat.key)}>
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? <p style={{textAlign: 'center', padding: '4rem 0'}}>Loading latest trends...</p> : (
          <div className="product-grid" style={{ paddingBottom: '4rem' }}>
            {filteredProducts.map(renderProduct)}
          </div>
        )}

        <section className="track-section">
          <h2>📦 Track Order</h2>
          <p>Easily check your order status by typing your order ID below.</p>
          <form className="track-input-group" onSubmit={handleTrackOrder}>
            <input className="track-input" placeholder="Enter Order ID e.g. SG-MN792B6O" value={manualOrderId} onChange={e => setManualOrderId(e.target.value)} />
            <button className="track-btn" type="submit">{trackLoading ? '...' : 'Track'}</button>
          </form>
          {trackMsg && <p style={{color: 'red', marginTop: '1rem'}}>{trackMsg}</p>}
          {trackData && (
            <div className="track-card">
              <div className="track-card-row"><span>Order ID</span><span><strong>#{trackData.orderId}</strong></span></div>
              <div className="track-card-row"><span>Payment</span><span>{trackData.paymentMethod || 'N/A'}</span></div>
              <div className="track-card-row"><span>Date</span><span>{trackData.createdAt ? new Date(trackData.createdAt).toLocaleDateString() : 'N/A'}</span></div>
              <div className="track-card-row"><span>Items</span><span>{trackData.itemsCount || 0} items</span></div>
              <div className="track-card-row" style={{borderBottom:'none'}}>
                <span>Status</span>
                <span className="track-status">{trackData.status || 'Processing'}</span>
              </div>
              
              {/* Timeline */}
              <div style={{marginTop:'1.5rem'}}>
                <p style={{fontWeight:600, marginBottom:'0.75rem'}}>Order Timeline:</p>
                {(trackData.history || []).map((h, i) => (
                  <div key={i} style={{display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.5rem'}}>
                    <span style={{width:10,height:10,borderRadius:'50%',background:'#6366f1',flexShrink:0,display:'inline-block'}}></span>
                    <span style={{fontSize:'0.9rem'}}><strong>{h.label}</strong> — {h.at ? new Date(h.at).toLocaleString() : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {cartOpen && (
        <div className="cart-overlay open" onClick={e => e.target === e.currentTarget && setCartOpen(false)}>
          <div className="cart-panel">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h2>{showCheckout ? 'Checkout' : 'Your Cart'}</h2>
              <button 
                onClick={() => { setCartOpen(false); setShowCheckout(false); }}
                style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b'}}
              >
                ×
              </button>
            </div>

            {!showCheckout ? (
              <>
                <div style={{flex: 1, overflowY: 'auto'}}>
                  {cart.length === 0 ? (
                    <p style={{textAlign: 'center', color: '#64748b', marginTop: '2rem'}}>Your cart is empty.</p>
                  ) : cart.map(item => {
                    const p = products.find(prod => prod.id === item.id);
                    if(!p) return null;
                    return (
                      <div key={item.id} style={{display: 'flex', gap: '1rem', borderBottom: '1px solid #eee', padding: '1rem 0'}}>
                        <img src={p.image} style={{width: 60, height: 60, borderRadius: 8, objectFit: 'cover'}} />
                        <div style={{flex: 1}}>
                          <h4>{p.name}</h4>
                          <p>{formatPrice(p.numericPrice)}</p>
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                          <button style={{width: 24, height: 24}} onClick={() => updateQty(item.id, -1)}>-</button>
                          <span>{item.qty}</span>
                          <button style={{width: 24, height: 24}} onClick={() => updateQty(item.id, 1)}>+</button>
                          <button style={{marginLeft: '0.5rem', color: 'red', background: 'none', border: 'none'}} onClick={() => removeFromCart(item.id)}>🗑️</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{marginTop: '2rem', borderTop: '2px solid #eee', paddingTop: '1rem'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between'}}><h3>Subtotal</h3><h3>{formatPrice(cartSubtotal)}</h3></div>
                  <button 
                    className="add-to-cart-btn" 
                    style={{marginTop: '1rem'}} 
                    disabled={cart.length === 0}
                    onClick={() => setShowCheckout(true)}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleCheckout} style={{display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden'}}>
                <div style={{flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem', paddingBottom: '1rem'}}>
                  <div className="form-group" style={{marginBottom: '0.5rem'}}>
                    <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem'}}>Full Name</label>
                    <input 
                      type="text" 
                      className="track-input" 
                      value={checkoutForm.name} 
                      onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{marginBottom: '0.5rem'}}>
                    <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem'}}>Email Address</label>
                    <input 
                      type="email" 
                      className="track-input" 
                      value={checkoutForm.email} 
                      onChange={e => setCheckoutForm({...checkoutForm, email: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{marginBottom: '0.5rem'}}>
                    <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem'}}>Shipping Address</label>
                    <textarea 
                      className="track-input" 
                      rows="3" 
                      value={checkoutForm.address} 
                      onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{marginBottom: '0.5rem'}}>
                    <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem'}}>Payment Method</label>
                    <select 
                      className="track-input"
                      value={checkoutForm.paymentMethod}
                      onChange={e => setCheckoutForm({...checkoutForm, paymentMethod: e.target.value})}
                    >
                      <option value="card">Credit / Debit Card</option>
                      <option value="cod">Cash on Delivery</option>
                      <option value="upi">UPI / Digital Wallet</option>
                    </select>
                  </div>
                </div>

                <div style={{borderTop: '2px solid #eee', paddingTop: '1rem', background: '#fff'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                    <strong>Total Amount</strong>
                    <strong>{formatPrice(cartSubtotal)}</strong>
                  </div>
                  <div style={{display: 'flex', gap: '1rem'}}>
                    <button 
                      type="button" 
                      className="hero-btn ghost" 
                      style={{flex: 1, padding: '0.75rem'}}
                      onClick={() => setShowCheckout(false)}
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      className="add-to-cart-btn" 
                      style={{flex: 2, margin: 0}}
                    >
                      Place Order
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {authOpen && (
        <div className="auth-overlay open" onClick={e => e.target === e.currentTarget && setAuthOpen(false)}>
          <div className="auth-card">
            <div className="auth-header">
              <h2>{authTab === 'login' ? 'Welcome Back' : 'Join ShopGalaxy'}</h2>
              <button className="close-btn" onClick={() => setAuthOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {authTab === 'signup' && (
                <input 
                  type="text" className="track-input" placeholder="Full Name" required 
                  value={checkoutForm.name} onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})}
                />
              )}
              <input 
                type="email" className="track-input" placeholder="Email Address" required 
                value={checkoutForm.email} onChange={e => setCheckoutForm({...checkoutForm, email: e.target.value})}
              />
              <input 
                type="password" className="track-input" placeholder="Password" required 
                value={checkoutForm.password || ''} onChange={e => setCheckoutForm({...checkoutForm, password: e.target.value})}
              />
              <button type="submit" className="add-to-cart-btn" style={{ marginTop: '1rem' }}>
                {authTab === 'login' ? 'Login' : 'Sign Up'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#64748b' }}>
              {authTab === 'login' ? "Don't have an account? " : "Already have an account? "}
              <span 
                style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setAuthTab(authTab === 'login' ? 'signup' : 'login')}
              >
                {authTab === 'login' ? 'Sign Up' : 'Login'}
              </span>
            </p>
          </div>
        </div>
      )}

      {myOrdersOpen && (
        <div className="cart-overlay open" onClick={e => e.target === e.currentTarget && setMyOrdersOpen(false)}>
          <div className="cart-panel">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h2>Your Orders</h2>
              <button onClick={() => setMyOrdersOpen(false)} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b'}}>×</button>
            </div>
            <div style={{flex: 1, overflowY: 'auto'}}>
              {myOrders.length === 0 ? <p>No orders found.</p> : myOrders.map(o => (
                <div key={o._id} style={{padding: '1rem', border: '1px solid #eee', borderRadius: 8, marginBottom: '1rem'}}>
                  <strong>Order #{o.orderId}</strong>
                  <br/>
                  <small>Status: <span className="track-status">{o.status}</span> | Total: {formatPrice(o.total)}</small>
                  <p style={{margin: '0.5rem 0 0', fontSize: '0.9rem'}}>Items: {o.items.map(i => i.name).join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {wishlistOpen && (
        <div className="cart-overlay open" onClick={e => e.target === e.currentTarget && setWishlistOpen(false)}>
          <div className="cart-panel">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h2>My Wishlist ❤️</h2>
              <button onClick={() => setWishlistOpen(false)} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b'}}>×</button>
            </div>
            <div style={{flex: 1, overflowY: 'auto'}}>
              {wishlist.length === 0 ? (
                <p style={{textAlign: 'center', color: '#64748b', marginTop: '2rem'}}>Your wishlist is empty.</p>
              ) : (
                wishlist.map(id => {
                  const p = products.find(prod => prod.id === id);
                  if(!p) return null;
                  return (
                    <div key={id} style={{display: 'flex', gap: '1rem', borderBottom: '1px solid #eee', padding: '1rem 0'}}>
                      <img src={p.image} style={{width: 60, height: 60, borderRadius: 8, objectFit: 'cover'}} />
                      <div style={{flex: 1}}>
                        <h4>{p.name}</h4>
                        <p>{formatPrice(p.numericPrice)}</p>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <button className="add-to-cart-btn" style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem'}} onClick={() => addToCart(p.id)}>Add to Cart</button>
                        <button style={{color: 'red', background: 'none', border: 'none'}} onClick={() => toggleWishlist(p.id)}>🗑️</button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {showScrollTop && <button className="scroll-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>}

      <footer style={{marginTop: '5rem', textAlign: 'center', color: '#666', padding: '2rem'}}>
        <p>© {new Date().getFullYear()} ShopGalaxy. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
