const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const apiRouter = require('./routes/api');
const pagesRouter = require('./routes/pages');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Register Routers
app.use('/api', apiRouter);
app.use('/', pagesRouter); // Pages router must be registered last due to the wildcard fallback

// Start server first, then connect to DB (Railway requires the port to be bound quickly)
app.listen(PORT, () => {
  console.log(`Beast Arena Gaming Network server running on port ${PORT}`);

  if (!MONGODB_URI) {
    console.warn('WARNING: MONGODB_URI not set. Running with in-memory fallback database.');
    return;
  }

  // Connect to MongoDB Atlas (Cloud)
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000 // 10 seconds timeout for production
  })
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas.');
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    console.log('Running with in-memory fallback database.');
  });
});
