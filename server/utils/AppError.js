// An error we throw on purpose; carries an HTTP status and optional field-level errors
class AppError extends Error {
  constructor(message, statusCode = 400, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
}
module.exports = AppError;
