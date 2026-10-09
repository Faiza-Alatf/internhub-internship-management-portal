# InternHub - Internship Management Portal

A full-stack web application for managing interns through their whole internship: onboarding, mentor assignment, tasks, attendance, evaluations, notifications and live analytics. Built as a clean monolith:

```
React (Vite) -> Axios -> Express REST API -> SQL Server
```

## 1. Features

| Role | What they can do |
|------|------------------|
| **Admin / HR** | Manage interns, mentors, departments; assign mentors; assign tasks; record attendance; evaluate interns; view analytics |
| **Mentor** | See assigned interns only; assign tasks; review tasks and leave task feedback; record attendance; evaluate interns |
| **Intern** | Personal dashboard; own tasks (Kanban, drag to update status); own attendance; mentor info; evaluations; notifications |

Also included: JWT login with auto-logout on expiry, role-based route protection (frontend **and** backend), search + filters done in SQL, validation on both sides, toasts, skeleton loaders, empty/error states, dark mode, responsive layout (mobile drawer), notification bell stored in SQL Server.

## 2. Tech stack

- **Frontend:** React 18, Vite, React Router, Axios, Tailwind CSS, Lucide icons, Recharts
- **Backend:** Node.js, Express, JWT (`jsonwebtoken`), `bcryptjs`, `dotenv`, `cors`, `helmet`
- **Database:** Microsoft SQL Server (driver: `mssql`)

## 3. Folder structure

```
internship-management-portal/
├── client/                  React app
│   └── src/
│       ├── components/      reusable UI (ui/, charts/, Sidebar, Topbar, NotificationBell)
│       ├── context/         Auth, Theme, Toast, Notifications state
│       ├── hooks/           useFetch, useForm, useDebounce, useClickOutside
│       ├── layouts/         AppLayout (sidebar + navbar)
│       ├── pages/           one file per screen
│       ├── services/        api.js (Axios + error handling), resources.js (all endpoints)
│       └── utils/           formatting, validators, token storage
├── server/
│   ├── config/              env.js, db.js (connection pool + query helpers)
│   ├── controllers/         business logic + SQL for each resource
│   ├── middleware/          auth.js (JWT + roles), errorHandler.js
│   ├── routes/              URL -> controller mapping
│   ├── services/            notificationService.js
│   ├── utils/               AppError, Validator, sqlFragments (role scoping)
│   ├── app.js / server.js
├── database/                schema.sql, seed.sql, queries.sql, create_login.sql
└── README.md
```

## 4. Database setup (SQL Server Management Studio 22)

1. Open **SSMS 22** and connect to your SQL Server (e.g. `localhost` or `localhost\SQLEXPRESS`).
2. **File > Open > File...** and open `database/schema.sql`, click **Execute** (F5). This creates `InternshipManagementDB` and all tables, keys and indexes. *(It drops and recreates tables, so running it again resets the data.)*
3. Open `database/seed.sql`, make sure the database dropdown says `InternshipManagementDB`, and **Execute**. This inserts departments, mentors, interns, tasks, attendance, evaluations and notifications. Passwords are bcrypt hashes.
4. Verify: `SELECT FullName, Email, Role FROM dbo.Users;`

### Allow the Node.js API to log in (SQL Server Authentication)

The `mssql` driver uses a SQL login (username + password), not Windows login.

1. In SSMS: right-click the server > **Properties > Security** > choose **SQL Server and Windows Authentication mode** > OK, then restart the SQL Server service.
2. Open `database/create_login.sql`, change the password, and Execute. It creates `internportal_user` with access to the database. (You can use `sa` instead if it is enabled.)
3. **TCP/IP must be enabled:** open *SQL Server Configuration Manager > SQL Server Network Configuration > Protocols for ...* > enable **TCP/IP**, restart the service. For the default instance the port is `1433`.

## 5. Environment variables

```bash
cd server
cp .env.example .env        # Windows: copy .env.example .env
```

Edit `server/.env`:

```text
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=put_a_long_random_string_here
DB_SERVER=localhost
DB_INSTANCE=                 # set to SQLEXPRESS only if you use a named instance
DB_DATABASE=InternshipManagementDB
DB_USER=internportal_user
DB_PASSWORD=ChangeMe#2026
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_SERVER_CERT=true
```

`.env` is git-ignored. Never commit it.

## 6. Installation and running

Requires **Node.js 18+**.

