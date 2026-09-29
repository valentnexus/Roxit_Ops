const router = require('express').Router();
const ctrl = require('../controllers/manualCuttingController');

router.get('/', ctrl.list);                // GET /api/manual-cutting?page=&limit=&search=&status=&user=
router.post('/', ctrl.submit);
router.patch('/:id/status', ctrl.updateStatus); // body: { status: 'Processed'|'Rejected', adminNotes }

module.exports = router;
