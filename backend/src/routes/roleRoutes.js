const router = require('express').Router();
const ctrl = require('../controllers/roleController');

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

router.get('/:roleName/permissions', ctrl.getPermissions);
router.put('/:roleName/permissions', ctrl.savePermissions);

module.exports = router;
