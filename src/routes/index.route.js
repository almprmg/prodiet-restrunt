const { Router } = require('express');
const adminRoutes = require('./admin.route'); // index.js داخل 
const router = Router();
// Admin routes
router.use('/admin', adminRoutes);

module.exports = router;