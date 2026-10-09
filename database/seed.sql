/* =====================================================================
   Internship Management Portal - Seed data
   Run AFTER schema.sql. Passwords are stored as bcrypt hashes.
   Demo logins:  admin@internportal.com / Admin@123
                 mentor@internportal.com / Mentor@123
                 intern@internportal.com / Intern@123
   ===================================================================== */
USE InternshipManagementDB;
GO

IF EXISTS (SELECT 1 FROM dbo.Users)
BEGIN
    PRINT 'Seed skipped: data already exists. Run schema.sql first for a clean reset.';
    RETURN;
END

DECLARE @AdminHash  NVARCHAR(255) = N'$2a$10$4r.zpFSOmPUoTOw7RsmNBO/SQTLjCrkcH5UD0VIvjLr5R81VMj9jS';
DECLARE @MentorHash NVARCHAR(255) = N'$2a$10$mRYaOXNMbTA3dSwArYZFEOf/Tw/cZOo4t2NEzZjPVYCTzatDgplVe';
DECLARE @InternHash NVARCHAR(255) = N'$2a$10$Z0llwVW5zMPYZ89BxBgR/OXPePB11YqqgHfLzQASCoy4gK.gA0bzi';
DECLARE @Today DATE = CAST(SYSDATETIME() AS DATE);

-- Departments -----------------------------------------------------------
INSERT INTO dbo.Departments (DepartmentName, Description) VALUES
(N'Software Development', N'Backend, frontend and mobile engineering for internal and customer products.'),
(N'Quality Assurance',    N'Manual and automated testing, release validation and defect management.'),
(N'UI/UX Design',         N'Product design, prototyping, usability research and design systems.'),
(N'Data Analytics',       N'Reporting, dashboards, SQL analysis and business intelligence.'),
(N'Human Resources',      N'Recruitment, onboarding, employee engagement and HR operations.');

-- Users -----------------------------------------------------------------
INSERT INTO dbo.Users (FullName, Email, PasswordHash, Role) VALUES
(N'Hira Sheikh',     N'admin@internportal.com',           @AdminHash,  'ADMIN'),
(N'John Smith',      N'mentor@internportal.com',          @MentorHash, 'MENTOR'),
(N'Sana Malik',      N'sana.malik@internportal.com',      @MentorHash, 'MENTOR'),
(N'Daniel Ahmed',    N'daniel.ahmed@internportal.com',    @MentorHash, 'MENTOR'),
(N'Maryam Qureshi',  N'maryam.qureshi@internportal.com',  @MentorHash, 'MENTOR'),
(N'Rabia Noman',     N'rabia.noman@internportal.com',     @MentorHash, 'MENTOR'),
(N'Faiza Altaf',     N'intern@internportal.com',          @InternHash, 'INTERN'),
(N'Hamza Raza',      N'hamza.raza@internportal.com',      @InternHash, 'INTERN'),
(N'Areeba Siddiqui', N'areeba.siddiqui@internportal.com', @InternHash, 'INTERN'),
(N'Usman Tariq',     N'usman.tariq@internportal.com',     @InternHash, 'INTERN'),
(N'Noor Fatima',     N'noor.fatima@internportal.com',     @InternHash, 'INTERN'),
(N'Bilal Hussain',   N'bilal.hussain@internportal.com',   @InternHash, 'INTERN'),
(N'Zainab Ali',      N'zainab.ali@internportal.com',      @InternHash, 'INTERN'),
(N'Saad Mehmood',    N'saad.mehmood@internportal.com',    @InternHash, 'INTERN');

-- Mentors ---------------------------------------------------------------
INSERT INTO dbo.Mentors (UserId, DepartmentId, Position)
SELECT u.UserId, d.DepartmentId, v.Position
FROM (VALUES
    (N'mentor@internportal.com',         N'Software Development', N'Senior Software Engineer'),
    (N'sana.malik@internportal.com',     N'Quality Assurance',    N'QA Lead'),
    (N'daniel.ahmed@internportal.com',   N'UI/UX Design',         N'Product Design Lead'),
    (N'maryam.qureshi@internportal.com', N'Data Analytics',       N'Analytics Manager'),
    (N'rabia.noman@internportal.com',    N'Human Resources',      N'HR Business Partner')
) AS v(Email, Dept, Position)
JOIN dbo.Users u ON u.Email = v.Email
JOIN dbo.Departments d ON d.DepartmentName = v.Dept;

