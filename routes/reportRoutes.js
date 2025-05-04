const express = require('express');
const router  = express.Router();
const { flagPost, flagComment } = require('../controllers/reportController');

router.post('/post',    flagPost);     // /api/report/post
router.post('/comment', flagComment);  // /api/report/comment

module.exports = router;
