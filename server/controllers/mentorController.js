const bcrypt = require('bcryptjs');
const { query, withTransaction } = require('../config/db');
const AppError = require('../utils/AppError');
const h = require('../utils/asyncHandler');
const { Validator, toId } = require('../utils/Validator');

const MENTOR_SELECT = `
  SELECT m.MentorId, m.UserId, u.FullName, u.Email, u.IsActive, m.DepartmentId, d.DepartmentName, m.Position, m.CreatedAt,
    (SELECT COUNT(*) FROM Interns i WHERE i.MentorId = m.MentorId) AS InternCount,
    (SELECT COUNT(*) FROM Tasks t WHERE t.MentorId = m.MentorId) AS TaskCount,
    (SELECT CAST(AVG(e.OverallRating) AS DECIMAL(3,2)) FROM Evaluations e
       JOIN Interns i ON i.InternId = e.InternId WHERE i.MentorId = m.MentorId) AS Performance
  FROM Mentors m
  JOIN Users u ON u.UserId = m.UserId
  JOIN Departments d ON d.DepartmentId = m.DepartmentId`;

const findMentor = async (id) => (await query(`${MENTOR_SELECT} WHERE m.MentorId = @id`, { id }))[0];

async function validateMentor(b, creating) {
  new Validator().required(b.fullName, 'fullName', 'Full name').maxLength(b.fullName, 'fullName', 'Full name', 120)
    .required(b.email, 'email', 'Email').email(b.email).id(b.departmentId, 'departmentId', 'Department')
    .required(b.position, 'position', 'Position').maxLength(b.position, 'position', 'Position', 100)
    .required(creating ? b.password : 'x', 'password', 'Password').password(creating ? b.password : undefined).throwIfInvalid();
  const dept = await query('SELECT 1 AS x FROM Departments WHERE DepartmentId = @id', { id: b.departmentId });
  if (!dept.length) throw new AppError('Selected department does not exist', 400, { departmentId: 'Department not found' });
}

// GET /api/mentors?search=
exports.list = h(async (req, res) => {
  const { search, departmentId } = req.query;
  let sql = `${MENTOR_SELECT} WHERE u.IsActive = 1`;
  const params = {};
  if (search) { sql += ' AND (u.FullName LIKE @search OR u.Email LIKE @search)'; params.search = `%${search}%`; }
  if (departmentId) { sql += ' AND m.DepartmentId = @departmentId'; params.departmentId = toId(departmentId, 'department ID'); }
  const data = await query(`${sql} ORDER BY u.FullName`, params);
  res.json({ success: true, data });
});

// GET /api/mentors/:id  (admin, the mentor themselves, or one of their interns)
exports.getById = h(async (req, res) => {
  const id = toId(req.params.id, 'mentor ID');
  const { role, mentorId, internId } = req.user;
  if (role === 'MENTOR' && mentorId !== id) throw new AppError('You can only view your own profile', 403);
  if (role === 'INTERN') {
    const [own] = await query('SELECT MentorId FROM Interns WHERE InternId = @internId', { internId });
    if (!own || own.mentorId !== id) throw new AppError('You can only view your own mentor', 403);
  }
  const mentor = await findMentor(id);
  if (!mentor) throw new AppError('Mentor not found', 404);

  mentor.interns = await query(
    `SELECT i.InternId, u.FullName, u.Email, i.Status, d.DepartmentName,
       CAST((SELECT AVG(e.OverallRating) FROM Evaluations e WHERE e.InternId = i.InternId) AS DECIMAL(3,2)) AS Performance
     FROM Interns i JOIN Users u ON u.UserId = i.UserId JOIN Departments d ON d.DepartmentId = i.DepartmentId
     WHERE i.MentorId = @id ORDER BY u.FullName`, { id });
  res.json({ success: true, data: mentor });
});

// POST /api/mentors
exports.create = h(async (req, res) => {
  const b = req.body;
  await validateMentor(b, true);
  const email = b.email.trim().toLowerCase();
  const dup = await query('SELECT 1 AS x FROM Users WHERE Email = @email', { email });
  if (dup.length) throw new AppError('An account with this email already exists', 409, { email: 'Email is already registered' });

  const hash = await bcrypt.hash(b.password, 10);
  const mentorId = await withTransaction(async (run) => {
    const [user] = await run(
      `INSERT INTO Users (FullName, Email, PasswordHash, Role) OUTPUT INSERTED.UserId VALUES (@fullName, @email, @hash, 'MENTOR')`,
      { fullName: b.fullName.trim(), email, hash });
    const [mentor] = await run(
      `INSERT INTO Mentors (UserId, DepartmentId, Position) OUTPUT INSERTED.MentorId VALUES (@userId, @departmentId, @position)`,
      { userId: user.userId, departmentId: Number(b.departmentId), position: b.position.trim() });
    return mentor.mentorId;
  });
  res.status(201).json({ success: true, message: 'Mentor added successfully', data: await findMentor(mentorId) });
});

// PUT /api/mentors/:id
exports.update = h(async (req, res) => {
  const id = toId(req.params.id, 'mentor ID');
  const b = req.body;
  const existing = await findMentor(id);
  if (!existing) throw new AppError('Mentor not found', 404);
  await validateMentor(b, false);
  const email = b.email.trim().toLowerCase();
  const dup = await query('SELECT 1 AS x FROM Users WHERE Email = @email AND UserId <> @userId', { email, userId: existing.userId });
  if (dup.length) throw new AppError('An account with this email already exists', 409, { email: 'Email is already registered' });

  await withTransaction(async (run) => {
    await run('UPDATE Users SET FullName = @fullName, Email = @email WHERE UserId = @userId', { fullName: b.fullName.trim(), email, userId: existing.userId });
    await run('UPDATE Mentors SET DepartmentId = @departmentId, Position = @position WHERE MentorId = @id',
      { departmentId: Number(b.departmentId), position: b.position.trim(), id });
  });
  res.json({ success: true, message: 'Mentor updated successfully', data: await findMentor(id) });
});

// DELETE /api/mentors/:id  -> deactivates the account (history is kept)
exports.remove = h(async (req, res) => {
  const id = toId(req.params.id, 'mentor ID');
  const existing = await findMentor(id);
  if (!existing) throw new AppError('Mentor not found', 404);
  const [assigned] = await query(`SELECT COUNT(*) AS total FROM Interns WHERE MentorId = @id AND Status IN ('Active','On Hold')`, { id });
  if (assigned.total > 0) throw new AppError(`This mentor still has ${assigned.total} active intern(s). Reassign them first.`, 409);
  await query('UPDATE Users SET IsActive = 0 WHERE UserId = @userId', { userId: existing.userId });
  res.json({ success: true, message: 'Mentor deactivated successfully' });
});