-- Interns ---------------------------------------------------------------
INSERT INTO dbo.Interns (UserId, DepartmentId, MentorId, University, Degree, Semester, StartDate, EndDate, Status)
SELECT u.UserId, d.DepartmentId, m.MentorId, v.University, v.Degree, v.Semester,
       CAST(v.StartDate AS DATE), CAST(v.EndDate AS DATE), v.Status
FROM (VALUES
    (N'intern@internportal.com',         N'Software Development', N'mentor@internportal.com',         N'Bahria University',        N'BS Software Engineering',       N'7th', '2026-09-01', '2026-11-30', 'Active'),
    (N'hamza.raza@internportal.com',     N'Software Development', N'mentor@internportal.com',         N'FAST NUCES',               N'BS Computer Science',           N'6th', '2026-09-01', '2026-11-30', 'Active'),
    (N'areeba.siddiqui@internportal.com',N'Quality Assurance',    N'sana.malik@internportal.com',     N'NED University',           N'BS Software Engineering',       N'7th', '2026-09-01', '2026-11-30', 'Active'),
    (N'usman.tariq@internportal.com',    N'Quality Assurance',    N'sana.malik@internportal.com',     N'IBA Karachi',              N'BS Computer Science',           N'8th', '2026-09-15', '2026-12-15', 'Active'),
    (N'noor.fatima@internportal.com',    N'UI/UX Design',         N'daniel.ahmed@internportal.com',   N'SZABIST',                  N'BS Graphic Design',             N'5th', '2026-09-01', '2026-11-30', 'Active'),
    (N'bilal.hussain@internportal.com',  N'Data Analytics',       N'maryam.qureshi@internportal.com', N'University of Karachi',    N'BS Statistics',                 N'7th', '2026-06-01', '2026-08-31', 'Completed'),
    (N'zainab.ali@internportal.com',     N'Data Analytics',       N'maryam.qureshi@internportal.com', N'Habib University',         N'BS Computer Science',           N'6th', '2026-09-08', '2026-12-08', 'Active'),
    (N'saad.mehmood@internportal.com',   N'Human Resources',      N'rabia.noman@internportal.com',    N'Institute of Business Management', N'BBA Human Resource Management', N'8th', '2026-09-01', '2026-11-30', 'On Hold')
) AS v(Email, Dept, MentorEmail, University, Degree, Semester, StartDate, EndDate, Status)
JOIN dbo.Users u ON u.Email = v.Email
JOIN dbo.Departments d ON d.DepartmentName = v.Dept
JOIN dbo.Users mu ON mu.Email = v.MentorEmail
JOIN dbo.Mentors m ON m.UserId = mu.UserId;

-- Tasks (due dates are relative to today so the demo always looks current) ----
INSERT INTO dbo.Tasks (Title, Description, InternId, MentorId, Priority, Status, DueDate, MentorComment, CompletedAt)
SELECT v.Title, v.Description, i.InternId, i.MentorId, v.Priority, v.Status,
       DATEADD(DAY, v.DueOffset, @Today), v.Comment,
       CASE WHEN v.Status = 'Completed' THEN DATEADD(DAY, v.DueOffset - 1, SYSUTCDATETIME()) END
