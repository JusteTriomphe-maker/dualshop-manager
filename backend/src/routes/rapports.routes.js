const { Router } = require('express');
const { caJournalier, caPeriode, topProduits, inventaire } = require('../controllers/rapports.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

const router = Router();
router.use(authenticate);
router.get('/ca-journalier', authorize('DG', 'GERANT'), caJournalier);
router.get('/ca-periode', authorize('DG', 'GERANT'), caPeriode);
router.get('/top-produits', authorize('DG', 'GERANT'), topProduits);
router.get('/inventaire', authorize('DG', 'GERANT'), inventaire);

module.exports = router;
