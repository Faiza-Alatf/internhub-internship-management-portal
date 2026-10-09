const { query } = require('../config/db');

// "runner" lets us reuse these helpers inside a transaction (pass the transaction's run function)
async function notifyUser(userId, title, message, runner = query) {
  if (!userId) return;
  await runner('INSERT INTO Notifications (UserId, Title, Message) VALUES (@userId, @title, @message)', { userId, title, message });
}

async function notifyMentor(mentorId, title, message, runner = query) {
  if (!mentorId) return;
  const [mentor] = await runner('SELECT UserId FROM Mentors WHERE MentorId = @mentorId', { mentorId });
  if (mentor) await notifyUser(mentor.userId, title, message, runner);
}

async function notifyIntern(internId, title, message, runner = query) {
  const [intern] = await runner('SELECT UserId FROM Interns WHERE InternId = @internId', { internId });
  if (intern) await notifyUser(intern.userId, title, message, runner);
}

module.exports = { notifyUser, notifyMentor, notifyIntern };
