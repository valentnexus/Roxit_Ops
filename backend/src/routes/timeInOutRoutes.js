const router = require('express').Router();
const ctrl = require('../controllers/timeInOutController');

router.get('/', ctrl.list);
router.get('/summary', ctrl.summary); // GET /api/time-in-out/summary?page=&limit=&user=
router.post('/', ctrl.submit);
router.put('/:id', ctrl.update);
router.post('/:id/archive', ctrl.archive);
router.post('/:id/restore', ctrl.restore);

module.exports = router;
