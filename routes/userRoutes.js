// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer  = require('multer');
const upload  = multer({ limits:{ fileSize:5*1024*1024 } });  

// POST /users/add
router.post('/add', userController.AddUser);
router.get('/:id', userController.GetUserProfile);
router.put('/:id', userController.UpdateUserProfile);
router.get('/:userId/posts', userController.getUserPosts);
router.delete('/:id',userController.deleteUserAccount);
router.put(
    '/:id/profile-image',
    upload.single('image'),          // ⬅ field name must be "image"
    userController.updateProfileImage
  );




module.exports = router;
