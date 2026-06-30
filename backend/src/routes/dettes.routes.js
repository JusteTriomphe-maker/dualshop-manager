const { Router } = require('express');
const {
  listDettesClients, listDettesFournisseurs,
  createDetteClient, createDetteFournisseur,
  payerDetteClient, payerDetteFournisseur,
  rapportDettes,
} = require('../controllers/dettes.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

const router = Router();
router.use(authenticate);

router.get('/clients', authorize('DG', 'GERANT'), listDettesClients);
router.get('/fournisseurs', authorize('DG', 'GERANT'), listDettesFournisseurs);
router.get('/rapport', authorize('DG', 'GERANT'), rapportDettes);
router.post('/clients', authorize('DG', 'GERANT'), createDetteClient);
router.post('/fournisseurs', authorize('DG', 'GERANT'), createDetteFournisseur);
router.post('/paiement-client', authorize('DG', 'GERANT', 'CAISSIER'), payerDetteClient);
router.post('/paiement-fournisseur', authorize('DG', 'GERANT'), payerDetteFournisseur);

module.exports = router;
