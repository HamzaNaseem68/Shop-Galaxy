const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        price: { type: String, required: true },
        badge: { type: String, default: '' },
        image: { type: String, default: '/images/default.png' },
        category: { type: String, default: 'all' },
        description: { type: String, default: '' },
        seo_title: { type: String, default: '' },
        seo_description: { type: String, default: '' },
        keywords: { type: String, default: '' },
        alt_text: { type: String, default: '' },
        slug: { type: String, default: '' },
    },
    { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
