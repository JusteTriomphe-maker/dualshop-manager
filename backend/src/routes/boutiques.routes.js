const { Router } = require('express');
const { list, stats } = require('../controllers/boutiques.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

const router = Router();
router.use(authenticate);
router.get('/', authorize('DG', 'GERANT'), list);
router.get('/:id/stats', authorize('DG', 'GERANT'), stats);

module.exports = router;
