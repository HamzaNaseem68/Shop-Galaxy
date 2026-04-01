import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

function ProductManager() {
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        badge: '',
        image: '',
        category: 'all',
        description: '',
        metaTitle: '',
        metaDescription: '',
        keywords: '',
        slug: ''
    });
    const [editingId, setEditingId] = useState(null);

    const fetchProducts = () => {
        fetch('http://localhost:5000/api/products')
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const isEdit = !!editingId;
        const url = isEdit ? `http://localhost:5000/api/products/${editingId}` : 'http://localhost:5000/api/products';
        const method = isEdit ? 'PUT' : 'POST';

        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
            .then(res => res.json())
            .then(() => {
                setFormData({ name: '', price: '', badge: '', image: '', category: 'all', description: '', metaTitle: '', metaDescription: '', keywords: '', slug: '' });
                setEditingId(null);
                fetchProducts();
            })
            .catch(err => console.error(err));
    };

    const handleEdit = (p) => {
        setEditingId(p.id);
        setFormData({
            name: p.name || '',
            price: p.price || '',
            badge: p.badge || '',
            image: p.image || '',
            category: p.category || 'all',
            description: p.description || '',
            metaTitle: p.metaTitle || '',
            metaDescription: p.metaDescription || '',
            keywords: p.keywords || '',
            slug: p.slug || ''
        });
    };

    const handleDelete = (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        fetch(`http://localhost:5000/api/products/${id}`, { method: 'DELETE' })
            .then(() => fetchProducts())
            .catch(err => console.error(err));
    };

    return (
        <div className="product-manager">
            <Helmet>
                <title>Admin - Manage Products</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <h2>Product Manager</h2>

            <div className="manager-content">
                <div className="form-section">
                    <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                    <form onSubmit={handleSubmit} className="admin-form">
                        <div className="form-group">
                            <label>Product Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group row">
                            <div className="col">
                                <label>Price</label>
                                <input type="text" name="price" value={formData.price} onChange={handleChange} required />
                            </div>
                            <div className="col">
                                <label>Badge</label>
                                <input type="text" name="badge" value={formData.badge} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-group row">
                            <div className="col">
                                <label>Image URL</label>
                                <input type="text" name="image" value={formData.image} onChange={handleChange} />
                            </div>
                            <div className="col">
                                <label>Category</label>
                                <select name="category" value={formData.category} onChange={handleChange} className="track-input">
                                    <option value="all">All</option>
                                    <option value="shoes">Shoes</option>
                                    <option value="clothing">Shirts & hoodies</option>
                                    <option value="perfumes">Perfumes</option>
                                    <option value="accessories">Accessories</option>
                                    <option value="bags">Bags</option>
                                    <option value="phone-covers">Phone covers</option>
                                    <option value="electronics">Electronics</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group row">
                            <div className="col">
                                <label>Description</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} rows="3" />
                            </div>
                        </div>

                        <h4>SEO Settings (On-Page)</h4>
                        <div className="form-group row">
                            <div className="col">
                                <label>Slug</label>
                                <input type="text" name="slug" value={formData.slug} onChange={handleChange} placeholder="e.g. stylish-red-shoes" />
                            </div>
                            <div className="col">
                                <label>Meta Keywords</label>
                                <input type="text" name="keywords" value={formData.keywords} onChange={handleChange} placeholder="shoes, red, stylish" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Meta Title</label>
                            <input type="text" name="metaTitle" value={formData.metaTitle} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Meta Description</label>
                            <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} rows="3" />
                        </div>

                        <button type="submit" className="admin-btn primary">
                            {editingId ? 'Update Product' : 'Save Product'}
                        </button>
                        {editingId && (
                            <button type="button" className="admin-btn ghost" onClick={() => {
                                setEditingId(null);
                                setFormData({ name: '', price: '', badge: '', image: '', category: 'all', description: '', metaTitle: '', metaDescription: '', keywords: '', slug: '' });
                            }}>Cancel</button>
                        )}
                    </form>
                </div>

                <div className="list-section">
                    <h3>Current Products</h3>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name / Details</th>
                                <th>SEO Meta</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <img src={p.image || '/images/default.png'} alt={p.name} width="50" style={{ borderRadius: 4 }} />
                                    </td>
                                    <td>
                                        <strong>{p.name}</strong>
                                        <br />
                                        <small>{p.price}</small>
                                    </td>
                                    <td>
                                        <span className="badge-seo">{p.metaTitle ? '✅ Title' : '❌ Title'}</span>
                                        <span className="badge-seo">{p.metaDescription ? '✅ Desc' : '❌ Desc'}</span>
                                    </td>
                                    <td>
                                        <button className="icon-btn edit" onClick={() => handleEdit(p)}>✏️</button>
                                        <button className="icon-btn delete" onClick={() => handleDelete(p.id)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>No products found. Add some!</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ProductManager;
