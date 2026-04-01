import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import ProductManager from './ProductManager';
import './admin.css';

function DashboardOverview() {
    const [orders, setOrders] = useState([]);
    const [productsCount, setProductsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [managingOrder, setManagingOrder] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const ordersRes = await fetch('http://localhost:5000/api/admin/orders');
                const ordersData = await ordersRes.json();
                setOrders(ordersData);

                const productsRes = await fetch('http://localhost:5000/api/products');
                const productsData = await productsRes.json();
                setProductsCount(productsData.length);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const res = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                const updatedOrder = await res.json();
                setOrders(orders.map(o => o.orderId === orderId ? { ...o, status: updatedOrder.status } : o));
                setManagingOrder(prev => prev ? { ...prev, status: updatedOrder.status } : prev);
                alert(`Order marked as ${newStatus}`);
            } else {
                alert('Failed to update status');
            }
        } catch (err) {
            alert('Error connecting to server.');
        }
    };

    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const awaitingPayment = orders.filter(o => o.status === 'Processing').length;
    const activeIssues = orders.filter(o => o.status === 'Cancelled').length;

    if (loading) return <div className="admin-overview">Loading Dashboard Data...</div>;

    return (
        <div className="admin-overview">
            <div className="page-title-row">
                <div className="icon-box">🛡️</div>
                <h1>Admin Dashboard</h1>
            </div>

            <div className="admin-stats">
                <div className="stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-info">
                        <span className="label">Total Revenue</span>
                        <span className="value">Rs {totalRevenue.toLocaleString()}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💳</div>
                    <div className="stat-info">
                        <span className="label">Awaiting Payment</span>
                        <span className="value">{awaitingPayment}</span>
                    </div>
                </div>
                <div className="stat-card active">
                    <div className="stat-icon">📦</div>
                    <div className="stat-info">
                        <span className="label">Total Orders</span>
                        <span className="value">{orders.length}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-info">
                        <span className="label">Products</span>
                        <span className="value">{productsCount}</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-section">
                <div className="section-header">
                    <h2>Recent Orders</h2>
                    <button className="export-btn" onClick={() => window.print()}>📥 Print Report</button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Details</th>
                                <th>Date</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.slice(0, 10).map(order => (
                                <tr key={order._id}>
                                    <td>
                                        <strong>#{order.orderId}</strong>
                                    </td>
                                    <td>
                                        <div className="product-row-info">
                                            <span>{order.items?.length || 0} Items</span>
                                            <small style={{ display: 'block', color: '#64748b' }}>{order.customer?.name || 'Guest'}</small>
                                        </div>
                                    </td>
                                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td>Rs {(order.total || 0).toLocaleString()}</td>
                                    <td>
                                        <span className={`status-pill ${order.status?.toLowerCase().replace(' ', '-')}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="manage-btn" style={{ border: 'none', cursor: 'pointer' }} onClick={() => setManagingOrder(order)}>
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No orders found yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {managingOrder && (
                <div className="auth-overlay open" onClick={(e) => e.target === e.currentTarget && setManagingOrder(null)}>
                    <div className="auth-card" style={{ width: 500 }}>
                        <div className="auth-header">
                            <h2>Manage #{managingOrder.orderId}</h2>
                            <button className="close-btn" onClick={() => setManagingOrder(null)}>×</button>
                        </div>
                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 0.5rem' }}>Customer Details:</h4>
                                <p style={{ margin: '0.2rem 0' }}><strong>Name:</strong> {managingOrder.customer?.name}</p>
                                <p style={{ margin: '0.2rem 0' }}><strong>Email:</strong> {managingOrder.customer?.email}</p>
                                <p style={{ margin: '0.2rem 0' }}><strong>Address:</strong> {managingOrder.customer?.address || 'N/A'}</p>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 0.5rem' }}>Order Items:</h4>
                                <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                                    {managingOrder.items?.map((i, idx) => (
                                        <li key={idx} style={{ marginBottom: '0.25rem' }}>{i.qty}x {i.name} (Rs {i.price})</li>
                                    ))}
                                </ul>
                                <p style={{ margin: '1rem 0 0', fontWeight: 'bold', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                                    Total: Rs {(managingOrder.total || 0).toLocaleString()}
                                </p>
                            </div>

                            <div style={{ marginTop: '0.5rem' }}>
                                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Update Order Status</label>
                                <select
                                    className="track-input"
                                    style={{ width: '100%' }}
                                    value={managingOrder.status}
                                    onChange={(e) => updateOrderStatus(managingOrder.orderId, e.target.value)}
                                >
                                    <option value="Processing">Processing</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            <button className="add-to-cart-btn" style={{ marginTop: '1rem' }} onClick={() => setManagingOrder(null)}>Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function RevenueView() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5000/api/admin/orders')
            .then(res => res.json())
            .then(data => {
                setOrders(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = orders.length ? (totalRevenue / orders.length) : 0;

    if (loading) return <div style={{ padding: '2rem' }}>Loading Revenue Data...</div>;

    return (
        <div className="revenue-view">
            <div className="page-title-row">
                <div className="icon-box">📊</div>
                <h1>Revenue Analytics</h1>
            </div>

            <div className="admin-stats">
                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <span className="label">Gross Revenue</span>
                        <span className="value">Rs {totalRevenue.toLocaleString()}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-info">
                        <span className="label">Avg. Order Value</span>
                        <span className="value">Rs {avgOrderValue.toFixed(0)}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🛒</div>
                    <div className="stat-info">
                        <span className="label">Total Orders</span>
                        <span className="value">{orders.length}</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-section">
                <h3>Revenue by Transaction</h3>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Method</th>
                            <th>Items</th>
                            <th>Amount</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o._id}>
                                <td>#{o.orderId}</td>
                                <td><span className="badge-seo">{o.paymentMethod || 'card'}</span></td>
                                <td>{o.items?.length || 0} Products</td>
                                <td>Rs {(o.total || 0).toLocaleString()}</td>
                                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function UserManagementView() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5000/api/admin/users')
            .then(res => res.json())
            .then(data => {
                setUsers(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    if (loading) return <div style={{ padding: '2rem' }}>Loading Users...</div>;

    return (
        <div className="user-view">
            <div className="page-title-row">
                <div className="icon-box">👥</div>
                <h1>User Management</h1>
            </div>

            <div className="dashboard-section">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id}>
                                <td><strong>{u.name}</strong></td>
                                <td>{u.email}</td>
                                <td><span className="status-pill paid">Customer</span></td>
                                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No users registered yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AdminDashboard() {
    const location = useLocation();
    const [isDark, setIsDark] = useState(false);
    const currentUser = JSON.parse(localStorage.getItem('shopGalaxy_user_v1'));

    if (!currentUser || !currentUser.isAdmin) {
        return (
            <div style={{ textAlign: 'center', marginTop: '10rem', fontFamily: 'sans-serif' }}>
                <h2>Access Denied</h2>
                <p>You must be an admin to view this page.</p>
                <Link to="/" style={{ color: 'blue', textDecoration: 'underline' }}>Return to Home</Link>
            </div>
        );
    }

    const tabs = [
        { label: 'Orders', path: '/admin' },
        { label: 'Revenue', path: '/admin/revenue' },
        { label: 'Manage Products', path: '/admin/products' },
        { label: 'Customer Reviews', path: '/admin/reviews' },
        { label: 'User Management', path: '/admin/users' },
        { label: 'Student Verifications', path: '/admin/verifications' },
        { label: 'Promo Codes', path: '/admin/promos' },
    ];

    return (
        <div className={`admin-layout ${isDark ? 'dark-theme' : ''}`}>
            <header className="admin-header">
                <Link to="/" className="brand-logo">
                    <span style={{ fontSize: '1.5rem' }}>🛍️</span>
                    <span>ShopGalaxy</span>
                </Link>

                <div className="top-nav-actions">
                    <div className="nav-link-group">
                        <Link to="/" className="nav-link">🏠</Link>
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="nav-link"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                        >
                            {isDark ? '☀️' : '🌙'}
                        </button>
                        <Link to="/" className="nav-link">View Products</Link>
                        <Link to="/admin" className="nav-link active">Manage Dashboard</Link>
                    </div>
                    <div className="user-profile">
                        <span>Hi, <strong>{currentUser.name.split(' ')[0]}!</strong> ✅</span>
                        <img
                            src="https://img.icons8.com/bubbles/100/admin-settings-male.png"
                            alt="Admin"
                            className="user-img"
                            style={{ width: '45px', height: '45px', background: '#e2e8f0', borderRadius: '12px' }}
                        />
                    </div>
                </div>
            </header>

            <main className="admin-main">
                <nav className="admin-tabs">
                    {tabs.map(tab => (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            className={`tab-link ${location.pathname === tab.path ? 'active' : ''}`}
                        >
                            {tab.label === 'Promo Codes' ? '🏷️ ' + tab.label : tab.label}
                        </Link>
                    ))}
                </nav>

                <Routes>
                    <Route path="/" element={<DashboardOverview />} />
                    <Route path="/revenue" element={<RevenueView />} />
                    <Route path="/products" element={<ProductManager />} />
                    <Route path="/users" element={<UserManagementView />} />
                    <Route path="*" element={<div style={{ padding: '2rem', textAlign: 'center' }}>Component Under Development</div>} />
                </Routes>
            </main>
        </div>
    );
}

export default AdminDashboard;
