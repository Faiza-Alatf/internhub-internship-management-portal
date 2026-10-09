const bcrypt = require('bcryptjs');
const { query, withTransaction } = require('../config/db');
const AppError = require('../utils/AppError');
const h = require('../utils/asyncHandler');
const { Validator, toId } = require('../utils/Validator');
const { internScope } = require('../utils/sqlFragments');
const { notifyUser, notifyMentor } = require('../services/notificationService');

const STATUSES = ['Active', 'Completed', 'On Hold', 'Terminated'];

// One reusable SELECT used by list + detail. Dates are returned as 'YYYY-MM-DD' text.
const INTERN_SELECT = `
  SELECT i.InternId, i.UserId, u.FullName, u.Email, u.IsActive,
    i.DepartmentId, d.DepartmentName, i.MentorId, mu.FullName AS MentorName, mu.Email AS MentorEmail, m.Position AS MentorPosition,
    i.University, i.Degree, i.Semester,
    CONVERT(VARCHAR(10), i.StartDate, 23) AS StartDate, CONVERT(VARCHAR(10), i.EndDate, 23) AS EndDate,
    DATEDIFF(DAY, i.StartDate, i.EndDate) + 1 AS DurationDays,
    i.Status, i.ProfileImage, i.CreatedAt,
    (SELECT CAST(AVG(e.OverallRating) AS DECIMAL(3,2)) FROM Evaluations e WHERE e.InternId = i.InternId) AS Performance,
    (SELECT CAST(SUM(CASE WHEN a.Status IN ('Present','Late') THEN 1 ELSE 0 END) * 100.0
             / NULLIF(SUM(CASE WHEN a.Status <> 'Leave' THEN 1 ELSE 0 END), 0) AS DECIMAL(5,1))
       FROM Attendance a WHERE a.InternId = i.InternId) AS AttendanceRate,
    (SELECT COUNT(*) FROM Tasks t WHERE t.InternId = i.InternId) AS TotalTasks,
    (SELECT COUNT(*) FROM Tasks t WHERE t.InternId = i.InternId AND t.Status = 'Completed') AS CompletedTasks
  FROM Interns i
  JOIN Users u ON u.UserId = i.UserId
  JOIN Departments d ON d.DepartmentId = i.DepartmentId
  LEFT JOIN Mentors m ON m.MentorId = i.MentorId
  LEFT JOIN Users mu ON mu.UserId = m.UserId`;

const findIntern = async (id) => (await query(`${INTERN_SELECT} WHERE i.InternId = @id`, { id }))[0];

function validateInternBody(b, creating) {
  const v = new Validator()
    .required(b.fullName, 'fullName', 'Full name').maxLength(b.fullName, 'fullName', 'Full name', 120)
    .required(b.email, 'email', 'Email').email(b.email)
    .id(b.departmentId, 'departmentId', 'Department').optionalId(b.mentorId, 'mentorId', 'Mentor')
    .required(b.university, 'university', 'University').maxLength(b.university, 'university', 'University', 150)
    .required(b.degree, 'degree', 'Degree').maxLength(b.degree, 'degree', 'Degree', 120)
    .required(b.semester, 'semester', 'Semester').maxLength(b.semester, 'semester', 'Semester', 20)
    .required(b.startDate, 'startDate', 'Start date').date(b.startDate, 'startDate', 'Start date')
    .required(b.endDate, 'endDate', 'End date').date(b.endDate, 'endDate', 'End date')
    .oneOf(b.status, STATUSES, 'status', 'Status');
  if (creating) v.required(b.password, 'password', 'Password').password(b.password);
  if (!v.errors.startDate && !v.errors.endDate && b.startDate && b.endDate && b.endDate < b.startDate) {
    v.fail('endDate', 'End date cannot be before the start date');
  }
  v.throwIfInvalid();
}

async function assertReferencesExist(b) {
  const dept = await query('SELECT 1 AS x FROM Departments WHERE DepartmentId = @id', { id: Number(b.departmentId) });
  if (!dept.length) throw new AppError('Selected department does not exist', 400, { departmentId: 'Department not found' });
  if (b.mentorId) {
    const mentor = await query('SELECT 1 AS x FROM Mentors m JOIN Users u ON u.UserId = m.UserId WHERE m.MentorId = @id AND u.IsActive = 1', { id: Number(b.mentorId) });
    if (!mentor.length) throw new AppError('Selected mentor does not exist', 400, { mentorId: 'Mentor not found' });
  }
}

// GET /api/interns?search=&departmentId=&status=&mentorId=
exports.list = h(async (req, res) => {
  const { search, departmentId, status, mentorId } = req.query;
  const scope = internScope(req.user);
  let sql = `${INTERN_SELECT} WHERE 1 = 1 ${scope.clause}`;
  const params = { ...scope.params };

  if (search) { sql += ' AND (u.FullName LIKE @search OR u.Email LIKE @search)'; params.search = `%${search}%`; }
  if (departmentId) { sql += ' AND i.DepartmentId = @departmentId'; params.departmentId = toId(departmentId, 'department ID'); }
  if (mentorId) { sql += ' AND i.MentorId = @mentorId'; params.mentorId = toId(mentorId, 'mentor ID'); }
  if (status) {
    if (!STATUSES.includes(status)) throw new AppError('Invalid status filter', 400);
    sql += ' AND i.Status = @status'; params.status = status;
  }
  const data = await query(`${sql} ORDER BY u.FullName`, params);
  res.json({ success: true, data });
});

