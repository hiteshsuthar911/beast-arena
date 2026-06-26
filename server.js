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

// Connect to MongoDB Atlas (Cloud)
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 3000 // 3 seconds timeout
})
.then(() => {
  console.log('Successfully connected to MongoDB.');
})
.catch((err) => {
  console.error('MongoDB connection failed. Falling back to temporary in-memory database.');
  console.log('To use MongoDB, please configure a working MONGODB_URI in the .env file.');
});

// Register Routers
app.use('/api', apiRouter);
app.use('/', pagesRouter); // Pages router must be registered last due to the wildcard fallback

app.listen(PORT, () => {
  console.log(`Beast Arena Gaming Network server running on http://localhost:${PORT}`);
});
