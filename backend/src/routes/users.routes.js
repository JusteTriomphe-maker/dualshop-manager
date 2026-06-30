const { Router } = require('express');
const { list, create, update, remove } = require('../controllers/users.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

const router = Router();
router.use(authenticate);
router.get('/', authorize('DG'), list);
router.post('/', authorize('DG'), create);
router.put('/:id', authorize('DG'), update);
router.delete('/:id', authorize('DG'), remove);

module.exports = router;