```bash
# Terminal 1 - backend
cd server
npm install
npm run dev          # API on http://localhost:5000

# Terminal 2 - frontend
cd client
npm install
npm run dev          # App on http://localhost:5173
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the Express server, so no CORS setup is needed in development. The API URL is centralised in `client/src/services/api.js`.

When the backend starts correctly you will see: `[db] Connected to SQL Server database "InternshipManagementDB"`.

## 7. Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@internportal.com | Admin@123 |
| Mentor | mentor@internportal.com | Mentor@123 |
| Intern | intern@internportal.com | Intern@123 |

Other seeded mentors use `Mentor@123` and other interns use `Intern@123` (e.g. `hamza.raza@internportal.com`). The login page has one-click demo buttons.

## 8. API documentation

All routes are prefixed with `/api`. Responses look like `{ "success": true, "message": "...", "data": ... }` or `{ "success": false, "message": "...", "errors": { "field": "..." } }`. Send `Authorization: Bearer <token>` on everything except login.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/login` | Public | Login, returns JWT + user |
| POST | `/auth/register` | Admin | Create another admin account |
| GET | `/auth/me` | Any | Current user |
| PUT | `/auth/profile` | Any | Update own name |
| PUT | `/auth/password` | Any | Change own password |
| GET | `/interns` | Admin, Mentor (own) | List; query: `search, departmentId, status, mentorId` |
| GET | `/interns/:id` | Any (intern: own only) | Intern details + performance, attendance %, task counts |
| POST | `/interns` | Admin | Create account + profile |
| PUT | `/interns/:id` | Admin | Update |
| DELETE | `/interns/:id` | Admin | Soft delete (account deactivated, status Terminated) |
| GET | `/mentors` | Admin | List; query: `search, departmentId` |
| GET | `/mentors/:id` | Admin / self / own intern | Mentor + assigned interns |
| POST / PUT / DELETE | `/mentors[/:id]` | Admin | Create / update / deactivate |
| GET | `/departments` | Any | List with intern/mentor counts |
| POST / PUT / DELETE | `/departments[/:id]` | Admin | Manage departments |
| GET | `/tasks` | Any (scoped) | Query: `search, priority, status, internId, dueFrom, dueTo` |
| GET | `/tasks/:id` | Any (scoped) | One task |
| POST | `/tasks` | Admin, Mentor | Assign task |
| PUT | `/tasks/:id` | Any (intern: status only) | Update task |
| DELETE | `/tasks/:id` | Admin, Mentor | Delete task |
| GET | `/attendance` | Any (scoped) | Query: `internId, date, status, from, to` |
| GET | `/attendance/monthly` | Any (scoped) | Monthly counts for analytics |
| POST | `/attendance` | Admin, Mentor | Record one record or `{ records: [...] }` (upsert) |
| GET | `/evaluations` | Any (scoped) | Query: `internId` |
| POST | `/evaluations` | Admin, Mentor | Submit evaluation (overall rating auto-calculated) |
| GET | `/notifications` | Any | Own latest 50 + unread count |
| PUT | `/notifications/:id/read` | Any | Mark one read |
| PUT | `/notifications/read-all` | Any | Mark all read |
| GET | `/dashboard/stats` | Any (scoped) | Stat cards |
| GET | `/dashboard/charts` | Any (scoped) | Data for the 4 charts |
| GET | `/health` | Public | API status |

## 9. Architecture in short

1. **React page** calls a function from `services/resources.js`.
2. **Axios** (`services/api.js`) adds the JWT and turns errors into friendly messages. A 401 triggers automatic logout.
3. **Express route** -> `authenticateToken` (verifies JWT and loads the user from SQL Server) -> `requireRole(...)` -> **controller**.
4. **Controller** validates input (`utils/Validator.js`), runs **parameterised SQL** via `config/db.js`, creates notifications, returns JSON.
5. **Role scoping** lives in one helper, `internScope()` in `utils/sqlFragments.js`: admins see everyone, mentors only their interns, interns only themselves. The same helper protects tasks, attendance, evaluations and dashboard numbers.
6. **Errors** from anywhere end in `middleware/errorHandler.js`, which sends `{ success:false, message }` with the right status (400/401/403/404/409/500).

Design choices worth mentioning in your demo:
- *Overdue* is calculated in SQL (not stored), so it is always correct.
- Deleting an intern/mentor is a **soft delete** to keep history.
- Creating an intern uses a **transaction** (user + intern + notifications succeed or fail together).
- Attendance is saved with SQL `MERGE` (one record per intern per day).

## 10. Five-to-ten minute demo script

