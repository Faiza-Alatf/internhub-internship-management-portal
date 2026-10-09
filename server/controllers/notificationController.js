const { query } = require('../config/db');
const AppError = require('../utils/AppError');
const h = require('../utils/asyncHandler');
const { toId } = require('../utils/Validator');

// GET /api/notifications  -> latest 50 for the logged-in user
exports.list = h(async (req, res) => {
  const items = await query(
    `SELECT TOP 50 NotificationId, Title, Message, IsRead, CreatedAt FROM Notifications
     WHERE UserId = @userId ORDER BY CreatedAt DESC, NotificationId DESC`, { userId: req.user.userId });
  const [{ unreadCount }] = await query('SELECT COUNT(*) AS unreadCount FROM Notifications WHERE UserId = @userId AND IsRead = 0', { userId: req.user.userId });
  res.json({ success: true, data: { items, unreadCount } });
});

// PUT /api/notifications/:id/read
exports.markRead = h(async (req, res) => {
  const id = toId(req.params.id, 'notification ID');
  const result = await query(
    'UPDATE Notifications SET IsRead = 1 OUTPUT INSERTED.NotificationId WHERE NotificationId = @id AND UserId = @userId',
    { id, userId: req.user.userId });
  if (!result.length) throw new AppError('Notification not found', 404);
  res.json({ success: true, message: 'Notification marked as read' });
});

// PUT /api/notifications/read-all
exports.markAllRead = h(async (req, res) => {
  await query('UPDATE Notifications SET IsRead = 1 WHERE UserId = @userId AND IsRead = 0', { userId: req.user.userId });
  res.json({ success: true, message: 'All notifications marked as read' });
});
