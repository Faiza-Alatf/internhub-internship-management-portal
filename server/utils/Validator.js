const AppError = require('./AppError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';
const isValidDate = (v) => typeof v === 'string' && DATE_REGEX.test(v) && !Number.isNaN(Date.parse(v));
const isValidId = (v) => Number.isInteger(Number(v)) && Number(v) > 0;
const todayString = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Collects validation problems, then throws a single 400 error with all of them
class Validator {
  constructor() { this.errors = {}; }
  fail(field, message) { if (!this.errors[field]) this.errors[field] = message; return this; }
  required(value, field, label) { if (isBlank(value)) this.fail(field, `${label} is required`); return this; }
  maxLength(value, field, label, max) { if (value && String(value).length > max) this.fail(field, `${label} must be ${max} characters or fewer`); return this; }
  email(value, field = 'email') { if (!isBlank(value) && !EMAIL_REGEX.test(String(value).trim())) this.fail(field, 'Enter a valid email address'); return this; }
  password(value, field = 'password') {
    const ok = typeof value === 'string' && value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
    if (!isBlank(value) && !ok) this.fail(field, 'Password needs 8+ characters with uppercase, lowercase and a number');
    return this;
  }
  date(value, field, label) { if (!isBlank(value) && !isValidDate(value)) this.fail(field, `${label} must be a valid date (YYYY-MM-DD)`); return this; }
  oneOf(value, list, field, label) { if (!isBlank(value) && !list.includes(value)) this.fail(field, `${label} must be one of: ${list.join(', ')}`); return this; }
  id(value, field, label) {
    if (isBlank(value)) this.fail(field, `${label} is required`);
    else if (!isValidId(value)) this.fail(field, `${label} is invalid`);
    return this;
  }
  optionalId(value, field, label) { if (!isBlank(value) && !isValidId(value)) this.fail(field, `${label} is invalid`); return this; }
  rating(value, field, label) {
    const n = Number(value);
    if (isBlank(value)) this.fail(field, `${label} rating is required`);
    else if (!Number.isInteger(n) || n < 1 || n > 5) this.fail(field, `${label} must be between 1 and 5`);
    return this;
  }
  throwIfInvalid() {
    if (Object.keys(this.errors).length) throw new AppError('Please correct the highlighted fields', 400, this.errors);
  }
}

// Validates a route parameter such as /interns/:id
function toId(value, label = 'ID') {
  if (!isValidId(value)) throw new AppError(`Invalid ${label}`, 400);
  return Number(value);
}

module.exports = { Validator, toId, isBlank, isValidDate, todayString };