1. **Login as Admin** (click the *Admin* demo button). Point out the role-based sidebar.
2. **Dashboard:** 8 stat cards and 4 charts, all from SQL Server. Note the numbers (e.g. Total Interns 8, Pending Tasks).
3. **Interns > Add intern:** show validation (submit empty, then a weak password), then create "Ayesha Noor" in Software Development with mentor John Smith. Toast appears; search for her.
4. **Tasks > Assign task:** assign "Prepare Weekly Progress Report" to Ayesha (or to Faiza Altaf), priority High, due date this week.
5. **Logout, login as Intern** (`intern@internportal.com`). Show the notification bell ("New task assigned"), My Tasks board, drag a task to *In Progress*, then *Completed*.
6. Show **My Profile** (progress, attendance bar, radar chart, mentor feedback) and **Attendance** (rate + monthly chart).
7. **Logout, login as Mentor** (`mentor@internportal.com`). Note the bell: "Task ready for review". Open **Tasks**, edit the completed task and add feedback.
8. **Evaluations > New evaluation** for Faiza: click stars, watch overall rating update live, add feedback, submit.
9. **Attendance:** mark a day, set someone Absent, save.
10. **Back to Admin dashboard:** refresh to show updated statistics. Optional: open SSMS and run `database/queries.sql` to show the same data in tables. Toggle dark mode at the end.

## 11. Important files to understand

| File | Why it matters |
|------|----------------|
| `server/config/db.js` | Connection pool, `query()` and `withTransaction()` helpers used everywhere |
| `server/middleware/auth.js` | JWT verification and `requireRole` |
| `server/utils/sqlFragments.js` | Role scoping and the "Overdue" rule |
| `server/controllers/internController.js` | Best example of validation + SQL + transaction + notification |
| `server/controllers/dashboardController.js` | Aggregation queries behind the charts |
| `client/src/services/api.js` | Axios setup, token header, error normalisation, auto-logout |
| `client/src/context/AuthContext.jsx` | Login state and session expiry handling |
| `client/src/App.jsx` | Route table with role protection |
| `client/src/pages/TasksPage.jsx` | Kanban board with drag and drop |
| `database/schema.sql` | Tables, constraints, foreign keys, indexes |

## 12. Common errors and fixes

| Error | Fix |
|-------|-----|
| `Login failed for user '...'` (ELOGIN) | Wrong `DB_USER`/`DB_PASSWORD`, or SQL Authentication is not enabled. See section 4. |
| `Failed to connect to localhost:1433 - Could not connect (sequence)` / `ESOCKET` | Enable **TCP/IP** in SQL Server Configuration Manager and restart the SQL Server service. |
| Using SQL Express: `Failed to connect to localhost\SQLEXPRESS` | Set `DB_SERVER=localhost` and `DB_INSTANCE=SQLEXPRESS`; start the **SQL Server Browser** service (or set a fixed TCP port and use `DB_PORT`). |
| `Cannot open database "InternshipManagementDB"` | Run `schema.sql` first; make sure the login has a user in that database (`create_login.sql`). |
| `self-signed certificate` / SSL error | Keep `DB_TRUST_SERVER_CERT=true` and `DB_ENCRYPT=false`. |
| `JWT_SECRET is missing` on start | Create `server/.env` from `.env.example`. |
| Login says "Cannot reach the server" | Backend is not running or `PORT` differs from the proxy in `client/vite.config.js` (default 5000). |
| CORS error in browser | Set `CLIENT_URL` in `server/.env` to your frontend URL and restart the server. |
| Seed script prints "Seed skipped" | Data already exists; run `schema.sql` (reset) and then `seed.sql`. |
| Port 5000 or 5173 already in use | Change `PORT` in `.env` (and the proxy target in `vite.config.js`), or stop the other program. |
| Seeded attendance/tasks look old | Dates are relative to the day you run `seed.sql`; re-run `schema.sql` + `seed.sql` before the demo. |

## 13. Screenshots

Add screenshots here after your first run:

```text
docs/screenshots/login.png
docs/screenshots/dashboard.png
docs/screenshots/interns.png
docs/screenshots/tasks-board.png
docs/screenshots/evaluation.png
```

## 14. Future improvements

- Pagination for large tables and CSV/PDF export
- Email notifications and password reset
- Profile photo upload
- Refresh tokens and login rate limiting
- Automated tests (Jest + Supertest, React Testing Library)
- Docker setup for deployment

## 15. What to say to your supervisor

> "I developed this Internship Management Portal using React, Node.js, Express and SQL Server. It provides role-based access for administrators, mentors and interns, with task management, attendance tracking, evaluations, notifications and real-time dashboard analytics. The frontend communicates with REST APIs, while SQL Server provides persistent relational data storage."
