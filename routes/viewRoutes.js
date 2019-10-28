const express = require('express')
const router = express.Router();

const viewsController = require('../controllers/viewsController')
const authController = require('../controllers/authController')

//router.use(authController.isLoggedIn);

router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour)
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.protectData, viewsController.getAccount);

router.post('/submit-user-data', authController.protectData, viewsController.updateUserData)

module.exports = router;