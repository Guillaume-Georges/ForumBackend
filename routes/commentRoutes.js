const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

router.post('/create', commentController.createComment);
router.get('/post/:postId', commentController.getCommentsByPostId);
router.post('/:id/vote', commentController.voteComment);
router.delete('/:id/vote', commentController.unvoteComment);
router.delete('/delete/:id', commentController.deleteComment);
router.put('/:id', commentController.updateComment);




module.exports = router;
