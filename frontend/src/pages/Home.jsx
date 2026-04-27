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

const CHATBOT_SUGGESTIONS = [
  'Show items under 3000',
  'Add Leather Backpack to cart',
  'Show me latest accessories',
  'How do I track my order?',
];

const COUPONS = {
  SAVE10: { label: '10% off', type: 'percent', value: 10 },
  SAVE200: { label: 'Rs 200 off', type: 'flat', value: 200 },
  NEWUSER: { label: '15% off', type: 'percent', value: 15 },
};

function parsePrice(priceStr) {
  if (typeof priceStr === 'number') return priceStr;
  return parseInt(String(priceStr).replace(/[^0-9]/g, ''), 10) || 0;
}

function formatPrice(amount) {
  return 'Rs ' + amount.toLocaleString('en-PK');
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPriceLimit(message) {
  const parseBudget = (value) => {
    const cleaned = String(value || '').replace(/,/g, '').trim();
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const match = message.match(/(?:under|below|less than|max(?:imum)?|upto|up to|cheaper than|within|at most|no more than|andar|kam|niche|neeche|tak)\s*(?:rs\.?\s*)?([\d,]{1,9})/i);
  if (match) return parseBudget(match[1]);

  const compactMatch = message.match(/(?:under|below|less than|within|at most|no more than|andar|tak)\s*([\d,]{1,9})/i);
  if (compactMatch) return parseBudget(compactMatch[1]);

  const afterNumberMatch = message.match(/([\d,]{1,9})\s*(?:ke\s*)?(?:under|andar|tak|se\s*kam|se\s*niche|se\s*neeche|below|less)/i);
  if (afterNumberMatch) return parseBudget(afterNumberMatch[1]);

  const anyNumberMatch = message.match(/\b([\d,]{1,9})\b/);
  const hasPriceIntent = /show|filter|items?|products?|cheeze|cheez|dikha|dikh|under|below|less|kam|andar|tak|budget|price/i.test(message);
  if (anyNumberMatch && hasPriceIntent) return parseBudget(anyNumberMatch[1]);

  return null;
}

function extractCouponCode(message) {
  const normalized = normalizeText(message).replace(/\s+/g, ' ').trim();
  const knownCodes = Object.keys(COUPONS);
  const foundKnownCode = knownCodes.find(code => normalized.includes(code.toLowerCase()));
  if (foundKnownCode) return foundKnownCode;

  const codeMatch = normalized.match(/\b([a-z]{4,12}\d{0,4})\b/i);
  if (codeMatch) {
    const upper = codeMatch[1].toUpperCase();
    if (COUPONS[upper]) return upper;
  }

  return null;
}

function findCategoryFromMessage(message) {
  const normalized = normalizeText(message);
  const matches = CATEGORIES.filter(category => category.key !== 'all' && normalized.includes(category.key.replace('-', ' ')));

  if (matches.length > 0) return matches[0].key;

  if (normalized.includes('shoe') || normalized.includes('sneaker')) return 'shoes';
  if (normalized.includes('hoodie') || normalized.includes('shirt') || normalized.includes('clothing')) return 'clothing';
  if (normalized.includes('perfume') || normalized.includes('fragrance')) return 'perfumes';
  if (normalized.includes('accessor')) return 'accessories';
  if (normalized.includes('bag')) return 'bags';
  if (normalized.includes('cover')) return 'phone-covers';
  if (normalized.includes('electronic') || normalized.includes('gadget') || normalized.includes('tech')) return 'electronics';

  return null;
}

function splitCartKeywords(message) {
  const normalized = normalizeText(message);
  return normalized
    .replace(/\b(add|put|place|buy|remove|delete|clear|from|to|cart|basket|wishlist|show|filter|under|below|less|than|max|maximum|upto|up|items?|thing|things|the|my)\b/g, ' ')
    .split(' ')
    .map(token => token.trim())
    .filter(Boolean);
}

function getProductMatchCandidates(products, message) {
  const normalized = normalizeText(message);
  const keywords = splitCartKeywords(message);

  const scored = products
    .map(product => {
      const productName = normalizeText(product.name);
      let score = 0;

      if (normalized.includes(productName)) score += 100;

      keywords.forEach(keyword => {
        if (keyword.length < 3) return;
        if (productName.includes(keyword)) score += keyword.length;
        if (normalized.includes(keyword) && productName.includes(keyword)) score += keyword.length * 2;
      });

      if (normalized.includes('sneaker') && productName.includes('sneaker')) score += 20;
      if (normalized.includes('shoe') && productName.includes('shoe')) score += 20;
      if (normalized.includes('watch') && productName.includes('watch')) score += 20;
      if (normalized.includes('bag') && productName.includes('bag')) score += 20;
      if (normalized.includes('headphone') && productName.includes('headphone')) score += 20;
      if (normalized.includes('hoodie') && productName.includes('hoodie')) score += 20;
      if (normalized.includes('sunglass') && productName.includes('sunglass')) score += 20;

      return { product, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored;
}

function getChatbotReply(message) {
  const text = normalizeText(message);

  if (text.includes('track') || text.includes('order')) {
    return 'Open the Track Order section below and enter your order ID. If you already placed an order on this device, I can use the saved order ID too.';
  }

  if (text.includes('checkout') || text.includes('payment') || text.includes('pay')) {
    return 'Add items to cart, open the cart button, then proceed to checkout. You can pay by card, COD, or UPI from the checkout form.';
  }

  if (text.includes('login') || text.includes('signup') || text.includes('account')) {
    return 'Use the Login or Sign Up buttons in the top bar. After signing in, you can view orders and wishlist items from the header.';
  }

  if (text.includes('discount') || text.includes('offer') || text.includes('sale')) {
    return 'There is no coupon system wired in right now, but the store is ready for it. I can still help you find the best product category.';
  }

  if (text.includes('wishlist') || text.includes('favorite')) {
    return 'Tap the heart button on any product card to save it. Your wishlist opens from the heart icon in the header.';
  }

  if (text.includes('cart')) {
    return 'Use the Add to Cart button on any product card. Then open the cart icon in the header to review items and checkout.';
  }

  return 'I can help with orders, coupons, cart, and product filters. You can type any budget like "show items under 4500" or "3000 ke andar products".';
}

function getChatbotActionSummary(action) {
  if (!action) return null;

  if (action.type === 'add') {
    return `Added ${action.product.name} to your cart.`;
  }

  if (action.type === 'remove') {
    return action.removedAll
      ? `Removed ${action.product.name} from your cart.`
      : `Reduced ${action.product.name} quantity in your cart.`;
  }

  if (action.type === 'filter-price') {
    return `Showing products under Rs ${action.limit.toLocaleString('en-PK')}.`;
  }

  if (action.type === 'filter-category') {
    return `Showing ${action.label} products.`;
  }

  if (action.type === 'clear-filters') {
    return 'Cleared all product filters.';
  }

  if (action.type === 'coupon-applied') {
    return `${action.code} applied. You saved ${formatPrice(action.discount)}.`;
  }

  if (action.type === 'coupon-cleared') {
    return 'Coupon removed from the cart.';
  }

  if (action.type === 'coupon-help') {
    return `Available coupons: ${Object.keys(COUPONS).join(', ')}.`;
  }

  return null;
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
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hi, I am your ShopGalaxy AI assistant! You can click on the FAQs below or try typing something like "Add classic sneakers to cart", or "Show products under 2000".' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [priceLimit, setPriceLimit] = useState(null);
  const [filterMessage, setFilterMessage] = useState('');
  const [lastChatProductId, setLastChatProductId] = useState(null);
  const [lastSuggestedProductIds, setLastSuggestedProductIds] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponInput, setCouponInput] = useState('');

  const productGridRef = useRef(null);
  const chatScrollRef = useRef(null);

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

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatOpen]);

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

  const removeOneFromCart = (productId) => {
    let removedAll = false;

    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (!existing) return prev;

      if (existing.qty <= 1) {
        removedAll = true;
        return prev.filter(item => item.id !== productId);
      }

      return prev.map(item => item.id === productId ? { ...item, qty: item.qty - 1 } : item);
    });

    return removedAll;
  };

  const clearFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setPriceLimit(null);
    setFilterMessage('');
  };

  const applyCoupon = (rawCode) => {
    const code = String(rawCode || '').trim().toUpperCase();
    const coupon = COUPONS[code];

    if (!code) {
      setAppliedCoupon(null);
      return { ok: false, message: 'Enter a coupon code first.' };
    }

    if (!coupon) {
      return { ok: false, message: 'Coupon code not recognized. Try SAVE10, SAVE200, or NEWUSER.' };
    }

    setAppliedCoupon({ code, ...coupon });
    return { ok: true, code, discount: coupon.type === 'percent' ? Math.round(cartSubtotal * (coupon.value / 100)) : coupon.value };
  };

  const clearCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
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

  const couponDiscount = appliedCoupon
    ? (appliedCoupon.type === 'percent'
      ? Math.round(cartSubtotal * (appliedCoupon.value / 100))
      : appliedCoupon.value)
    : 0;

  const cartTotal = Math.max(cartSubtotal - couponDiscount, 0);

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
      discount: couponDiscount,
      couponCode: appliedCoupon?.code || '',
      total: cartTotal, // Logic for shipping/tax can be added here
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

  const sendChatMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage = { id: Date.now(), sender: 'user', text: trimmed };
    const botMessage = { id: Date.now() + 1, sender: 'bot', text: getChatbotReply(trimmed) };

    setChatMessages(prev => [...prev, userMessage, botMessage]);
    setChatInput('');
  };

  const appendChatAction = (userText, botText, items = []) => {
    setChatMessages(prev => [
      ...prev,
      { id: Date.now(), sender: 'user', text: userText },
      { id: Date.now() + 1, sender: 'bot', text: botText, attachedProducts: items.slice(0, 4) },
    ]);
    setChatInput('');
  };

  const resolveChatProduct = (catalogProducts, rawMessage, isRemoveCommand) => {
    const productMatches = getProductMatchCandidates(catalogProducts, rawMessage);
    if (productMatches[0]?.product) return productMatches[0].product;

    const refersCurrentItem = /(this item|yeh item|ye item|is item|current item)/i.test(rawMessage);
    const secondItemRef = /(second item|2nd item|dusra item|doosra item)/i.test(rawMessage);
    const firstItemRef = /(first item|1st item|pehla item|pahla item)/i.test(rawMessage) || refersCurrentItem;

    if (lastSuggestedProductIds.length > 0 && (firstItemRef || secondItemRef)) {
      const index = secondItemRef ? 1 : 0;
      const targetId = lastSuggestedProductIds[index] || lastSuggestedProductIds[0];
      const suggested = catalogProducts.find(p => p.id === targetId);
      if (suggested) return suggested;
    }

    if (refersCurrentItem && lastChatProductId) {
      const fromLast = catalogProducts.find(p => p.id === lastChatProductId);
      if (fromLast) return fromLast;
    }

    if (refersCurrentItem && cart.length === 1) {
      const singleCartProduct = catalogProducts.find(p => p.id === cart[0].id);
      if (singleCartProduct) return singleCartProduct;
    }

    if (isRemoveCommand && cart.length === 1) {
      const onlyCartProduct = catalogProducts.find(p => p.id === cart[0].id);
      if (onlyCartProduct) return onlyCartProduct;
    }

    return null;
  };

  const buildProductPreviewText = (items, limitText) => {
    if (!Array.isArray(items) || items.length === 0) {
      return `No products found ${limitText}. Try a higher budget or clear filters.`;
    }

    const names = items.slice(0, 4).map(item => item.name).join(', ');
    const moreCount = items.length - Math.min(items.length, 4);
    const moreText = moreCount > 0 ? ` and ${moreCount} more.` : '.';
    return `Showing ${items.length} products ${limitText}: ${names}${moreText}`;
  };

  const processChatInput = (rawInput) => {
    const rawMessage = String(rawInput || '').trim();
    if (!rawMessage) return;

    const catalogProducts = products;

    const normalized = normalizeText(rawMessage);
    const category = findCategoryFromMessage(rawMessage);
    const limit = extractPriceLimit(rawMessage);
    const couponCode = extractCouponCode(rawMessage);
    const isClearCommand = normalized.includes('clear filter') || normalized.includes('reset filter') || normalized.includes('show all') || normalized.includes('remove filters');
    const isAddCommand = normalized.includes('add ') || normalized.startsWith('add') || normalized.includes('put ') || normalized.includes('cart me') || normalized.includes('cart mein');
    const isRemoveCommand = normalized.includes('remove ') || normalized.startsWith('remove') || normalized.includes('delete ') || normalized.includes('hata') || normalized.includes('nikal');
    const isCouponCommand = normalized.includes('coupon') || normalized.includes('promo') || normalized.includes('discount') || normalized.includes('code');
    const isCouponClearCommand = normalized.includes('remove coupon') || normalized.includes('clear coupon') || normalized.includes('coupon hata') || normalized.includes('coupon clear');

    const matchedProduct = resolveChatProduct(catalogProducts, rawMessage, isRemoveCommand);
    let actionSummary = null;

    if ((isAddCommand || isRemoveCommand || limit || category) && catalogProducts.length === 0) {
      appendChatAction(rawMessage, 'Products are still loading. Please try again in a moment.');
      return;
    }

    if (isClearCommand) {
      clearFilters();
      actionSummary = getChatbotActionSummary({ type: 'clear-filters' });
    } else if (isAddCommand && matchedProduct) {
      addToCart(matchedProduct.id);
      setLastChatProductId(matchedProduct.id);
      setLastSuggestedProductIds([matchedProduct.id]);
      actionSummary = getChatbotActionSummary({ type: 'add', product: matchedProduct });
    } else if (isRemoveCommand && matchedProduct) {
      const removedAll = removeOneFromCart(matchedProduct.id);
      setLastChatProductId(matchedProduct.id);
      setLastSuggestedProductIds([matchedProduct.id]);
      actionSummary = getChatbotActionSummary({ type: 'remove', product: matchedProduct, removedAll });
    } else if (isAddCommand && !matchedProduct) {
      actionSummary = 'Can you specify the product name? For example: "Add classic white sneakers to cart".';
    } else if (isRemoveCommand && !matchedProduct) {
      actionSummary = 'Which item do you want to remove? Please write the product name, for example: "Remove hoodie from cart".';
    } else if (isCouponClearCommand) {
      clearCoupon();
      actionSummary = getChatbotActionSummary({ type: 'coupon-cleared' });
    } else if (isCouponCommand && couponCode) {
      const result = applyCoupon(couponCode);
      actionSummary = result.ok
        ? getChatbotActionSummary({ type: 'coupon-applied', code: result.code, discount: result.discount })
        : result.message;
    } else if (isCouponCommand && !couponCode) {
      actionSummary = getChatbotActionSummary({ type: 'coupon-help' });
    } else if (limit) {
      const matchedByPrice = catalogProducts.filter(product => product.numericPrice <= limit);
      setPriceLimit(limit);
      setActiveCategory('all');
      setSearchQuery('');
      setFilterMessage(`Showing products under Rs ${limit.toLocaleString('en-PK')}.`);
      setLastSuggestedProductIds(matchedByPrice.slice(0, 5).map(item => item.id));
      if (matchedByPrice[0]) setLastChatProductId(matchedByPrice[0].id);
      appendChatAction(rawMessage, `Here are some products under Rs ${limit.toLocaleString('en-PK')}:`, matchedByPrice);
      return;
    } else if (category) {
      const matchedByCategory = catalogProducts.filter(product => product.category === category);
      const categoryLabel = CATEGORIES.find(item => item.key === category)?.label || category;
      setActiveCategory(category);
      setPriceLimit(null);
      setFilterMessage(`Showing ${categoryLabel} products.`);
      setLastSuggestedProductIds(matchedByCategory.slice(0, 5).map(item => item.id));
      if (matchedByCategory[0]) setLastChatProductId(matchedByCategory[0].id);
      appendChatAction(rawMessage, `Check out our popular ${categoryLabel}:`, matchedByCategory);
      return;
    }

    if (actionSummary) {
      appendChatAction(rawMessage, actionSummary);
      return;
    }

    sendChatMessage(rawMessage);
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    processChatInput(chatInput);
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = priceLimit === null || p.numericPrice <= priceLimit;
    return matchesCat && matchesSearch && matchesPrice;
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
        {(activeCategory !== 'all' || priceLimit !== null || searchQuery) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Active filters:</span>
            {activeCategory !== 'all' && (
              <button className="category-pill active" type="button" onClick={() => setActiveCategory('all')}>
                {CATEGORIES.find(cat => cat.key === activeCategory)?.label || activeCategory}
              </button>
            )}
            {priceLimit !== null && (
              <button className="category-pill active" type="button" onClick={() => setPriceLimit(null)}>
                Under Rs {priceLimit.toLocaleString('en-PK')}
              </button>
            )}
            {searchQuery && (
              <button className="category-pill active" type="button" onClick={() => setSearchQuery('')}>
                Search: {searchQuery}
              </button>
            )}
            <button className="category-pill" type="button" onClick={clearFilters}>
              Clear all
            </button>
          </div>
        )}

        {filterMessage && (
          <p style={{ marginTop: '1rem', marginBottom: 0, color: 'var(--primary-dark)', fontWeight: 600 }}>
            {filterMessage}
          </p>
        )}

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
                  <div style={{display: 'flex', gap: '0.75rem', marginTop: '0.75rem'}}>
                    <input
                      className="track-input"
                      placeholder="Coupon code e.g. SAVE10"
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="hero-btn ghost"
                      style={{padding: '0.75rem 1rem', whiteSpace: 'nowrap'}}
                      onClick={() => {
                        const result = applyCoupon(couponInput);
                        if (!result.ok) alert(result.message);
                      }}
                    >
                      Apply
                    </button>
                    {appliedCoupon && (
                      <button
                        type="button"
                        className="hero-btn ghost"
                        style={{padding: '0.75rem 1rem', whiteSpace: 'nowrap'}}
                        onClick={clearCoupon}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {appliedCoupon && (
                    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', color: 'var(--primary-dark)'}}>
                      <span>Coupon {appliedCoupon.code}</span>
                      <span>- {formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem'}}>
                    <strong>Total</strong>
                    <strong>{formatPrice(cartTotal)}</strong>
                  </div>
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
                    <strong>{formatPrice(cartTotal)}</strong>
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

      {chatOpen && (
        <div className="new-chatbot-ui" role="dialog" aria-label="ShopGalaxy chatbot">
          <div className="nx-chat-header">
            <div className="nx-chat-title">
              <span className="nx-bot-avatar">🤖</span>
              <div>
                <h4>ShopGalaxy Assistant</h4>
                <p>Online & Ready to Help</p>
              </div>
            </div>
            <button className="nx-chat-close" onClick={() => setChatOpen(false)}>×</button>
          </div>

          <div className="nx-chat-messages" ref={chatScrollRef}>
             {filterMessage && (
               <div style={{ alignSelf: 'center', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-dark)', padding: '0.4rem 0.8rem', borderRadius: '1rem', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                 {filterMessage}
               </div>
             )}
            {chatMessages.map(message => (
              <div key={message.id} className={`nx-msg-wrapper ${message.sender}`}>
                <div className="nx-msg-bubble">
                  {message.text}
                </div>
                {message.attachedProducts && message.attachedProducts.length > 0 && (
                  <div className="nx-msg-products hide-scroll">
                    {message.attachedProducts.map(p => (
                      <div key={p.id} className="nx-product-card" onClick={() => addToCart(p.id)}>
                        <img src={p.image} alt={p.name} />
                        <div className="nx-product-info">
                          <p className="nx-name">{p.name}</p>
                          <p className="nx-price">{formatPrice(p.numericPrice)}</p>
                          <button className="nx-add-btn">+ Add</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            .hide-scroll::-webkit-scrollbar { height: 0px; width: 0px; display: none; }
            .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
          `}} />

          <div className="nx-chat-suggestions hide-scroll">
            {CHATBOT_SUGGESTIONS.map(suggestion => (
              <button key={suggestion} type="button" onClick={() => processChatInput(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>

          <form className="nx-chat-form" onSubmit={handleChatSubmit}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask anything..."
            />
            <button type="submit">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      )}

      <button
        className="nx-chatbot-launcher"
        onClick={() => setChatOpen(prev => !prev)}
      >
        {chatOpen ? '✕' : '💬'}
      </button>

      {showScrollTop && <button className="scroll-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>}

      <footer style={{marginTop: '5rem', textAlign: 'center', color: '#666', padding: '2rem'}}>
        <p>© {new Date().getFullYear()} ShopGalaxy. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
