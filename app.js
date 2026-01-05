// src/app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const healthRoutes = require('./src/routes/health.route');

const app = express();
const routes = require('./src/routes/index.route'); // كل الراوتات مجمعة
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.set('trust proxy', true);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
// routes
app.use('/api', routes); // كل الراوتات مجمعة



// health
app.use('/api/health', healthRoutes);

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
