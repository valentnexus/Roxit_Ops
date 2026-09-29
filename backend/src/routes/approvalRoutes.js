const router = require('express').Router();
const ctrl = require('../controllers/approvalController');

router.get('/', ctrl.list);                    // GET /api/approvals
router.get('/recent', ctrl.recent);             // GET /api/approvals/recent?limit=20
router.get('/history/:logId', ctrl.history);    // GET /api/approvals/history/:logId
router.post('/process', ctrl.process);          // POST /api/approvals/process  body: { type, logId, status, notes }

module.exports = router;
