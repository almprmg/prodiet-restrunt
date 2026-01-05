// routes/health.js
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

module.exports = router;
