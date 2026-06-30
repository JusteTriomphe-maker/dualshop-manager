const { Router } = require('express');
const { list, create, getById, annuler, getRecu, sync } = require('../controllers/ventes.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

const router = Router();
router.use(authenticate);
router.get('/', list);
router.post('/', authorize('DG', 'GERANT', 'CAISSIER'), create);
router.post('/sync', authorize('DG', 'GERANT', 'CAISSIER'), sync);
router.get('/:id', getById);
router.put('/:id/annuler', authorize('DG', 'GERANT'), annuler);
router.get('/:id/recu', getRecu);

module.exports = router;
