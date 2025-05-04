const postModel = require('../models/postModel');
const commentModel = require('../models/commentModel');

const deletePostAsAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await postModel.getPostById(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await postModel.deletePostById(id);
    res.json({ message: 'Post deleted by admin' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Admin failed to delete post' });
  }
};

const deleteCommentAsAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await commentModel.getCommentById(id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    await commentModel.deleteCommentVotes(id);
    await commentModel.deleteComment(id);

    res.json({ message: 'Comment deleted by admin' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Admin failed to delete comment' });
  }
};

module.exports = {
  deletePostAsAdmin,
  deleteCommentAsAdmin,
};
