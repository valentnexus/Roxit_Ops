const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');

// ---------- PUBLIC (tanpa token) ----------
router.use('/auth', require('./authRoutes'));
router.get('/config', require('../controllers/configController').getConfig);

// ---------- PROTECTED (wajib token) ----------
router.use(authenticate);
router.use('/clubs', require('./clubRoutes'));
router.use('/roles', require('./roleRoutes'));
router.use('/session-types', require('./sessionTypeRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/manual-cutting', require('./manualCuttingRoutes'));
router.use('/time-in-out', require('./timeInOutRoutes'));
router.use('/personal-training', require('./personalTrainingRoutes'));
router.use('/group-training', require('./groupTrainingRoutes'));
router.use('/manual-group', require('./manualGroupRoutes'));
router.use('/approvals', require('./approvalRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.get('/audit-trail', require('../controllers/configController').auditTrail);

module.exports = router;
