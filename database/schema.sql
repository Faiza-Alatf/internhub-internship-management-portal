/* =====================================================================
   Internship Management Portal - Database schema
   Target : Microsoft SQL Server 2016+ (tested approach for SSMS 22)
   WARNING: This script DROPS and re-creates all tables (clean reset).
   ===================================================================== */
IF DB_ID(N'InternshipManagementDB') IS NULL
    CREATE DATABASE InternshipManagementDB;
GO
USE InternshipManagementDB;
GO

-- Drop in reverse dependency order so the script can be re-run safely
IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL DROP TABLE dbo.Notifications;
IF OBJECT_ID('dbo.Evaluations',   'U') IS NOT NULL DROP TABLE dbo.Evaluations;
IF OBJECT_ID('dbo.Attendance',    'U') IS NOT NULL DROP TABLE dbo.Attendance;
IF OBJECT_ID('dbo.Tasks',         'U') IS NOT NULL DROP TABLE dbo.Tasks;
IF OBJECT_ID('dbo.Interns',       'U') IS NOT NULL DROP TABLE dbo.Interns;
IF OBJECT_ID('dbo.Mentors',       'U') IS NOT NULL DROP TABLE dbo.Mentors;
IF OBJECT_ID('dbo.Users',         'U') IS NOT NULL DROP TABLE dbo.Users;
IF OBJECT_ID('dbo.Departments',   'U') IS NOT NULL DROP TABLE dbo.Departments;
GO

CREATE TABLE dbo.Departments (
    DepartmentId   INT IDENTITY(1,1) CONSTRAINT PK_Departments PRIMARY KEY,
    DepartmentName NVARCHAR(100) NOT NULL CONSTRAINT UQ_Departments_Name UNIQUE,
    Description    NVARCHAR(500) NULL
);

