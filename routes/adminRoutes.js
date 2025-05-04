const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin deletes
router.delete('/posts/:id', adminController.deletePostAsAdmin);
router.delete('/comments/:id', adminController.deleteCommentAsAdmin);

module.exports = router;
