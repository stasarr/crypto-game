const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Yönetici yetkisi kontrolü burada eklenecekse middleware ile yapılmalı

router.get('/create-level', adminController.getCreateLevel);
router.post('/create-level', adminController.postCreateLevel);
router.get('/levels', adminController.getLevelList);
router.get('/users', adminController.getUserList);

module.exports = router;
