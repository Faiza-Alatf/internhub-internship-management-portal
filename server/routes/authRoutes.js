const router = require('express').Router();
const c = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.post('/login', c.login);
router.post('/register', authenticateToken, requireRole('ADMIN'), c.register);
router.get('/me', authenticateToken, c.me);
router.put('/profile', authenticateToken, c.updateProfile);
router.put('/password', authenticateToken, c.changePassword);

module.exports = router;
