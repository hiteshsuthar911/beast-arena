const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Event = require('../models/Event');
const EventApplication = require('../models/EventApplication');
const { verifyAdminToken, verifyPlayerToken } = require('../middleware/auth');

const router = express.Router();

// Store temporary OTP states in memory
const tempOtps = {};

// Helper to send OTP email or fallback to console log
async function sendOtpEmail(toEmail, otp) {
  console.log(`\n==================================================`);
  console.log(`                 BEAST ARENA OTP`);
  console.log(`==================================================`);
  console.log(`To: ${toEmail}`);
  console.log(`OTP Code: ${otp}`);
  console.log(`Expires in: 5 minutes`);
  console.log(`==================================================\n`);

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log(`[Email Service] SMTP configuration missing in env. OTP sent only to console.`);
    return { success: true, loggedToConsole: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure: port === '465',
      auth: { user, pass }
    });

    const info = await transporter.sendMail({
      from: `"Beast Arena Security" <${user}>`,
      to: toEmail,
      subject: `[Beast Arena] Admin OTP Verification: ${otp}`,
      text: `Hello,\n\nYour 6-digit verification code to access the Beast Arena Admin Portal is: ${otp}\n\nThis code will expire in 5 minutes.\n\nBest regards,\nBeast Arena Security Team`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-top: 0;">Beast Arena Security</h2>
          <p>Please use the following 6-digit verification code to access the Admin Portal:</p>
          <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 6px; margin: 20px 0; color: #0f172a;">
            ${otp}
          </div>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">This code is valid for 5 minutes. If you did not request this code, please secure your account immediately.</p>
        </div>
      `
    });

    console.log(`[Email Service] Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] Failed to send email via SMTP:`, error);
    return { success: false, error: error.message };
  }
}

// Helper to check if MongoDB is connected
const isConnected = () => mongoose.connection.readyState === 1;

// Default registration fields config
const allRegistrationFields = [
  'fullName', 'age', 'email', 'discordUsername', 'phone', 'hasWorkingMic',
  'game', 'ign', 'uid', 'rank', 'device', 'whySelect', 'creatorLink',
  'teamStatus', 'teamName', 'secondaryGames', 'referral', 'agreedToTerms'
];

// Fallback in-memory database
const mockDb = {
  users: [],
  applications: [],
  events: []
};

// OAuth2 Configs
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI_HOST = process.env.REDIRECT_URI_HOST || 'http://localhost:3005';

// Helper to handle player creation/sign in for OAuth2
// Returns { token, isNew, username } so the frontend can show correct welcome message
const handleOauthLoginRegister = async (email, username) => {
  const generateToken = (userEmail) => {
    const payload = `${userEmail}:${Date.now()}`;
    return Buffer.from(payload).toString('base64');
  };

  if (isConnected()) {
    let user = await User.findOne({ email });
    let isNew = false;
    if (!user) {
      const randomPassword = 'oauth_' + Math.random().toString(36).substring(2);
      user = new User({ email, password: randomPassword });
      await user.save();
      isNew = true;
    }
    return { token: generateToken(user.email), isNew, username: username || email.split('@')[0] };
  } else {
    let user = mockDb.users.find(u => u.email === email);
    let isNew = false;
    if (!user) {
      const randomPassword = 'oauth_' + Math.random().toString(36).substring(2);
      user = { email, password: randomPassword, createdAt: new Date() };
      mockDb.users.push(user);
      isNew = true;
    }
    return { token: generateToken(user.email), isNew, username: username || email.split('@')[0] };
  }
};

// Discord Redirect Route
router.get('/auth/discord/login', (req, res) => {
  const redirectUri = `${REDIRECT_URI_HOST}/api/auth/discord/callback`;
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    return res.redirect(`/mock-oauth?provider=discord&callbackUrl=${encodeURIComponent(redirectUri)}`);
  }
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify+email`;
  res.redirect(discordAuthUrl);
});

// Discord Callback Route
router.get('/auth/discord/callback', async (req, res) => {
  const { code, mock_email, mock_name } = req.query;
  const redirectUri = `${REDIRECT_URI_HOST}/api/auth/discord/callback`;

  if (!code) {
    return res.redirect(`/callback?error=${encodeURIComponent('No authorization code provided')}`);
  }

  try {
    let email = '';
    let username = '';

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      email = mock_email || 'mock-discord-user@example.com';
      username = mock_name || 'MockDiscordUser';
    } else {
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri
        })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        throw new Error(tokenData.error_description || 'Failed to exchange token with Discord');
      }

      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      });
      const userData = await userResponse.json();
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user profile from Discord');
      }

      email = userData.email;
      username = userData.username;

      if (!email) {
        throw new Error('No email found in Discord profile. Email scope is required.');
      }
    }

    const result = await handleOauthLoginRegister(email, username);
    res.redirect(`/callback?token=${result.token}&isNew=${result.isNew}&username=${encodeURIComponent(result.username)}&source=discord`);
  } catch (error) {
    console.error('Discord callback error:', error);
    res.redirect(`/callback?error=${encodeURIComponent(error.message)}`);
  }
});

