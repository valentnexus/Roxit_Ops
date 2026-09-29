const router = require('express').Router();
const ctrl = require('../controllers/clubController');

// authenticate sudah dipasang di routes/index.js untuk semua route di bawahnya
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
