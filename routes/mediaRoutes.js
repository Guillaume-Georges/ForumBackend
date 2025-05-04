// routes/mediaRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

const mediaController = require('../controllers/mediaController');

// POST /media/upload/:postId
router.post('/upload', upload.single('file'), mediaController.uploadMediaToPost);
router.delete('/delete/:mediaId', mediaController.deleteMedia);




module.exports = router;
