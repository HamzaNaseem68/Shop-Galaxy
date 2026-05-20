const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true }, // plain text demo
        isAdmin: { type: Boolean, default: false },
        wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    },
    { timestamps: true }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
