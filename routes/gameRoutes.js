const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

router.get('/', gameController.getGame);
router.get('/suspicion', gameController.suspicion);
router.post('/submit', gameController.postGame);
router.post('/use-joker', gameController.useJoker);


module.exports = router;
