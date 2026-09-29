const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');

router.get('/stats', ctrl.stats);      // GET /api/dashboard/stats
router.get('/widgets', ctrl.widgets);  // GET /api/dashboard/widgets

module.exports = router;
