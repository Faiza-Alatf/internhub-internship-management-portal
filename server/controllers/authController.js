const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { query } = require('../config/db');
const AppError = require('../utils/AppError');
const h = require('../utils/asyncHandler');
const { Validator } = require('../utils/Validator');

const signToken = (userId, remember) =>
  jwt.sign({ userId }, env.jwtSecret, { expiresIn: remember ? env.jwtRememberExpiresIn : env.jwtExpiresIn });

const publicUser = (u) => ({
  userId: u.userId, fullName: u.fullName, email: u.email, role: u.role,
  mentorId: u.mentorId || null, internId: u.internId || null,
});

// POST /api/auth/login
exports.login = h(async (req, res) => {
  const { email, password, remember } = req.body;
  new Validator().required(email, 'email', 'Email').email(email).required(password, 'password', 'Password').throwIfInvalid();

  const [user] = await query(
    `SELECT u.UserId, u.FullName, u.Email, u.PasswordHash, u.Role, u.IsActive, m.MentorId, i.InternId
     FROM Users u
     LEFT JOIN Mentors m ON m.UserId = u.UserId
     LEFT JOIN Interns i ON i.UserId = u.UserId
     WHERE u.Email = @email`,
    { email: email.trim().toLowerCase() }
  );

  // Same message for unknown email and wrong password so attackers cannot discover valid emails
  const passwordMatches = user && (await bcrypt.compare(password, user.passwordHash));
  if (!passwordMatches) throw new AppError('Invalid email or password', 401);
  if (!user.isActive) throw new AppError('Your account has been deactivated. Please contact HR.', 403);

  res.json({ success: true, message: 'Login successful', data: { token: signToken(user.userId, !!remember), user: publicUser(user) } });
});

// POST /api/auth/register  (ADMIN only - creates another admin account)
exports.register = h(async (req, res) => {
  const { fullName, email, password } = req.body;
  new Validator().required(fullName, 'fullName', 'Full name').required(email, 'email', 'Email').email(email)
    .required(password, 'password', 'Password').password(password).throwIfInvalid();

  const cleanEmail = email.trim().toLowerCase();
  const existing = await query('SELECT UserId FROM Users WHERE Email = @email', { email: cleanEmail });
  if (existing.length) throw new AppError('An account with this email already exists', 409, { email: 'Email is already registered' });

  const hash = await bcrypt.hash(password, 10);
  const [created] = await query(
    `INSERT INTO Users (FullName, Email, PasswordHash, Role) OUTPUT INSERTED.UserId, INSERTED.FullName, INSERTED.Email, INSERTED.Role
     VALUES (@fullName, @email, @hash, 'ADMIN')`,
    { fullName: fullName.trim(), email: cleanEmail, hash }
  );
  res.status(201).json({ success: true, message: 'Admin account created successfully', data: created });
});

// GET /api/auth/me
exports.me = h(async (req, res) => {
  res.json({ success: true, data: publicUser(req.user) });
});

// PUT /api/auth/profile
exports.updateProfile = h(async (req, res) => {
  const { fullName } = req.body;
  new Validator().required(fullName, 'fullName', 'Full name').maxLength(fullName, 'fullName', 'Full name', 120).throwIfInvalid();
  await query('UPDATE Users SET FullName = @fullName WHERE UserId = @userId', { fullName: fullName.trim(), userId: req.user.userId });
  res.json({ success: true, message: 'Profile updated successfully', data: publicUser({ ...req.user, fullName: fullName.trim() }) });
});

// PUT /api/auth/password
exports.changePassword = h(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  new Validator().required(currentPassword, 'currentPassword', 'Current password')
    .required(newPassword, 'newPassword', 'New password').password(newPassword, 'newPassword').throwIfInvalid();

  const [user] = await query('SELECT PasswordHash FROM Users WHERE UserId = @userId', { userId: req.user.userId });
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new AppError('Current password is incorrect', 400, { currentPassword: 'Current password is incorrect' });
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE Users SET PasswordHash = @hash WHERE UserId = @userId', { hash, userId: req.user.userId });
  res.json({ success: true, message: 'Password changed successfully' });
});
