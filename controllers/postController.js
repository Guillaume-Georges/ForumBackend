// controllers/postController.js
const postModel = require('../models/postModel');
const PostVote = require('../models/postVoteModel');

async function createPost(req, res) {
  try {
    const { user_id, title, description } = req.body;

    if (!user_id || !title) {
      return res.status(400).json({ error: 'user_id and title are required' });
    }

    const postId = await postModel.createPost({ user_id, title, description });
    res.status(201).json({ message: 'Post created', postId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}


async function getAllPosts(req, res) {
  try {
    // sortBy = 'date' or 'votes'; limit = optional integer
    const { sortBy, limit, user_id } = req.query;
    const posts = await postModel.getAllPostsDetailed({ sortBy, limit, userId: user_id });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

  const deletePost = async (req, res) => {
    try {
      const { id } = req.params;
  
      const success = await postModel.deletePostById(id);
      if (!success) {
        return res.status(404).json({ error: 'Post not found' });
      }
  
      res.json({ message: 'Post deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  };

 /**
 * POST /posts/:postId/vote
 * Body { user_id: Number, value: 1 | 0 | -1 }
 */
async function vote(req, res, next) {
  try {
    const userId = Number(req.body.user_id);      // or pull from JWT
    const postId = Number(req.params.postId);
    const value  = Number(req.body.value);        // must be  1, 0, or -1

    // sanity checks
    if (!userId || !postId || ![1, 0, -1].includes(value)) {
      return res.status(400).json({ error: 'value must be 1, 0, or -1' });
    }

    const result = await PostVote.upsertVote(userId, postId, value);
    // => { newScore, userVote, delta }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// New: GET /posts/:postId/vote?user_id=123
async function getUserVote(req, res, next) {
  try {
    const postId = Number(req.params.postId);
    const userId = Number(req.query.user_id);
    if (!postId || !userId) {
      return res.status(400).json({ error: 'postId and user_id required' });
    }

    const row = await PostVote.findVote(userId, postId);
    if (!row) {
      // no vote
      return res.json({ post_id: postId, user_id: userId, vote_type: null });
    }
    return res.json(row);
  } catch (err) {
    next(err);
  }
}

  
  

module.exports = {
  createPost,
  getAllPosts,
  deletePost,
  vote,
  getUserVote,
};
