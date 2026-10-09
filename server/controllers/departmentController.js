const { query } = require('../config/db');
const AppError = require('../utils/AppError');
const h = require('../utils/asyncHandler');
const { Validator, toId } = require('../utils/Validator');

const LIST_SQL = `
  SELECT d.DepartmentId, d.DepartmentName, d.Description,
    (SELECT COUNT(*) FROM Interns i WHERE i.DepartmentId = d.DepartmentId) AS InternCount,
    (SELECT COUNT(*) FROM Mentors m JOIN Users u ON u.UserId = m.UserId
       WHERE m.DepartmentId = d.DepartmentId AND u.IsActive = 1) AS MentorCount
  FROM Departments d`;

exports.list = h(async (req, res) => {
  const data = await query(`${LIST_SQL} ORDER BY d.DepartmentName`);
  res.json({ success: true, data });
});

exports.create = h(async (req, res) => {
  const { departmentName, description } = req.body;
  new Validator().required(departmentName, 'departmentName', 'Department name').maxLength(departmentName, 'departmentName', 'Department name', 100)
    .maxLength(description, 'description', 'Description', 500).throwIfInvalid();

  const dup = await query('SELECT 1 AS x FROM Departments WHERE DepartmentName = @name', { name: departmentName.trim() });
  if (dup.length) throw new AppError('A department with this name already exists', 409, { departmentName: 'Department already exists' });

  const [created] = await query(
    'INSERT INTO Departments (DepartmentName, Description) OUTPUT INSERTED.DepartmentId VALUES (@name, @description)',
    { name: departmentName.trim(), description: description?.trim() || null }
  );
  const [data] = await query(`${LIST_SQL} WHERE d.DepartmentId = @id`, { id: created.departmentId });
  res.status(201).json({ success: true, message: 'Department created successfully', data });
});

exports.update = h(async (req, res) => {
  const id = toId(req.params.id, 'department ID');
  const { departmentName, description } = req.body;
  new Validator().required(departmentName, 'departmentName', 'Department name').maxLength(departmentName, 'departmentName', 'Department name', 100)
    .maxLength(description, 'description', 'Description', 500).throwIfInvalid();

  const [existing] = await query('SELECT DepartmentId FROM Departments WHERE DepartmentId = @id', { id });
  if (!existing) throw new AppError('Department not found', 404);
  const dup = await query('SELECT 1 AS x FROM Departments WHERE DepartmentName = @name AND DepartmentId <> @id', { name: departmentName.trim(), id });
  if (dup.length) throw new AppError('A department with this name already exists', 409, { departmentName: 'Department already exists' });

  await query('UPDATE Departments SET DepartmentName = @name, Description = @description WHERE DepartmentId = @id',
    { name: departmentName.trim(), description: description?.trim() || null, id });
  const [data] = await query(`${LIST_SQL} WHERE d.DepartmentId = @id`, { id });
  res.json({ success: true, message: 'Department updated successfully', data });
});

exports.remove = h(async (req, res) => {
  const id = toId(req.params.id, 'department ID');
  const [existing] = await query(`${LIST_SQL} WHERE d.DepartmentId = @id`, { id });
  if (!existing) throw new AppError('Department not found', 404);
  const [usage] = await query('SELECT (SELECT COUNT(*) FROM Mentors WHERE DepartmentId=@id) + (SELECT COUNT(*) FROM Interns WHERE DepartmentId=@id) AS total', { id });
  if (usage.total > 0) throw new AppError('This department still has mentors or interns. Move them before deleting it.', 409);
  await query('DELETE FROM Departments WHERE DepartmentId = @id', { id });
  res.json({ success: true, message: 'Department deleted successfully' });
});