CREATE TABLE dbo.Users (
    UserId       INT IDENTITY(1,1) CONSTRAINT PK_Users PRIMARY KEY,
    FullName     NVARCHAR(120) NOT NULL,
    Email        NVARCHAR(150) NOT NULL CONSTRAINT UQ_Users_Email UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role         NVARCHAR(10)  NOT NULL CONSTRAINT CK_Users_Role CHECK (Role IN ('ADMIN','MENTOR','INTERN')),
    IsActive     BIT           NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1,
    CreatedAt    DATETIME2     NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.Mentors (
    MentorId     INT IDENTITY(1,1) CONSTRAINT PK_Mentors PRIMARY KEY,
    UserId       INT NOT NULL CONSTRAINT UQ_Mentors_User UNIQUE
                 CONSTRAINT FK_Mentors_Users REFERENCES dbo.Users(UserId),
    DepartmentId INT NOT NULL CONSTRAINT FK_Mentors_Departments REFERENCES dbo.Departments(DepartmentId),
    Position     NVARCHAR(100) NOT NULL,
    CreatedAt    DATETIME2 NOT NULL CONSTRAINT DF_Mentors_CreatedAt DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.Interns (
    InternId     INT IDENTITY(1,1) CONSTRAINT PK_Interns PRIMARY KEY,
    UserId       INT NOT NULL CONSTRAINT UQ_Interns_User UNIQUE
                 CONSTRAINT FK_Interns_Users REFERENCES dbo.Users(UserId),
    DepartmentId INT NOT NULL CONSTRAINT FK_Interns_Departments REFERENCES dbo.Departments(DepartmentId),
    MentorId     INT NULL CONSTRAINT FK_Interns_Mentors REFERENCES dbo.Mentors(MentorId),
    University   NVARCHAR(150) NOT NULL,
    Degree       NVARCHAR(120) NOT NULL,
    Semester     NVARCHAR(20)  NOT NULL,
    StartDate    DATE NOT NULL,
    EndDate      DATE NOT NULL,
    Status       NVARCHAR(15) NOT NULL CONSTRAINT DF_Interns_Status DEFAULT 'Active'
                 CONSTRAINT CK_Interns_Status CHECK (Status IN ('Active','Completed','On Hold','Terminated')),
    ProfileImage NVARCHAR(500) NULL,
    CreatedAt    DATETIME2 NOT NULL CONSTRAINT DF_Interns_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_Interns_Dates CHECK (EndDate >= StartDate)
);

CREATE TABLE dbo.Tasks (
    TaskId        INT IDENTITY(1,1) CONSTRAINT PK_Tasks PRIMARY KEY,
    Title         NVARCHAR(200) NOT NULL,
    Description   NVARCHAR(1000) NULL,
    InternId      INT NOT NULL CONSTRAINT FK_Tasks_Interns REFERENCES dbo.Interns(InternId),
    MentorId      INT NULL CONSTRAINT FK_Tasks_Mentors REFERENCES dbo.Mentors(MentorId),
    Priority      NVARCHAR(10) NOT NULL CONSTRAINT DF_Tasks_Priority DEFAULT 'Medium'
                  CONSTRAINT CK_Tasks_Priority CHECK (Priority IN ('Low','Medium','High','Critical')),
    Status        NVARCHAR(15) NOT NULL CONSTRAINT DF_Tasks_Status DEFAULT 'Pending'
                  CONSTRAINT CK_Tasks_Status CHECK (Status IN ('Pending','In Progress','Completed','Overdue')),
    DueDate       DATE NOT NULL,
    MentorComment NVARCHAR(500) NULL,
    CreatedAt     DATETIME2 NOT NULL CONSTRAINT DF_Tasks_CreatedAt DEFAULT SYSUTCDATETIME(),
    CompletedAt   DATETIME2 NULL
);

CREATE TABLE dbo.Attendance (
    AttendanceId   INT IDENTITY(1,1) CONSTRAINT PK_Attendance PRIMARY KEY,
    InternId       INT NOT NULL CONSTRAINT FK_Attendance_Interns REFERENCES dbo.Interns(InternId),
    AttendanceDate DATE NOT NULL,
    Status         NVARCHAR(10) NOT NULL CONSTRAINT CK_Attendance_Status CHECK (Status IN ('Present','Absent','Late','Leave')),
    CheckInTime    TIME(0) NULL,
    CheckOutTime   TIME(0) NULL,
    CONSTRAINT UQ_Attendance_InternDate UNIQUE (InternId, AttendanceDate)
);

CREATE TABLE dbo.Evaluations (
    EvaluationId    INT IDENTITY(1,1) CONSTRAINT PK_Evaluations PRIMARY KEY,
    InternId        INT NOT NULL CONSTRAINT FK_Evaluations_Interns REFERENCES dbo.Interns(InternId),
    MentorId        INT NOT NULL CONSTRAINT FK_Evaluations_Mentors REFERENCES dbo.Mentors(MentorId),
    TechnicalSkills TINYINT NOT NULL CONSTRAINT CK_Eval_Tech  CHECK (TechnicalSkills BETWEEN 1 AND 5),
    Communication   TINYINT NOT NULL CONSTRAINT CK_Eval_Comm  CHECK (Communication   BETWEEN 1 AND 5),
    Teamwork        TINYINT NOT NULL CONSTRAINT CK_Eval_Team  CHECK (Teamwork        BETWEEN 1 AND 5),
    ProblemSolving  TINYINT NOT NULL CONSTRAINT CK_Eval_Prob  CHECK (ProblemSolving  BETWEEN 1 AND 5),
    Professionalism TINYINT NOT NULL CONSTRAINT CK_Eval_Prof  CHECK (Professionalism BETWEEN 1 AND 5),
    OverallRating   DECIMAL(3,2) NOT NULL,
    Feedback        NVARCHAR(1000) NOT NULL,
    EvaluationDate  DATE NOT NULL CONSTRAINT DF_Evaluations_Date DEFAULT CAST(SYSDATETIME() AS DATE)
);

CREATE TABLE dbo.Notifications (
    NotificationId INT IDENTITY(1,1) CONSTRAINT PK_Notifications PRIMARY KEY,
    UserId         INT NOT NULL CONSTRAINT FK_Notifications_Users REFERENCES dbo.Users(UserId),
    Title          NVARCHAR(150) NOT NULL,
    Message        NVARCHAR(500) NOT NULL,
    IsRead         BIT NOT NULL CONSTRAINT DF_Notifications_IsRead DEFAULT 0,
    CreatedAt      DATETIME2 NOT NULL CONSTRAINT DF_Notifications_CreatedAt DEFAULT SYSUTCDATETIME()
);
GO

-- Indexes for the most common filters / joins
CREATE INDEX IX_Mentors_Department      ON dbo.Mentors (DepartmentId);
CREATE INDEX IX_Interns_Department      ON dbo.Interns (DepartmentId);
CREATE INDEX IX_Interns_Mentor          ON dbo.Interns (MentorId);
CREATE INDEX IX_Interns_Status          ON dbo.Interns (Status);
CREATE INDEX IX_Tasks_Intern_Status     ON dbo.Tasks (InternId, Status);
CREATE INDEX IX_Tasks_DueDate           ON dbo.Tasks (DueDate);
CREATE INDEX IX_Attendance_Date         ON dbo.Attendance (AttendanceDate);
CREATE INDEX IX_Evaluations_Intern      ON dbo.Evaluations (InternId);
CREATE INDEX IX_Notifications_User_Read ON dbo.Notifications (UserId, IsRead, CreatedAt DESC);
GO

PRINT 'Schema created successfully.';
GO
