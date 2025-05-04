// routes/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

router.post('/create', postController.createPost);
router.get('/get', postController.getAllPosts); // e.g. posts/get?sortBy=date&limit=5
router.delete('/delete/:id', postController.deletePost);
router.post('/:postId/vote', postController.vote);
router.get('/:postId/vote', postController.getUserVote);



module.exports = router;
