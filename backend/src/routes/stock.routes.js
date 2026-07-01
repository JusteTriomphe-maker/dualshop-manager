const { Router } = require('express');
const { mouvements, entree, ajustement } = require('../controllers/stock.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

const router = Router();
router.use(authenticate);
router.get('/mouvements', authorize('DG', 'GERANT'), mouvements);
router.post('/entree', authorize('DG', 'GERANT'), entree);
router.post('/ajustement', authorize('DG', 'GERANT'), ajustement);

module.exports = router;
