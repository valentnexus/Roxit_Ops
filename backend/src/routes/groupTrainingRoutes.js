const router = require('express').Router();
const ctrl = require('../controllers/groupTrainingController');

router.get('/', ctrl.list);
router.post('/', ctrl.submit);
router.put('/:id', ctrl.update);
router.post('/:id/archive', ctrl.archive);
router.post('/:id/restore', ctrl.restore);

module.exports = router;
