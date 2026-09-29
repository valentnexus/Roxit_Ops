const router = require('express').Router();
const ctrl = require('../controllers/userController');

router.get('/', ctrl.list);              // GET /api/users?status=active|archived
router.get('/profile', ctrl.profile);    // GET /api/users/profile?email=...
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.post('/:id/archive', ctrl.archive);
router.post('/:id/restore', ctrl.restore);
router.get('/:name/activities', ctrl.activities);

module.exports = router;
