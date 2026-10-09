const router = require('express').Router();
const c = require('../controllers/taskController');
const { requireRole } = require('../middleware/auth');

router.get('/', c.list);
router.get('/:id', c.getById);
router.post('/', requireRole('ADMIN', 'MENTOR'), c.create);
router.put('/:id', c.update); // interns may update the status of their own tasks
router.delete('/:id', requireRole('ADMIN', 'MENTOR'), c.remove);

module.exports = router;
