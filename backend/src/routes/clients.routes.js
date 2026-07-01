const { Router } = require('express');
const { list, getById, create, update } = require('../controllers/clients.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

const router = Router();
router.use(authenticate);
router.get('/', authorize('DG', 'GERANT', 'CAISSIER'), list);
router.get('/:id', authorize('DG', 'GERANT', 'CAISSIER'), getById);
router.post('/', authorize('DG', 'GERANT'), create);
router.put('/:id', authorize('DG', 'GERANT'), update);

module.exports = router;
