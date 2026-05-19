import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

function ProductManager() {
    const [products, setProducts] = useState([]);
    const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        badge: '',
        image: '',
        category: 'all',
        description: '',
        seo_title: '',
        seo_description: '',
        keywords: '',
        alt_text: '',
        slug: ''
    });
    const [editingId, setEditingId] = useState(null);

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const fetchProducts = () => {
        fetch(`${API_BASE}/api/products`)
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
        const url = isEdit ? `${API_BASE}/api/products/${editingId}` : `${API_BASE}/api/products`;
        const method = isEdit ? 'PUT' : 'POST';

        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
            .then(res => res.json())
            .then(() => {
                setFormData({ name: '', price: '', badge: '', image: '', category: 'all', description: '', seo_title: '', seo_description: '', keywords: '', alt_text: '', slug: '' });
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
            seo_title: p.seo_title || '',
            seo_description: p.seo_description || '',
            keywords: p.keywords || '',
            alt_text: p.alt_text || '',
            slug: p.slug || ''
        });
    };

    const handleDelete = (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' })
            .then(() => fetchProducts())
            .catch(err => console.error(err));
    };

    const handleGenerateSEO = async () => {
        if (!formData.name || !formData.description) {
            alert('Please enter a product name and description first.');
            return;
        }
        
        setIsGeneratingSEO(true);
        try {
            const res = await fetch(`${API_BASE}/api/seo/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName: formData.name,
                    category: formData.category,
                    description: formData.description
                })
            });
            
            const data = await res.json();
            if (res.ok) {
                setFormData(prev => ({
                    ...prev,
                    seo_title: data.seoTitle || prev.seo_title,
                    seo_description: data.metaDescription || prev.seo_description,
                    keywords: data.keywords || prev.keywords,
                    alt_text: data.altText || prev.alt_text
                }));
                alert('SEO generated successfully!');
            } else {
                alert('Error generating SEO: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('Failed to connect to SEO service.');
        } finally {
            setIsGeneratingSEO(false);
        }
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

                        <div className="form-group row" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <h4 style={{ margin: 0 }}>SEO Settings (On-Page)</h4>
                            <button 
                                type="button" 
                                className="admin-btn secondary" 
                                onClick={handleGenerateSEO} 
                                disabled={isGeneratingSEO}
                                style={{ background: '#3b82f6', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                            >
                                {isGeneratingSEO ? 'Generating...' : '✨ Auto Generate SEO'}
                            </button>
                        </div>
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
                        <div className="form-group row">
                            <div className="col">
                                <label>SEO Title</label>
                                <input type="text" name="seo_title" value={formData.seo_title} onChange={handleChange} maxLength="60" />
                            </div>
                            <div className="col">
                                <label>Image Alt Text</label>
                                <input type="text" name="alt_text" value={formData.alt_text} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Meta Description</label>
                            <textarea name="seo_description" value={formData.seo_description} onChange={handleChange} rows="3" maxLength="160" />
                        </div>

                        <button type="submit" className="admin-btn primary">
                            {editingId ? 'Update Product' : 'Save Product'}
                        </button>
                        {editingId && (
                            <button type="button" className="admin-btn ghost" onClick={() => {
                                setEditingId(null);
                                setFormData({ name: '', price: '', badge: '', image: '', category: 'all', description: '', seo_title: '', seo_description: '', keywords: '', alt_text: '', slug: '' });
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
                                        <span className="badge-seo">{p.seo_title ? '✅ Title' : '❌ Title'}</span>
                                        <span className="badge-seo">{p.seo_description ? '✅ Desc' : '❌ Desc'}</span>
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