FROM (VALUES
 (N'intern@internportal.com', N'Implement Employee Authentication API', N'Build login and JWT refresh endpoints with bcrypt password hashing and validation.', 'High', 'In Progress', 3, NULL),
 (N'intern@internportal.com', N'Create Internship Dashboard UI', N'Build the dashboard layout with stat cards and Recharts analytics using the approved wireframes.', 'High', 'Completed', -4, N'Clean component structure and great attention to spacing. Well done.'),
 (N'intern@internportal.com', N'Perform API Testing', N'Test all intern and task endpoints in Postman and record results in the shared sheet.', 'Medium', 'Pending', 6, NULL),
 (N'intern@internportal.com', N'Prepare Weekly Progress Report', N'Summarise completed work, blockers and next-week plan in the weekly report template.', 'Low', 'Completed', -2, N'Concise and clear. Keep this format.'),
 (N'intern@internportal.com', N'Fix Responsive Layout Issues', N'Resolve table overflow and sidebar issues reported on tablet and mobile breakpoints.', 'Medium', 'Pending', -1, NULL),
 (N'intern@internportal.com', N'Write Unit Tests for Task Service', N'Cover create, update and delete flows with unit tests and aim for 80% coverage.', 'Medium', 'Pending', 10, NULL),
 (N'hamza.raza@internportal.com', N'Design Database Schema for Leave Module', N'Create an ER diagram and SQL scripts for leave requests and approvals.', 'High', 'Completed', -6, N'Normalisation looks solid.'),
 (N'hamza.raza@internportal.com', N'Build Employee Search Endpoint', N'Implement paginated search by name and department with parameterised queries.', 'Medium', 'In Progress', 2, NULL),
 (N'hamza.raza@internportal.com', N'Document REST API with Swagger', N'Document all existing endpoints with request and response examples.', 'Low', 'Pending', 8, NULL),
 (N'hamza.raza@internportal.com', N'Refactor Error Handling Middleware', N'Centralise error responses and map database errors to friendly messages.', 'Medium', 'Pending', -2, NULL),
 (N'areeba.siddiqui@internportal.com', N'Write Test Cases for Login Module', N'Prepare positive, negative and boundary test cases for the login flow.', 'High', 'Completed', -5, N'Good coverage of edge cases.'),
 (N'areeba.siddiqui@internportal.com', N'Execute Regression Test Suite', N'Run the full regression suite for release 2.4 and report failures.', 'Critical', 'In Progress', 1, NULL),
 (N'areeba.siddiqui@internportal.com', N'Log Defects in Tracking Sheet', N'Log, prioritise and assign all defects found during the regression cycle.', 'Medium', 'Pending', 4, NULL),
 (N'areeba.siddiqui@internportal.com', N'Prepare Weekly Progress Report', N'Share test execution summary and defect trends for the week.', 'Low', 'Completed', -3, NULL),
 (N'usman.tariq@internportal.com', N'Automate Smoke Tests with Postman', N'Create a Postman collection with environment variables and run it with Newman.', 'High', 'In Progress', 5, NULL),
 (N'usman.tariq@internportal.com', N'Validate Payment Gateway Flows', N'Verify success, failure and timeout scenarios in the sandbox environment.', 'Critical', 'Pending', 2, NULL),
 (N'usman.tariq@internportal.com', N'Review Bug Reports with Mentor', N'Walk through open bug reports and agree on severity levels.', 'Low', 'Pending', 7, NULL),
 (N'noor.fatima@internportal.com', N'Redesign Onboarding Wireframes', N'Produce low and high fidelity wireframes for the new employee onboarding flow.', 'High', 'Completed', -7, N'Strong user flow thinking.'),
 (N'noor.fatima@internportal.com', N'Create Design System Components', N'Build buttons, inputs and cards with variants in the shared Figma library.', 'Medium', 'In Progress', 4, NULL),
 (N'noor.fatima@internportal.com', N'Conduct Usability Review', N'Run a five-user usability session on the prototype and summarise findings.', 'Medium', 'Pending', 9, NULL),
 (N'bilal.hussain@internportal.com', N'Build Monthly Attrition Dashboard', N'Create a dashboard that tracks monthly attrition by department.', 'High', 'Completed', -40, N'Excellent insights and presentation.'),
 (N'bilal.hussain@internportal.com', N'Clean Recruitment Dataset', N'Remove duplicates and standardise fields in the recruitment export.', 'Medium', 'Completed', -55, NULL),
 (N'zainab.ali@internportal.com', N'Analyze Intern Feedback Survey', N'Summarise survey responses and highlight the top improvement areas.', 'Medium', 'In Progress', 3, NULL),
 (N'zainab.ali@internportal.com', N'Create SQL Report for Attendance Trends', N'Write SQL to report weekly attendance by department.', 'High', 'Pending', 6, NULL),
 (N'saad.mehmood@internportal.com', N'Draft Interview Question Bank', N'Prepare role-based interview questions for technical and HR rounds.', 'Medium', 'Pending', 5, NULL),
 (N'saad.mehmood@internportal.com', N'Update Onboarding Checklist', N'Refresh the first-week onboarding checklist for new joiners.', 'Low', 'Completed', -4, NULL)
) AS v(Email, Title, Description, Priority, Status, DueOffset, Comment)
JOIN dbo.Users u ON u.Email = v.Email
JOIN dbo.Interns i ON i.UserId = u.UserId;

-- Attendance: weekdays from each intern's start date until today (or end date) ----
;WITH Dates AS (
    SELECT CAST('2026-06-01' AS DATE) AS D
    UNION ALL
    SELECT DATEADD(DAY, 1, D) FROM Dates WHERE D < @Today
)
INSERT INTO dbo.Attendance (InternId, AttendanceDate, Status, CheckInTime, CheckOutTime)
SELECT i.InternId, dt.D, s.Status,
       CASE s.Status
            WHEN 'Present' THEN DATEADD(MINUTE, r.R % 12, CAST('09:00' AS TIME(0)))
            WHEN 'Late'    THEN DATEADD(MINUTE, 15 + r.R % 30, CAST('09:00' AS TIME(0)))
       END,
       CASE WHEN s.Status IN ('Present','Late') THEN DATEADD(MINUTE, r.R % 40, CAST('17:00' AS TIME(0))) END
