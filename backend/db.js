const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://demo-user:demo-pass123@cluster0.demo.mongodb.net/shopgalaxy?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log('\n--- ⚠️ MONGODB CONNECTION ERROR ⚠️ ---');
        console.log(`Atlas Error: Aapka cluster PAUSE ho gaya hai! Error: ${error.message}`);
        console.log('Agar aapka cluster Pause hai toh kindly cloud.mongodb.com par jakar apne free cluster ko "Resume" karein!');
    }
};

module.exports = connectDB;
