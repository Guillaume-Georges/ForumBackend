// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST /users/add
router.post('/add', userController.AddUser);
router.get('/:id', userController.GetUserProfile);
router.put('/:id', userController.UpdateUserProfile);
router.get('/:userId/posts', userController.getUserPosts);
router.delete('/:id',userController.deleteUserAccount);

module.exports = router;
