// routes\pollRoutes.js

const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');

router.get('/:id', pollController.getPoll);
router.post('/create', pollController.createPoll);
router.put('/update/:id', pollController.updatePoll);
router.delete('/delete/:id', pollController.deletePoll);
router.post('/:pollId/vote', pollController.votePoll);
router.delete('/:pollId/vote', pollController.unvotePoll);
router.post('/votes/all', pollController.getAllVotesForPolls);





module.exports = router;