// Google Redirect Route
router.get('/auth/google/login', (req, res) => {
  const redirectUri = `${REDIRECT_URI_HOST}/api/auth/google/callback`;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.redirect(`/mock-oauth?provider=google&callbackUrl=${encodeURIComponent(redirectUri)}`);
  }
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('openid email profile')}`;
  res.redirect(googleAuthUrl);
});

// Google Callback Route
router.get('/auth/google/callback', async (req, res) => {
  const { code, mock_email, mock_name } = req.query;
  const redirectUri = `${REDIRECT_URI_HOST}/api/auth/google/callback`;

  if (!code) {
    return res.redirect(`/callback?error=${encodeURIComponent('No authorization code provided')}`);
  }

  try {
    let email = '';
    let username = '';

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      email = mock_email || 'mock-google-user@example.com';
      username = mock_name || 'MockGoogleUser';
    } else {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri
        })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        throw new Error(tokenData.error_description || 'Failed to exchange token with Google');
      }

      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      });
      const userData = await userResponse.json();
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user profile from Google');
      }

      email = userData.email;
      username = userData.name || userData.email.split('@')[0];

      if (!email) {
        throw new Error('No email found in Google profile.');
      }
    }

    const result = await handleOauthLoginRegister(email, username);
    res.redirect(`/callback?token=${result.token}&isNew=${result.isNew}&username=${encodeURIComponent(result.username)}&source=google`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`/callback?error=${encodeURIComponent(error.message)}`);
  }
});

// 1. Auth Endpoint (Login / Register)
router.post('/auth/login-register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const generateToken = (userEmail) => {
      const payload = `${userEmail}:${Date.now()}`;
      return Buffer.from(payload).toString('base64');
    };

    if (isConnected()) {
      let user = await User.findOne({ email });
      if (user) {
        if (user.password === password) {
          const token = generateToken(user.email);
          return res.json({ success: true, token, isNew: false, username: email.split('@')[0], message: 'Logged in successfully!', user: { email: user.email } });
        } else {
          return res.status(401).json({ success: false, message: 'Incorrect password.' });
        }
      } else {
        user = new User({ email, password });
        await user.save();
        const token = generateToken(user.email);
        return res.status(201).json({ success: true, token, isNew: true, username: email.split('@')[0], message: 'Account registered and logged in successfully!', user: { email: user.email } });
      }
    } else {
      const user = mockDb.users.find(u => u.email === email);
      if (user) {
        if (user.password === password) {
          const token = generateToken(user.email);
          return res.json({ success: true, token, isNew: false, username: email.split('@')[0], message: 'Logged in successfully! (In-memory DB fallback)', user: { email: user.email } });
        } else {
          return res.status(401).json({ success: false, message: 'Incorrect password.' });
        }
      } else {
        const newUser = { email, password, createdAt: new Date() };
        mockDb.users.push(newUser);
        const token = generateToken(newUser.email);
        return res.status(201).json({ success: true, token, isNew: true, username: email.split('@')[0], message: 'Account registered and logged in successfully! (In-memory DB fallback)', user: { email: newUser.email } });
      }
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ success: false, message: 'Server error during authentication.', error: error.message });
  }
});

// 2. Active Event Registration Form Submit Endpoint (Protected by Player Token)
router.post('/events/register', verifyPlayerToken, async (req, res) => {
  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({ success: false, message: 'Tournament Event ID is required.' });
  }

  try {
    let event = null;
    let eventFields = [];
    
    if (isConnected()) {
      event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Tournament event not found.' });
      }
      eventFields = event.registrationFields || [];
    } else {
      event = mockDb.events.find(e => e._id === eventId);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Tournament event not found.' });
      }
      eventFields = event.registrationFields || [];
    }

    // CHECK FOR CLOSURE OR EXPIRATION DEADLINE
    const isManuallyClosed = event.status === 'Closed';
    const isExpired = event.closesAt && new Date() > new Date(event.closesAt);
    if (isManuallyClosed || isExpired) {
      return res.status(400).json({ success: false, message: 'Rejection: Registration for this tournament has closed.' });
    }

    const mandatoryFields = [
      'fullName', 'age', 'email', 'discordUsername', 'phone', 'hasWorkingMic',
      'game', 'ign', 'uid', 'rank', 'device', 'whySelect', 'teamStatus',
      'referral', 'agreedToTerms'
    ];

    for (const field of eventFields) {
      if (mandatoryFields.includes(field)) {
        if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
          return res.status(400).json({ success: false, message: `Registration Field "${field}" is required for this tournament.` });
        }
      }
    }

    if (eventFields.includes('hasWorkingMic')) {
      const hasMic = req.body.hasWorkingMic === 'true' || req.body.hasWorkingMic === true;
      if (!hasMic) {
        return res.status(400).json({ success: false, message: 'Rejection: A working microphone is required to participate in Beast Arena tournaments.' });
      }
    }

    if (eventFields.includes('agreedToTerms')) {
      const agreed = req.body.agreedToTerms === 'true' || req.body.agreedToTerms === true;
      if (!agreed) {
        return res.status(400).json({ success: false, message: 'You must agree to the tournament terms and conditions.' });
      }
    }

    const appData = {
      eventId,
      fullName: req.body.fullName,
      age: req.body.age ? Number(req.body.age) : undefined,
      email: req.body.email,
      discordUsername: req.body.discordUsername,
      phone: req.body.phone,
      hasWorkingMic: req.body.hasWorkingMic === 'true' || req.body.hasWorkingMic === true,
      game: req.body.game,
      ign: req.body.ign,
      uid: req.body.uid,
      rank: req.body.rank,
      device: req.body.device,
      whySelect: req.body.whySelect,
      creatorLink: req.body.creatorLink,
      teamStatus: req.body.teamStatus,
      teamName: req.body.teamName,
      secondaryGames: Array.isArray(req.body.secondaryGames) ? req.body.secondaryGames : (req.body.secondaryGames ? [req.body.secondaryGames] : []),
      referral: req.body.referral,
      agreedToTerms: req.body.agreedToTerms === 'true' || req.body.agreedToTerms === true
    };

    if (isConnected()) {
      const application = new EventApplication(appData);
      await application.save();
      return res.status(201).json({ success: true, message: 'Application submitted successfully to Beast Arena database!' });
    } else {
      const newApp = {
        ...appData,
        _id: 'mock-app-' + Date.now(),
        submittedAt: new Date()
      };
      mockDb.applications.push(newApp);
      console.log('New application added to mockDb:', newApp);
      return res.status(201).json({ success: true, message: 'Application submitted successfully! (Saved to in-memory DB fallback)' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during event registration.', error: error.message });
  }
});

// 3. Status API
router.get('/status', async (req, res) => {
  try {
    if (isConnected()) {
      const [totalUsers, totalApplications, totalEvents] = await Promise.all([
        User.countDocuments({}),
        EventApplication.countDocuments({}),
        Event.countDocuments({})
      ]);
      res.json({
        database: 'MongoDB Connected',
        totalUsers,
        totalApplications,
        totalEvents
      });
    } else {
      res.json({
        database: 'In-Memory Mock Fallback',
        totalUsers: mockDb.users.length,
        totalApplications: mockDb.applications.length,
        totalEvents: mockDb.events.length
      });
    }
  } catch (error) {
    console.error('Status diagnostics error:', error);
    res.status(500).json({ success: false, message: 'Server error during status check.', error: error.message });
  }
});

// 4. Admin Auth Login API
router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    // Generate a 6-digit random numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Generate a secure transaction ID
    const transactionId = crypto.randomBytes(16).toString('hex');
    
    // Save in cache (valid for 5 minutes)
    tempOtps[transactionId] = {
      username,
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    };

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@beast-arena.com';

    // Trigger sending the email
    await sendOtpEmail(adminEmail, otp);

    return res.json({
      success: true,
      otpRequired: true,
      transactionId,
      message: 'Credentials valid. OTP sent to administrator email.'
    });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
  }
});

// 4b. Admin verify OTP API
router.post('/admin/verify-otp', (req, res) => {
  const { transactionId, otp } = req.body;

  if (!transactionId || !otp) {
    return res.status(400).json({ success: false, message: 'Transaction ID and OTP are required.' });
  }

  const cached = tempOtps[transactionId];
  if (!cached) {
    return res.status(400).json({ success: false, message: 'Invalid or expired transaction.' });
  }

  if (Date.now() > cached.expiresAt) {
    delete tempOtps[transactionId];
    return res.status(400).json({ success: false, message: 'OTP expired. Please log in again.' });
  }

  if (cached.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
  }

  // OTP is correct! Generate the final admin token
  const tokenPayload = `${cached.username}:${Date.now()}`;
  const token = Buffer.from(tokenPayload).toString('base64');

  // Clean up
  delete tempOtps[transactionId];

  return res.json({ success: true, token, message: 'Admin authenticated successfully!' });
});

// 5. Public API to fetch active tournaments for players (Filters out manually closed or expired events)
router.get('/events/active', async (req, res) => {
  try {
    if (isConnected()) {
      const events = await Event.find({
        status: 'Open',
        $or: [
          { closesAt: { $exists: false } },
          { closesAt: null },
          { closesAt: { $gt: new Date() } }
        ]
      }).sort({ createdAt: -1 });
      res.json({ success: true, events });
    } else {
      const activeEvents = mockDb.events.filter(e => {
        const isOpen = e.status === 'Open';
        const isNotExpired = !e.closesAt || new Date(e.closesAt) > new Date();
        return isOpen && isNotExpired;
      });
      res.json({ success: true, events: activeEvents });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Player History application endpoint
router.get('/player/applications', verifyPlayerToken, async (req, res) => {
  try {
    if (isConnected()) {
      const applications = await EventApplication.find({ email: req.playerEmail }).sort({ submittedAt: -1 }).lean();
      const eventIds = [...new Set(applications.map(app => app.eventId))].filter(Boolean);
      const events = await Event.find({ _id: { $in: eventIds } });
      const eventMap = {};
      events.forEach(e => {
        eventMap[e._id.toString()] = e.title;
      });
      const enrichedApps = applications.map(app => ({
        ...app,
        eventTitle: eventMap[app.eventId] || 'Unknown Tournament'
      }));
      res.json({ success: true, applications: enrichedApps });
    } else {
      const applications = mockDb.applications.filter(app => app.email === req.playerEmail);
      const enrichedApps = applications.map(app => {
        const evt = mockDb.events.find(e => e._id === app.eventId);
        return {
          ...app,
          eventTitle: evt ? evt.title : 'Unknown Tournament'
        };
      });
      res.json({ success: true, applications: enrichedApps });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Protected Admin APIs for managing events
router.post('/admin/events', verifyAdminToken, async (req, res) => {
  const { title, gameTitle, prizePool, maxPlayers, rules, driveLink, status, registrationFields, closesAt } = req.body;
  
  if (!title || !gameTitle || !prizePool || !maxPlayers || !driveLink) {
    return res.status(400).json({ success: false, message: 'Required tournament fields are missing.' });
  }

  try {
    const closesAtDate = closesAt ? new Date(closesAt) : undefined;
    
    if (isConnected()) {
      const event = new Event({
        title,
        gameTitle,
        prizePool: Number(prizePool),
        maxPlayers: Number(maxPlayers),
        rules,
        driveLink,
        status: status || 'Open',
        registrationFields: Array.isArray(registrationFields) ? registrationFields : [],
        closesAt: closesAtDate
      });
      await event.save();
      res.status(201).json({ success: true, message: 'Tournament event created successfully!' });
    } else {
      const newEvent = {
        _id: 'mock-event-' + Date.now(),
        title,
        gameTitle,
        prizePool: Number(prizePool),
        maxPlayers: Number(maxPlayers),
        rules,
        driveLink,
        status: status || 'Open',
        registrationFields: Array.isArray(registrationFields) ? registrationFields : [],
        closesAt: closesAtDate,
        createdAt: new Date()
      };
      mockDb.events.push(newEvent);
      res.status(201).json({ success: true, message: 'Tournament event created successfully! (In-memory DB fallback)' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Close Event registration manually
router.put('/admin/events/:id/close', verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  try {
    if (isConnected()) {
      const event = await Event.findByIdAndUpdate(id, { status: 'Closed' }, { new: true });
      if (!event) {
        return res.status(404).json({ success: false, message: 'Tournament event not found.' });
      }
      return res.json({ success: true, message: 'Tournament registration closed successfully!' });
    } else {
      const event = mockDb.events.find(e => e._id === id);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Tournament event not found.' });
      }
      event.status = 'Closed';
      return res.json({ success: true, message: 'Tournament registration closed successfully! (In-memory DB fallback)' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/admin/events', verifyAdminToken, async (req, res) => {
  try {
    if (isConnected()) {
      const events = await Event.find({}).sort({ createdAt: -1 });
      res.json({ success: true, events });
    } else {
      res.json({ success: true, events: mockDb.events });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Protected Admin APIs for viewing users and applications
router.get('/admin/users', verifyAdminToken, async (req, res) => {
  try {
    if (isConnected()) {
      const users = await User.find({}, 'email createdAt').sort({ createdAt: -1 });
      res.json({ success: true, users });
    } else {
      res.json({ success: true, users: mockDb.users });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/admin/applications', verifyAdminToken, async (req, res) => {
  try {
    if (isConnected()) {
      const applications = await EventApplication.find({}).sort({ submittedAt: -1 });
      res.json({ success: true, applications });
    } else {
      res.json({ success: true, applications: mockDb.applications });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
