const commentModel = require('../models/commentModel');

const createComment = async (req, res) => {
  try {
    const { post_id, user_id, content } = req.body;

    if (!post_id || !user_id || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newComment = await commentModel.createComment({ post_id, user_id, content });

    res.status(201).json(newComment); // Send full comment with profile image
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};


const getCommentsByPostId = async (req, res) => {
    try {
      const { postId } = req.params;
  
      const comments = await commentModel.getCommentsByPostId(postId);
      const votes = await commentModel.getCommentVotesByPostId(postId);
  
      const enrichedComments = comments.map(comment => {
        const voters = votes
          .filter(v => v.comment_id === comment.id)
          .map(v => ({
            user_id: v.user_id,
            name: v.user_name
          }));
  
        return {
          ...comment,
          voters
        };
      });
  
      res.json(enrichedComments);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to retrieve comments' });
    }
  };

  const voteComment = async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id } = req.body;
  
      if (!user_id) {
        return res.status(400).json({ error: 'User ID is required' });
      }
  
      const alreadyVoted = await commentModel.hasUserVotedOnComment(user_id, id);
      if (alreadyVoted) {
        return res.status(400).json({ error: 'You already voted on this comment' });
      }
  
      await commentModel.addVoteToComment(user_id, id);
      res.json({ message: 'Vote added successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to vote on comment' });
    }
  };

  
  const unvoteComment = async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id } = req.body;
  
      if (!user_id) {
        return res.status(400).json({ error: 'User ID is required' });
      }
  
      const alreadyVoted = await commentModel.hasUserVotedOnComment(user_id, id);
      if (!alreadyVoted) {
        return res.status(400).json({ error: 'You have not voted on this comment' });
      }
  
      await commentModel.removeVoteFromComment(user_id, id);
      res.json({ message: 'Vote removed successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to remove vote' });
    }
  };

  const deleteComment = async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id, is_admin = false } = req.body;
  
      const comment = await commentModel.getCommentById(id);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
  
      // Check if user is owner or admin (basic logic for now)
      if (comment.user_id !== user_id && !is_admin) {
        return res.status(403).json({ error: 'Not authorized to delete this comment' });
      }
  
      await commentModel.deleteCommentVotes(id);
      await commentModel.deleteComment(id);
  
      res.json({ message: 'Comment deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  };

  const updateComment = async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id, content } = req.body;
  
      if (!content) {
        return res.status(400).json({ error: 'Comment content is required' });
      }
  
      const comment = await commentModel.getCommentById(id);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
  
      // Ensure only owner can edit
      if (comment.user_id !== user_id) {
        return res.status(403).json({ error: 'Not authorized to edit this comment' });
      }
  
      await commentModel.updateCommentContent(id, content);
  
      res.json({ message: 'Comment updated successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update comment' });
    }
  };
  
  
  
  
  

module.exports = {
  createComment,
  getCommentsByPostId,
  voteComment,
unvoteComment,
deleteComment,
updateComment,
};
