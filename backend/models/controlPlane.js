// models/controlPlane.js
const mongoose = require('mongoose');
require('dotenv').config();

const controlPlane = mongoose.createConnection(process.env.MONGODB_URI, {
  dbName: process.env.CONTROL_PLANE_DB_NAME || 'pragati',
});

controlPlane.on('connected', () => {
  console.log(`✅ Dedicated connection established to Pragati Control Plane DB (${process.env.CONTROL_PLANE_DB_NAME || 'pragati'})`);
});

controlPlane.on('error', (err) => {
  console.error('❌ Pragati Control Plane connection error:', err.message);
});

module.exports = controlPlane;
