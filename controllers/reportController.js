const { createReport } = require('../models/reportModel');

exports.flagPost = async (req, res, next) => {
  try {
    const { post_id, reason, user_id } = req.body;
    if (!post_id || !user_id) return res.status(400).json({ error: 'Missing fields' });
    await createReport({ postId: post_id, commentId: null, userId: user_id, reason });
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.flagComment = async (req, res, next) => {
  try {
    const { comment_id, reason, user_id } = req.body;
    if (!comment_id || !user_id) return res.status(400).json({ error: 'Missing fields' });
    await createReport({ postId: null, commentId: comment_id, userId: user_id, reason });
    res.json({ success: true });
  } catch (err) { next(err); }
};
