const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { query } = require('../config/db');
const AppError = require('../utils/AppError');

// 1) Verifies the JWT and loads the current user (so deactivated users are blocked immediately)
async function authenticateToken(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new AppError('Authentication required. Please log in.', 401);

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch (err) {
      throw new AppError('Your session has expired. Please log in again.', 401);
    }

    const [user] = await query(
      `SELECT u.UserId, u.FullName, u.Email, u.Role, u.IsActive, m.MentorId, i.InternId
       FROM Users u
       LEFT JOIN Mentors m ON m.UserId = u.UserId
       LEFT JOIN Interns i ON i.UserId = u.UserId
       WHERE u.UserId = @userId`,
      { userId: payload.userId }
    );
    if (!user || !user.isActive) throw new AppError('This account is disabled or no longer exists.', 401);

    req.user = { userId: user.userId, fullName: user.fullName, email: user.email, role: user.role, mentorId: user.mentorId, internId: user.internId };
    next();
  } catch (err) {
    next(err);
  }
}

// 2) Role check:  router.post('/', authenticateToken, requireRole('ADMIN'), handler)
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};

module.exports = { authenticateToken, requireRole };
