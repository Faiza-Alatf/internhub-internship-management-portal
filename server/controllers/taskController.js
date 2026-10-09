const { query } = require('../config/db');
const AppError = require('../utils/AppError');
const h = require('../utils/asyncHandler');
const { Validator, toId, todayString } = require('../utils/Validator');
const { EFFECTIVE_TASK_STATUS, internScope, findScopedIntern } = require('../utils/sqlFragments');
const { notifyIntern, notifyMentor } = require('../services/notificationService');

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const SETTABLE_STATUSES = ['Pending', 'In Progress', 'Completed']; // "Overdue" is calculated, never stored by users

const TASK_SELECT = `
  SELECT t.TaskId, t.Title, t.Description, t.InternId, iu.FullName AS InternName, t.MentorId, mu.FullName AS MentorName,
    t.Priority, ${EFFECTIVE_TASK_STATUS} AS Status, t.Status AS RawStatus,
    CONVERT(VARCHAR(10), t.DueDate, 23) AS DueDate, t.MentorComment, t.CreatedAt, t.CompletedAt
  FROM Tasks t
  JOIN Interns i ON i.InternId = t.InternId
  JOIN Users iu ON iu.UserId = i.UserId
  LEFT JOIN Mentors m ON m.MentorId = t.MentorId
  LEFT JOIN Users mu ON mu.UserId = m.UserId`;

// Loads a task only if the current user is allowed to see it
async function findScopedTask(user, id) {
  const scope = internScope(user);
  const [task] = await query(`${TASK_SELECT} WHERE t.TaskId = @id ${scope.clause}`, { id, ...scope.params });
  return task;
}

// GET /api/tasks?search=&priority=&status=&internId=&dueFrom=&dueTo=
exports.list = h(async (req, res) => {
  const { search, priority, status, internId, dueFrom, dueTo } = req.query;
  const scope = internScope(req.user);
  let sql = `${TASK_SELECT} WHERE 1 = 1 ${scope.clause}`;
  const params = { ...scope.params };

  if (search) { sql += ' AND (t.Title LIKE @search OR t.Description LIKE @search)'; params.search = `%${search}%`; }
  if (priority) {
    if (!PRIORITIES.includes(priority)) throw new AppError('Invalid priority filter', 400);
    sql += ' AND t.Priority = @priority'; params.priority = priority;
  }
  if (status) {
    if (![...SETTABLE_STATUSES, 'Overdue'].includes(status)) throw new AppError('Invalid status filter', 400);
    sql += ` AND (${EFFECTIVE_TASK_STATUS}) = @status`; params.status = status;
  }
  if (internId) { sql += ' AND t.InternId = @internId'; params.internId = toId(internId, 'intern ID'); }
  if (dueFrom) { sql += ' AND t.DueDate >= @dueFrom'; params.dueFrom = dueFrom; }
  if (dueTo) { sql += ' AND t.DueDate <= @dueTo'; params.dueTo = dueTo; }

  const data = await query(`${sql} ORDER BY t.DueDate ASC, t.TaskId DESC`, params);
  res.json({ success: true, data });
});

// GET /api/tasks/:id
exports.getById = h(async (req, res) => {
  const task = await findScopedTask(req.user, toId(req.params.id, 'task ID'));
  if (!task) throw new AppError('Task not found', 404);
  res.json({ success: true, data: task });
});

