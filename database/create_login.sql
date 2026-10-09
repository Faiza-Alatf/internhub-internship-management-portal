/* Optional: create a SQL login for the Node.js API (run in SSMS as an administrator).
   Change the password before running! The server must allow "SQL Server and Windows Authentication mode". */
USE master;
GO
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'internportal_user')
    CREATE LOGIN internportal_user WITH PASSWORD = 'ChangeMe#2026', CHECK_POLICY = OFF;
GO
USE InternshipManagementDB;
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'internportal_user')
    CREATE USER internportal_user FOR LOGIN internportal_user;
ALTER ROLE db_owner ADD MEMBER internportal_user;
GO
