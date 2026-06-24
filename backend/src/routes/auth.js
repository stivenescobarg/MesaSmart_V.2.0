// backend/src/routes/auth.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/authController');   // ← sin ../src/
const auth    = require('../middlewares/authMiddleware');   // ← sin ../src/

router.post('/login',  ctrl.login);
router.post('/logout', auth, ctrl.logout);
router.get('/me',      auth, ctrl.me);

module.exports = router;