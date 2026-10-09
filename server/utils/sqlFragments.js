const { query } = require('../config/db');

// A task is "Overdue" when it is not completed and its due date has passed.
// We compute it on the fly so it is always correct without a scheduled job.
const EFFECTIVE_TASK_STATUS = `CASE WHEN t.Status <> 'Completed' AND t.DueDate < CAST(SYSDATETIME() AS DATE) THEN 'Overdue' ELSE t.Status END`;

// Limits queries to the interns the logged-in user may see (alias "i" = Interns table)
//   ADMIN  -> everyone | MENTOR -> own interns | INTERN -> only themselves
function internScope(user, alias = 'i') {
  if (user.role === 'MENTOR') return { clause: ` AND ${alias}.MentorId = @scopeMentorId`, params: { scopeMentorId: user.mentorId } };
  if (user.role === 'INTERN') return { clause: ` AND ${alias}.InternId = @scopeInternId`, params: { scopeInternId: user.internId } };
  return { clause: '', params: {} };
}

// Returns the intern if the user is allowed to access it, otherwise undefined
async function findScopedIntern(user, internId) {
  const { clause, params } = internScope(user);
  const rows = await query(
    `SELECT i.InternId, i.UserId, i.MentorId, u.FullName
     FROM Interns i JOIN Users u ON u.UserId = i.UserId
     WHERE i.InternId = @internId ${clause}`,
    { internId, ...params }
  );
  return rows[0];
}

module.exports = { EFFECTIVE_TASK_STATUS, internScope, findScopedIntern };