FROM dbo.Interns i
JOIN Dates dt ON dt.D BETWEEN i.StartDate AND CASE WHEN i.EndDate < @Today THEN i.EndDate ELSE @Today END
CROSS APPLY (SELECT ABS(CHECKSUM(i.InternId * 7919, DATEDIFF(DAY, '2026-01-01', dt.D) * 104729)) % 100 AS R) r
CROSS APPLY (SELECT CASE WHEN r.R < 80 THEN 'Present' WHEN r.R < 89 THEN 'Late'
                         WHEN r.R < 95 THEN 'Absent'  ELSE 'Leave' END AS Status) s
WHERE DATEDIFF(DAY, '2000-01-03', dt.D) % 7 < 5      -- Monday to Friday only
OPTION (MAXRECURSION 0);

-- Evaluations ----------------------------------------------------------
INSERT INTO dbo.Evaluations (InternId, MentorId, TechnicalSkills, Communication, Teamwork, ProblemSolving, Professionalism, OverallRating, Feedback, EvaluationDate)
SELECT i.InternId, i.MentorId, v.T, v.C, v.Tm, v.P, v.Pr,
       CAST((v.T + v.C + v.Tm + v.P + v.Pr) / 5.0 AS DECIMAL(3,2)), v.Feedback, DATEADD(DAY, -v.DaysAgo, @Today)
FROM (VALUES
 (N'intern@internportal.com',          5, 4, 5, 4, 5, N'Faiza picks up new concepts quickly and delivers clean, well-structured code. Keep sharing progress early in stand-ups.', 7),
 (N'hamza.raza@internportal.com',      4, 4, 4, 5, 4, N'Strong problem solving on the leave module schema. Work on writing more descriptive commit messages.', 6),
 (N'areeba.siddiqui@internportal.com', 4, 5, 4, 4, 5, N'Thorough test design and excellent communication of defects to the development team.', 5),
 (N'noor.fatima@internportal.com',     4, 4, 5, 3, 4, N'Creative layouts and great teamwork with developers. Spend more time validating ideas with users.', 8),
 (N'bilal.hussain@internportal.com',   4, 4, 4, 4, 4, N'Mid-internship: reliable delivery and good SQL fundamentals.', 60),
 (N'bilal.hussain@internportal.com',   5, 4, 4, 5, 5, N'Final evaluation: outstanding analytical work. Recommended for a full-time opportunity.', 38)
) AS v(Email, T, C, Tm, P, Pr, Feedback, DaysAgo)
JOIN dbo.Users u ON u.Email = v.Email
JOIN dbo.Interns i ON i.UserId = u.UserId;

-- Notifications ---------------------------------------------------------
INSERT INTO dbo.Notifications (UserId, Title, Message, IsRead, CreatedAt)
SELECT u.UserId, v.Title, v.Message, v.IsRead, DATEADD(HOUR, -v.HoursAgo, SYSUTCDATETIME())
FROM (VALUES
 (N'intern@internportal.com', N'New task assigned',          N'New task assigned to you: Write Unit Tests for Task Service.', 0, 3),
 (N'intern@internportal.com', N'Task deadline approaching',  N'Task deadline is approaching: "Implement Employee Authentication API" is due in 3 days.', 0, 8),
 (N'intern@internportal.com', N'Evaluation submitted',       N'Your evaluation has been submitted by John Smith.', 0, 26),
 (N'intern@internportal.com', N'Mentor feedback',            N'You have received mentor feedback on "Create Internship Dashboard UI".', 1, 50),
 (N'intern@internportal.com', N'Welcome to the programme',   N'Welcome aboard! Your mentor is John Smith.', 1, 300),
 (N'mentor@internportal.com', N'Task ready for review',      N'Faiza Altaf completed "Prepare Weekly Progress Report".', 0, 5),
 (N'mentor@internportal.com', N'New intern assigned',        N'Hamza Raza has been assigned to you.', 1, 200),
 (N'admin@internportal.com',  N'Weekly summary',             N'8 interns are enrolled across 5 departments.', 0, 12)
) AS v(Email, Title, Message, IsRead, HoursAgo)
JOIN dbo.Users u ON u.Email = v.Email;

PRINT 'Seed data inserted successfully.';
GO
