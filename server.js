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

// Seed PUBG event helper
async function seedPubgEvent() {
  const pubgDetails = {
    title: 'PUBG Mobile Ultimate Showdown',
    gameTitle: 'PUBG Mobile',
    prizePool: 100000,
    maxPlayers: 100,
    rules: 'Squad event. Erangel Map. Emulators are strictly banned. Dynamic anti-cheat active.',
    driveLink: 'https://drive.google.com/drive/folders/pubg-submissions-mock-id',
    closesAt: new Date('2026-08-10T18:00:00+05:30'),
    entryFee: 150,
    isPaid: true,
    status: 'Open'
  };

  try {
    const Event = require('./models/Event');
    if (mongoose.connection.readyState === 1) {
      const existing = await Event.findOne({ title: pubgDetails.title });
      if (!existing) {
        const event = new Event(pubgDetails);
        await event.save();
        console.log('[Seeding] PUBG Mobile Ultimate Showdown created in MongoDB.');
      } else {
        console.log('[Seeding] PUBG Mobile Ultimate Showdown already exists.');
      }
    } else {
      const mockDb = global.mockDb || { events: [] };
      const existing = mockDb.events.find(e => e.title === pubgDetails.title);
      if (!existing) {
        mockDb.events.push({
          _id: 'mock-pubg-event-id',
          ...pubgDetails,
          createdAt: new Date()
        });
        console.log('[Seeding] PUBG Mobile Ultimate Showdown seeded in-memory fallback DB.');
      }
    }
  } catch (err) {
    console.error('Failed to seed PUBG event:', err.message);
  }
}

async function seedPaymentConfig() {
  const PaymentConfig = require('./models/PaymentConfig');
  const defaults = {
    razorpayKeyId: 'rzp_test_T75DayPxG4sLCC',
    razorpayKeySecret: 'jS1sYTCKaRowzG0PIXiiToMV',
    isPaymentEnabled: true
  };

  try {
    if (mongoose.connection.readyState === 1) {
      const existing = await PaymentConfig.findOne({});
      if (!existing) {
        const config = new PaymentConfig(defaults);
        await config.save();
        console.log('[Seeding] Razorpay test credentials seeded in MongoDB.');
      } else {
        console.log('[Seeding] Razorpay credentials config already exists in MongoDB.');
      }
    } else {
      const mockDb = global.mockDb || {};
      if (!mockDb.paymentConfig) {
        mockDb.paymentConfig = { ...defaults };
        console.log('[Seeding] Razorpay test credentials seeded in-memory DB.');
      } else if (!mockDb.paymentConfig.razorpayKeyId) {
        mockDb.paymentConfig = { ...defaults };
        console.log('[Seeding] Razorpay test credentials seeded in-memory DB.');
      }
    }
  } catch (err) {
    console.error('Failed to seed PaymentConfig:', err.message);
  }
}

async function seedPubgAdvertisement() {
  const Advertisement = require('./models/Advertisement');
  const Event = require('./models/Event');
  
  try {
    let buttonUrl = '/register';
    if (mongoose.connection.readyState === 1) {
      const pubgEvent = await Event.findOne({ title: 'PUBG Mobile Ultimate Showdown' });
      if (pubgEvent) {
        buttonUrl = `/register?eventId=${pubgEvent._id}`;
      }
      
      const existing = await Advertisement.findOne({ title: 'PUBG Mobile Ultimate Showdown' });
      if (!existing) {
        const ad = new Advertisement({
          title: 'PUBG Mobile Ultimate Showdown',
          subtitle: 'The arena awaits you. Join India\'s elite squad tournament, prove your skills, and battle for the massive prize pool. Emulators strictly blocked.',
          imageUrl: '/pubg_banner.png',
          buttonText: 'Register & Pay Entry Fee 🏆',
          buttonUrl: buttonUrl,
          prizePool: '₹1,00,000 INR',
          eventDate: 'August 11, 2026',
          entryFee: '₹150 (Paid)',
          closesAt: new Date('2026-08-10T18:00:00+05:30'),
          status: 'Active'
        });
        await ad.save();
        console.log('[Seeding] PUBG Mobile Ultimate Showdown advertisement created in MongoDB.');
      } else {
        console.log('[Seeding] PUBG Mobile Ultimate Showdown advertisement already exists in MongoDB.');
      }
    } else {
      const mockDb = global.mockDb || {};
      if (!mockDb.advertisements) mockDb.advertisements = [];
      const existing = mockDb.advertisements.find(a => a.title === 'PUBG Mobile Ultimate Showdown');
      if (!existing) {
        mockDb.advertisements.push({
          _id: 'mock-pubg-ad-id',
          title: 'PUBG Mobile Ultimate Showdown',
          subtitle: 'The arena awaits you. Join India\'s elite squad tournament, prove your skills, and battle for the massive prize pool. Emulators strictly blocked.',
          imageUrl: '/pubg_banner.png',
          buttonText: 'Register & Pay Entry Fee 🏆',
          buttonUrl: '/register?eventId=mock-pubg-event-id',
          prizePool: '₹1,00,000 INR',
          eventDate: 'August 11, 2026',
          entryFee: '₹150 (Paid)',
          closesAt: new Date('2026-08-10T18:00:00+05:30'),
          status: 'Active',
          createdAt: new Date()
        });
        console.log('[Seeding] PUBG Mobile Ultimate Showdown advertisement seeded in-memory fallback DB.');
      }
    }
  } catch (err) {
    console.error('Failed to seed PUBG advertisement:', err.message);
  }
}

// Start server first, then connect to DB (Railway requires the port to be bound quickly)
app.listen(PORT, () => {
  console.log(`Beast Arena Gaming Network server running on port ${PORT}`);

  if (!MONGODB_URI) {
    console.warn('WARNING: MONGODB_URI not set. Running with in-memory fallback database.');
    seedPubgEvent();
    seedPaymentConfig();
    seedPubgAdvertisement();
    return;
  }

  // Connect to MongoDB Atlas (Cloud)
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000 // 10 seconds timeout for production
  })
  .then(async () => {
    console.log('Successfully connected to MongoDB Atlas.');
    await seedPubgEvent();
    await seedPaymentConfig();
    await seedPubgAdvertisement();
  })
  .catch(async (err) => {
    console.error('MongoDB connection failed:', err.message);
    console.log('Running with in-memory fallback database.');
    await seedPubgEvent();
    await seedPaymentConfig();
    await seedPubgAdvertisement();
  });
});
