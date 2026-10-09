/* Useful queries for exploring the data during your demo */
USE InternshipManagementDB;
GO

-- 1. All interns with department, mentor and average performance
SELECT u.FullName AS Intern, d.DepartmentName, mu.FullName AS Mentor, i.Status,
       CAST(AVG(e.OverallRating) AS DECIMAL(3,2)) AS Performance
FROM dbo.Interns i
JOIN dbo.Users u ON u.UserId = i.UserId
JOIN dbo.Departments d ON d.DepartmentId = i.DepartmentId
LEFT JOIN dbo.Mentors m ON m.MentorId = i.MentorId
LEFT JOIN dbo.Users mu ON mu.UserId = m.UserId
LEFT JOIN dbo.Evaluations e ON e.InternId = i.InternId
GROUP BY u.FullName, d.DepartmentName, mu.FullName, i.Status;

-- 2. Task status per intern
SELECT u.FullName, t.Status, COUNT(*) AS Total
FROM dbo.Tasks t
JOIN dbo.Interns i ON i.InternId = t.InternId
JOIN dbo.Users u ON u.UserId = i.UserId
GROUP BY u.FullName, t.Status ORDER BY u.FullName;

-- 3. Overdue tasks right now
SELECT u.FullName, t.Title, t.DueDate
FROM dbo.Tasks t
JOIN dbo.Interns i ON i.InternId = t.InternId
JOIN dbo.Users u ON u.UserId = i.UserId
WHERE t.Status <> 'Completed' AND t.DueDate < CAST(SYSDATETIME() AS DATE);

-- 4. Attendance percentage per intern
SELECT u.FullName,
       CAST(SUM(CASE WHEN a.Status IN ('Present','Late') THEN 1 ELSE 0 END) * 100.0
            / NULLIF(SUM(CASE WHEN a.Status <> 'Leave' THEN 1 ELSE 0 END), 0) AS DECIMAL(5,1)) AS AttendancePercent
FROM dbo.Attendance a
JOIN dbo.Interns i ON i.InternId = a.InternId
JOIN dbo.Users u ON u.UserId = i.UserId
GROUP BY u.FullName;

-- 5. Latest unread notifications
SELECT TOP 10 u.FullName, n.Title, n.Message, n.CreatedAt
FROM dbo.Notifications n JOIN dbo.Users u ON u.UserId = n.UserId
WHERE n.IsRead = 0 ORDER BY n.CreatedAt DESC;
