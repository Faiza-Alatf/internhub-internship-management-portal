const { query } = require('../config/db');
const AppError = require('../utils/AppError');
const h = require('../utils/asyncHandler');
const { Validator, toId, todayString } = require('../utils/Validator');
const { internScope, findScopedIntern } = require('../utils/sqlFragments');
const { notifyIntern } = require('../services/notificationService');

const EVAL_SELECT = `
  SELECT e.EvaluationId, e.InternId, iu.FullName AS InternName, e.MentorId, mu.FullName AS MentorName,
    e.TechnicalSkills, e.Communication, e.Teamwork, e.ProblemSolving, e.Professionalism,
    e.OverallRating, e.Feedback, CONVERT(VARCHAR(10), e.EvaluationDate, 23) AS EvaluationDate
  FROM Evaluations e
  JOIN Interns i ON i.InternId = e.InternId
  JOIN Users iu ON iu.UserId = i.UserId
  JOIN Mentors m ON m.MentorId = e.MentorId
  JOIN Users mu ON mu.UserId = m.UserId`;

// GET /api/evaluations?internId=
exports.list = h(async (req, res) => {
  const scope = internScope(req.user);
  let sql = `${EVAL_SELECT} WHERE 1 = 1 ${scope.clause}`;
  const params = { ...scope.params };
  if (req.query.internId) { sql += ' AND e.InternId = @internId'; params.internId = toId(req.query.internId, 'intern ID'); }
  const data = await query(`${sql} ORDER BY e.EvaluationDate DESC, e.EvaluationId DESC`, params);
  res.json({ success: true, data });
});

// POST /api/evaluations  (ADMIN or MENTOR). Overall rating = average of the 5 scores.
exports.create = h(async (req, res) => {
  const b = req.body;
  new Validator().id(b.internId, 'internId', 'Intern')
    .rating(b.technicalSkills, 'technicalSkills', 'Technical skills').rating(b.communication, 'communication', 'Communication')
    .rating(b.teamwork, 'teamwork', 'Teamwork').rating(b.problemSolving, 'problemSolving', 'Problem solving')
    .rating(b.professionalism, 'professionalism', 'Professionalism')
    .required(b.feedback, 'feedback', 'Feedback').maxLength(b.feedback, 'feedback', 'Feedback', 1000)
    .date(b.evaluationDate, 'evaluationDate', 'Evaluation date').throwIfInvalid();
  if (b.feedback.trim().length < 10) throw new AppError('Feedback is too short', 400, { feedback: 'Please write at least 10 characters of feedback' });
  if (b.evaluationDate && b.evaluationDate > todayString()) throw new AppError('Evaluation date cannot be in the future', 400, { evaluationDate: 'Date cannot be in the future' });

  const intern = await findScopedIntern(req.user, Number(b.internId));
  if (!intern) throw new AppError('Intern not found or not assigned to you', 404, { internId: 'Intern not found' });

  const mentorId = req.user.role === 'MENTOR' ? req.user.mentorId : intern.mentorId;
  if (!mentorId) throw new AppError('Assign a mentor to this intern before evaluating', 400, { internId: 'This intern has no mentor yet' });

  const scores = [b.technicalSkills, b.communication, b.teamwork, b.problemSolving, b.professionalism].map(Number);
  const overall = Math.round((scores.reduce((a, c) => a + c, 0) / scores.length) * 100) / 100;

  const [created] = await query(
    `INSERT INTO Evaluations (InternId, MentorId, TechnicalSkills, Communication, Teamwork, ProblemSolving, Professionalism, OverallRating, Feedback, EvaluationDate)
     OUTPUT INSERTED.EvaluationId
     VALUES (@internId, @mentorId, @t, @c, @tm, @p, @pr, @overall, @feedback, COALESCE(CAST(@date AS DATE), CAST(SYSDATETIME() AS DATE)))`,
    { internId: intern.internId, mentorId, t: scores[0], c: scores[1], tm: scores[2], p: scores[3], pr: scores[4], overall, feedback: b.feedback.trim(), date: b.evaluationDate || null });

  await notifyIntern(intern.internId, 'Evaluation submitted', 'Your evaluation has been submitted. You have received mentor feedback.');
  const [data] = await query(`${EVAL_SELECT} WHERE e.EvaluationId = @id`, { id: created.evaluationId });
  res.status(201).json({ success: true, message: 'Evaluation submitted successfully', data });
});