// POST /api/tasks  (ADMIN or MENTOR)
exports.create = h(async (req, res) => {
  const b = req.body;
  new Validator().required(b.title, 'title', 'Title').maxLength(b.title, 'title', 'Title', 200)
    .maxLength(b.description, 'description', 'Description', 1000)
    .id(b.internId, 'internId', 'Intern').oneOf(b.priority || 'Medium', PRIORITIES, 'priority', 'Priority')
    .required(b.dueDate, 'dueDate', 'Due date').date(b.dueDate, 'dueDate', 'Due date').throwIfInvalid();
  if (b.dueDate < todayString()) throw new AppError('Due date cannot be in the past', 400, { dueDate: 'Due date cannot be in the past' });

  const intern = await findScopedIntern(req.user, Number(b.internId));
  if (!intern) throw new AppError('Intern not found or not assigned to you', 404, { internId: 'Intern not found' });

  const mentorId = req.user.role === 'MENTOR' ? req.user.mentorId : intern.mentorId;
  const [created] = await query(
    `INSERT INTO Tasks (Title, Description, InternId, MentorId, Priority, DueDate)
     OUTPUT INSERTED.TaskId VALUES (@title, @description, @internId, @mentorId, @priority, @dueDate)`,
    { title: b.title.trim(), description: b.description?.trim() || null, internId: intern.internId, mentorId, priority: b.priority || 'Medium', dueDate: b.dueDate });

  await notifyIntern(intern.internId, 'New task assigned', `New task assigned to you: ${b.title.trim()}.`);
  res.status(201).json({ success: true, message: 'Task assigned successfully', data: await findScopedTask(req.user, created.taskId) });
});

// PUT /api/tasks/:id
//  - INTERN: may only change the status of their own task
//  - ADMIN/MENTOR: may edit everything
exports.update = h(async (req, res) => {
  const id = toId(req.params.id, 'task ID');
  const task = await findScopedTask(req.user, id);
  if (!task) throw new AppError('Task not found', 404);

  const isIntern = req.user.role === 'INTERN';
  const b = req.body;
  const next = {
    title: isIntern ? task.title : b.title ?? task.title,
    description: isIntern ? task.description : b.description ?? task.description,
    priority: isIntern ? task.priority : b.priority ?? task.priority,
    dueDate: isIntern ? task.dueDate : b.dueDate ?? task.dueDate,
    mentorComment: isIntern ? task.mentorComment : b.mentorComment ?? task.mentorComment,
    status: b.status ?? task.rawStatus,
  };

  new Validator().required(next.title, 'title', 'Title').maxLength(next.title, 'title', 'Title', 200)
    .maxLength(next.description, 'description', 'Description', 1000).maxLength(next.mentorComment, 'mentorComment', 'Comment', 500)
    .oneOf(next.priority, PRIORITIES, 'priority', 'Priority').date(next.dueDate, 'dueDate', 'Due date')
    .oneOf(next.status, SETTABLE_STATUSES, 'status', 'Status').throwIfInvalid();

  const becameCompleted = next.status === 'Completed' && task.rawStatus !== 'Completed';
  await query(
    `UPDATE Tasks SET Title = @title, Description = @description, Priority = @priority, DueDate = @dueDate,
       MentorComment = @mentorComment, Status = @status,
       CompletedAt = CASE WHEN @status = 'Completed' THEN COALESCE(CompletedAt, SYSUTCDATETIME()) ELSE NULL END
     WHERE TaskId = @id`,
    { title: next.title.trim(), description: next.description || null, priority: next.priority, dueDate: next.dueDate,
      mentorComment: next.mentorComment || null, status: next.status, id });

  // Notifications
  if (isIntern && next.status !== task.rawStatus) {
    const msg = becameCompleted ? `${req.user.fullName} completed "${task.title}". It is ready for review.` : `${req.user.fullName} moved "${task.title}" to ${next.status}.`;
    await notifyMentor(task.mentorId, becameCompleted ? 'Task ready for review' : 'Task status updated', msg);
  }
  if (!isIntern && next.mentorComment && next.mentorComment !== task.mentorComment) {
    await notifyIntern(task.internId, 'Mentor feedback', `You have received mentor feedback on "${task.title}".`);
  }
  res.json({ success: true, message: isIntern ? 'Task status updated' : 'Task updated successfully', data: await findScopedTask(req.user, id) });
});

// DELETE /api/tasks/:id  (ADMIN or MENTOR)
exports.remove = h(async (req, res) => {
  const id = toId(req.params.id, 'task ID');
  const task = await findScopedTask(req.user, id);
  if (!task) throw new AppError('Task not found', 404);
  await query('DELETE FROM Tasks WHERE TaskId = @id', { id });
  res.json({ success: true, message: 'Task deleted successfully' });
});
