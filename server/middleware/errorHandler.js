const env = require('../config/env');
const AppError = require('../utils/AppError');

const notFound = (req, res, next) => next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));

// Single place where every error becomes a structured JSON response
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message;
  const errors = err.errors || null;

  if (err.type === 'entity.parse.failed') { statusCode = 400; message = 'Request body contains invalid JSON'; }
  else if (err.number === 2627 || err.number === 2601) { statusCode = 409; message = 'A record with the same unique value already exists'; }
  else if (err.number === 547) { statusCode = 400; message = 'This action conflicts with related records (invalid reference or record in use)'; }
  else if (['ESOCKET', 'ELOGIN', 'ETIMEOUT', 'EINSTLOOKUP', 'ECONNCLOSED'].includes(err.code)) {
    statusCode = 503; message = 'Cannot connect to the database. Please try again shortly.';
  } else if (!err.isOperational) {
    statusCode = 500;
    message = env.nodeEnv === 'production' ? 'Something went wrong on our side' : err.message || 'Internal server error';
  }

  if (statusCode >= 500) console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });
};

module.exports = { notFound, errorHandler };
