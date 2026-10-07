const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// TODO: import routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EduPulse API is running' });
});

// Database connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/edupulse';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error. Ensure MongoDB is running locally or set a valid MONGO_URI in .env', error.message);
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
