const { Router } = require('express');
const { list, create, update, remove, alertes } = require('../controllers/produits.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

const router = Router();
router.use(authenticate);
router.get('/', list);
router.get('/alertes', alertes);
router.post('/', authorize('DG', 'GERANT'), create);
router.put('/:id', authorize('DG', 'GERANT'), update);
router.delete('/:id', authorize('DG', 'GERANT'), remove);

module.exports = router;
