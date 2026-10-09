const router = require('express').Router();
const c = require('../controllers/dashboardController');

router.get('/stats', c.stats);
router.get('/charts', c.charts);

module.exports = router;
