const { query, withTransaction } = require('../config/db');
const AppError = require('../utils/AppError');
const h = require('../utils/asyncHandler');
const { Validator, toId, todayString, isBlank } = require('../utils/Validator');
const { internScope, findScopedIntern } = require('../utils/sqlFragments');
const { notifyIntern } = require('../services/notificationService');

const STATUSES = ['Present', 'Absent', 'Late', 'Leave'];
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// GET /api/attendance?internId=&date=&status=&from=&to=
exports.list = h(async (req, res) => {
  const { internId, date, status, from, to } = req.query;
  const scope = internScope(req.user);
  let sql = `
    SELECT TOP 1000 a.AttendanceId, a.InternId, u.FullName AS InternName, CONVERT(VARCHAR(10), a.AttendanceDate, 23) AS AttendanceDate,
      a.Status, CONVERT(VARCHAR(5), a.CheckInTime, 108) AS CheckInTime, CONVERT(VARCHAR(5), a.CheckOutTime, 108) AS CheckOutTime
    FROM Attendance a
    JOIN Interns i ON i.InternId = a.InternId
    JOIN Users u ON u.UserId = i.UserId
    WHERE 1 = 1 ${scope.clause}`;
  const params = { ...scope.params };

  if (internId) { sql += ' AND a.InternId = @internId'; params.internId = toId(internId, 'intern ID'); }
  if (date) { sql += ' AND a.AttendanceDate = @date'; params.date = date; }
  if (from) { sql += ' AND a.AttendanceDate >= @from'; params.from = from; }
  if (to) { sql += ' AND a.AttendanceDate <= @to'; params.to = to; }
  if (status) {
    if (!STATUSES.includes(status)) throw new AppError('Invalid status filter', 400);
    sql += ' AND a.Status = @status'; params.status = status;
  }
  const data = await query(`${sql} ORDER BY a.AttendanceDate DESC, u.FullName`, params);
  res.json({ success: true, data });
});

// GET /api/attendance/monthly?internId=   -> counts per month for the analytics chart
exports.monthly = h(async (req, res) => {
  const { internId } = req.query;
  const scope = internScope(req.user);
  let sql = `
    SELECT CONVERT(VARCHAR(7), a.AttendanceDate, 23) AS Month,
      SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) AS Present,
      SUM(CASE WHEN a.Status = 'Late'    THEN 1 ELSE 0 END) AS Late,
      SUM(CASE WHEN a.Status = 'Absent'  THEN 1 ELSE 0 END) AS Absent,
      SUM(CASE WHEN a.Status = 'Leave'   THEN 1 ELSE 0 END) AS OnLeave
    FROM Attendance a JOIN Interns i ON i.InternId = a.InternId
    WHERE 1 = 1 ${scope.clause}`;
  const params = { ...scope.params };
  if (internId) { sql += ' AND a.InternId = @internId'; params.internId = toId(internId, 'intern ID'); }
  const data = await query(`${sql} GROUP BY CONVERT(VARCHAR(7), a.AttendanceDate, 23) ORDER BY Month`, params);
  res.json({ success: true, data });
});

// POST /api/attendance  (ADMIN or MENTOR)
// Accepts one record { internId, attendanceDate, status, checkInTime, checkOutTime }
// or many: { records: [ ... ] }. Existing records for the same intern + date are updated.
exports.record = h(async (req, res) => {
  const records = Array.isArray(req.body.records) ? req.body.records : [req.body];
  if (!records.length) throw new AppError('No attendance records provided', 400);
  if (records.length > 200) throw new AppError('Too many records in one request', 400);

  const cleaned = [];
  for (const r of records) {
    const v = new Validator().id(r.internId, 'internId', 'Intern').required(r.attendanceDate, 'attendanceDate', 'Date')
      .date(r.attendanceDate, 'attendanceDate', 'Date').required(r.status, 'status', 'Status').oneOf(r.status, STATUSES, 'status', 'Status');
    if (!isBlank(r.checkInTime) && !TIME_REGEX.test(r.checkInTime)) v.fail('checkInTime', 'Check-in time must be HH:MM');
    if (!isBlank(r.checkOutTime) && !TIME_REGEX.test(r.checkOutTime)) v.fail('checkOutTime', 'Check-out time must be HH:MM');
    v.throwIfInvalid();
    if (r.attendanceDate > todayString()) throw new AppError('Attendance cannot be recorded for a future date', 400, { attendanceDate: 'Date cannot be in the future' });
    if (r.checkInTime && r.checkOutTime && r.checkOutTime < r.checkInTime) {
      throw new AppError('Check-out time cannot be before check-in time', 400, { checkOutTime: 'Check-out must be after check-in' });
    }
    const intern = await findScopedIntern(req.user, Number(r.internId));
    if (!intern) throw new AppError(`Intern #${r.internId} not found or not assigned to you`, 404);
    const worked = r.status === 'Present' || r.status === 'Late';
    cleaned.push({
      internId: intern.internId, date: r.attendanceDate, status: r.status,
      checkIn: worked && r.checkInTime ? r.checkInTime : null, checkOut: worked && r.checkOutTime ? r.checkOutTime : null,
    });
  }

  const newlyAbsent = [];
  await withTransaction(async (run) => {
    for (const r of cleaned) {
      const [previous] = await run('SELECT Status FROM Attendance WHERE InternId = @internId AND AttendanceDate = @date', r);
      await run(
        `MERGE Attendance AS target
         USING (SELECT @internId AS InternId, CAST(@date AS DATE) AS AttendanceDate) AS src
           ON target.InternId = src.InternId AND target.AttendanceDate = src.AttendanceDate
         WHEN MATCHED THEN UPDATE SET Status = @status, CheckInTime = CAST(@checkIn AS TIME(0)), CheckOutTime = CAST(@checkOut AS TIME(0))
         WHEN NOT MATCHED THEN INSERT (InternId, AttendanceDate, Status, CheckInTime, CheckOutTime)
           VALUES (@internId, CAST(@date AS DATE), @status, CAST(@checkIn AS TIME(0)), CAST(@checkOut AS TIME(0)));`,
        r);
      if (r.status === 'Absent' && previous?.status !== 'Absent') newlyAbsent.push(r);
    }
  });
  for (const r of newlyAbsent) await notifyIntern(r.internId, 'Attendance marked absent', `Your attendance was marked absent on ${r.date}.`);

  res.status(201).json({ success: true, message: cleaned.length > 1 ? 'Attendance updated' : 'Attendance updated', data: { saved: cleaned.length } });
});
