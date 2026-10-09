const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrls, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'API is running' }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