// GET /api/interns/:id
exports.getById = h(async (req, res) => {
  const id = toId(req.params.id, 'intern ID');
  const scope = internScope(req.user);
  const [intern] = await query(`${INTERN_SELECT} WHERE i.InternId = @id ${scope.clause}`, { id, ...scope.params });
  if (!intern) throw new AppError('Intern not found', 404);
  res.json({ success: true, data: intern });
});

// POST /api/interns  (creates the login account + intern profile in one transaction)
exports.create = h(async (req, res) => {
  const b = req.body;
  validateInternBody(b, true);
  await assertReferencesExist(b);

  const email = b.email.trim().toLowerCase();
  const dup = await query('SELECT 1 AS x FROM Users WHERE Email = @email', { email });
  if (dup.length) throw new AppError('An account with this email already exists', 409, { email: 'Email is already registered' });

  const hash = await bcrypt.hash(b.password, 10);
  const status = b.status || 'Active';
  const mentorId = b.mentorId ? Number(b.mentorId) : null;

  const internId = await withTransaction(async (run) => {
    const [user] = await run(
      `INSERT INTO Users (FullName, Email, PasswordHash, Role, IsActive) OUTPUT INSERTED.UserId
       VALUES (@fullName, @email, @hash, 'INTERN', @isActive)`,
      { fullName: b.fullName.trim(), email, hash, isActive: status !== 'Terminated' });
    const [intern] = await run(
      `INSERT INTO Interns (UserId, DepartmentId, MentorId, University, Degree, Semester, StartDate, EndDate, Status)
       OUTPUT INSERTED.InternId
       VALUES (@userId, @departmentId, @mentorId, @university, @degree, @semester, @startDate, @endDate, @status)`,
      { userId: user.userId, departmentId: Number(b.departmentId), mentorId, university: b.university.trim(), degree: b.degree.trim(),
        semester: b.semester.trim(), startDate: b.startDate, endDate: b.endDate, status });
    await notifyUser(user.userId, 'Welcome to the internship programme', 'Your account is ready. Check your dashboard for tasks and updates.', run);
    await notifyMentor(mentorId, 'New intern assigned', `${b.fullName.trim()} has been assigned to you.`, run);
    return intern.internId;
  });
  res.status(201).json({ success: true, message: 'Intern added successfully', data: await findIntern(internId) });
});

// PUT /api/interns/:id
exports.update = h(async (req, res) => {
  const id = toId(req.params.id, 'intern ID');
  const b = req.body;
  const existing = await findIntern(id);
  if (!existing) throw new AppError('Intern not found', 404);
  validateInternBody(b, false);
  await assertReferencesExist(b);

  const email = b.email.trim().toLowerCase();
  const dup = await query('SELECT 1 AS x FROM Users WHERE Email = @email AND UserId <> @userId', { email, userId: existing.userId });
  if (dup.length) throw new AppError('An account with this email already exists', 409, { email: 'Email is already registered' });

  const status = b.status || existing.status;
  const mentorId = b.mentorId ? Number(b.mentorId) : null;

  await withTransaction(async (run) => {
    await run('UPDATE Users SET FullName = @fullName, Email = @email, IsActive = @isActive WHERE UserId = @userId',
      { fullName: b.fullName.trim(), email, isActive: status !== 'Terminated', userId: existing.userId });
    await run(
      `UPDATE Interns SET DepartmentId = @departmentId, MentorId = @mentorId, University = @university, Degree = @degree,
         Semester = @semester, StartDate = @startDate, EndDate = @endDate, Status = @status WHERE InternId = @id`,
      { departmentId: Number(b.departmentId), mentorId, university: b.university.trim(), degree: b.degree.trim(),
        semester: b.semester.trim(), startDate: b.startDate, endDate: b.endDate, status, id });
    if (mentorId && mentorId !== existing.mentorId) {
      await notifyMentor(mentorId, 'New intern assigned', `${b.fullName.trim()} has been assigned to you.`, run);
      await notifyUser(existing.userId, 'Mentor assigned', 'You have been assigned a new mentor. Check your profile for details.', run);
    }
  });
  res.json({ success: true, message: 'Intern updated successfully', data: await findIntern(id) });
});

// DELETE /api/interns/:id  -> soft delete: the account is deactivated, history is preserved
exports.remove = h(async (req, res) => {
  const id = toId(req.params.id, 'intern ID');
  const existing = await findIntern(id);
  if (!existing) throw new AppError('Intern not found', 404);
  await withTransaction(async (run) => {
    await run('UPDATE Users SET IsActive = 0 WHERE UserId = @userId', { userId: existing.userId });
    await run(`UPDATE Interns SET Status = 'Terminated' WHERE InternId = @id`, { id });
  });
  res.json({ success: true, message: 'Intern removed successfully' });
});
