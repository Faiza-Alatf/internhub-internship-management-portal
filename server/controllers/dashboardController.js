const { query } = require('../config/db');
const h = require('../utils/asyncHandler');
const { EFFECTIVE_TASK_STATUS, internScope } = require('../utils/sqlFragments');

// GET /api/dashboard/stats  - numbers are calculated by SQL Server, scoped to what the role may see
exports.stats = h(async (req, res) => {
  const { clause, params } = internScope(req.user);

  const [interns] = await query(
    `SELECT COUNT(*) AS totalInterns,
       ISNULL(SUM(CASE WHEN i.Status = 'Active' THEN 1 ELSE 0 END), 0) AS activeInterns,
       ISNULL(SUM(CASE WHEN i.Status = 'Completed' THEN 1 ELSE 0 END), 0) AS completedInternships
     FROM Interns i WHERE 1 = 1 ${clause}`, params);

  const [tasks] = await query(
    `SELECT ISNULL(SUM(CASE WHEN t.Status <> 'Completed' THEN 1 ELSE 0 END), 0) AS pendingTasks,
       ISNULL(SUM(CASE WHEN t.Status = 'Completed' THEN 1 ELSE 0 END), 0) AS completedTasks,
       ISNULL(SUM(CASE WHEN ${EFFECTIVE_TASK_STATUS} = 'Overdue' THEN 1 ELSE 0 END), 0) AS overdueTasks
     FROM Tasks t JOIN Interns i ON i.InternId = t.InternId WHERE 1 = 1 ${clause}`, params);

  const [attendance] = await query(
    `SELECT CAST(SUM(CASE WHEN a.Status IN ('Present','Late') THEN 1 ELSE 0 END) * 100.0
             / NULLIF(SUM(CASE WHEN a.Status <> 'Leave' THEN 1 ELSE 0 END), 0) AS DECIMAL(5,1)) AS attendanceRate
     FROM Attendance a JOIN Interns i ON i.InternId = a.InternId WHERE 1 = 1 ${clause}`, params);

  const [performance] = await query(
    `SELECT CAST(AVG(e.OverallRating) AS DECIMAL(3,2)) AS averagePerformance
     FROM Evaluations e JOIN Interns i ON i.InternId = e.InternId WHERE 1 = 1 ${clause}`, params);

  const [mentors] = await query(`SELECT COUNT(*) AS totalMentors FROM Mentors m JOIN Users u ON u.UserId = m.UserId WHERE u.IsActive = 1`);

  res.json({
    success: true,
    data: { ...interns, ...tasks, attendanceRate: attendance.attendanceRate ?? 0, averagePerformance: performance.averagePerformance ?? 0, totalMentors: mentors.totalMentors },
  });
});

// GET /api/dashboard/charts  - data for the four dashboard charts
exports.charts = h(async (req, res) => {
  const { clause, params } = internScope(req.user);

  const internsByDepartment = await query(
    `SELECT d.DepartmentName AS name, COUNT(i.InternId) AS value
     FROM Departments d LEFT JOIN Interns i ON i.DepartmentId = d.DepartmentId ${clause}
     GROUP BY d.DepartmentName HAVING COUNT(i.InternId) > 0 ORDER BY COUNT(i.InternId) DESC`, params);

  const statusRows = await query(
    `SELECT x.name, COUNT(*) AS value FROM (
       SELECT ${EFFECTIVE_TASK_STATUS} AS name
       FROM Tasks t JOIN Interns i ON i.InternId = t.InternId WHERE 1 = 1 ${clause}
     ) x GROUP BY x.name`, params);
  const taskStatus = ['Pending', 'In Progress', 'Completed', 'Overdue'].map((name) => ({ name, value: statusRows.find((r) => r.name === name)?.value || 0 }));

  const attendanceOverview = await query(
    `SELECT CONVERT(VARCHAR(10), a.AttendanceDate, 23) AS attendanceDate,
       SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) AS present,
       SUM(CASE WHEN a.Status = 'Late'    THEN 1 ELSE 0 END) AS late,
       SUM(CASE WHEN a.Status = 'Absent'  THEN 1 ELSE 0 END) AS absent,
       SUM(CASE WHEN a.Status = 'Leave'   THEN 1 ELSE 0 END) AS onLeave
     FROM Attendance a JOIN Interns i ON i.InternId = a.InternId
     WHERE a.AttendanceDate >= DATEADD(DAY, -20, CAST(SYSDATETIME() AS DATE)) ${clause}
     GROUP BY a.AttendanceDate ORDER BY a.AttendanceDate`, params);

  // Interns see their own evaluations over time; admin/mentor see an average per intern
  const performanceOverview = req.user.role === 'INTERN'
    ? await query(`SELECT CONVERT(VARCHAR(10), e.EvaluationDate, 23) AS name, e.OverallRating AS rating
                   FROM Evaluations e WHERE e.InternId = @scopeInternId ORDER BY e.EvaluationDate`, params)
    : await query(`SELECT TOP 10 u.FullName AS name, CAST(AVG(e.OverallRating) AS DECIMAL(3,2)) AS rating
                   FROM Evaluations e JOIN Interns i ON i.InternId = e.InternId JOIN Users u ON u.UserId = i.UserId
                   WHERE 1 = 1 ${clause} GROUP BY u.FullName ORDER BY AVG(e.OverallRating) DESC`, params);

  res.json({ success: true, data: { internsByDepartment, taskStatus, attendanceOverview, performanceOverview } });
});
