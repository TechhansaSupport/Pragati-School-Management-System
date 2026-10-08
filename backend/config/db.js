const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      family: 4, // Force IPv4 — fixes DNS resolution issues on Windows with Atlas
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.error('');
    console.error('Troubleshooting:');
    console.error('  1. Go to https://cloud.mongodb.com → Network Access');
    console.error('  2. Click "Add IP Address" → "Allow Access from Anywhere" (0.0.0.0/0)');
    console.error('  3. Wait 1–2 minutes for changes to propagate');
    console.error('  4. Verify your username/password in the connection string');
    process.exit(1);
  }
};

module.exports = connectDB;
