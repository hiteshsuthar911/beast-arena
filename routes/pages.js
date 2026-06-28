const express = require('express');
const path = require('path');

const router = express.Router();

// Public Player Pages
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

router.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'about.html'));
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

router.get('/callback', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'callback.html'));
});

router.get('/mock-oauth', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'mock-oauth.html'));
});

router.get('/winners', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'winners.html'));
});

router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'register.html'));
});

router.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'profile.html'));
});

// Admin Subpages (Structured under public/admin/)
router.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html'));
});

router.get('/admin/create-event', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'create-event.html'));
});

router.get('/admin/events', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'events.html'));
});

router.get('/admin/users', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'users.html'));
});

router.get('/admin/applications', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'applications.html'));
});

router.get('/admin/advertisements', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'advertisements.html'));
});

// Fallback to custom 404 page
router.get('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', 'public', '404.html'));
});

module.exports = router;
