const db = require('../connection/db');

const createComment = async ({ post_id, user_id, content }) => {
  const [insertResult] = await db.execute(
    `INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)`,

    [post_id, user_id, content]
  );

  const commentId = insertResult.insertId;

  const [rows] = await db.execute(
    `SELECT 
       c.id, 
       c.content, 
       c.created_at, 
       c.vote_count,
       u.name AS user_name,
       u.profile_image
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.id = ?`,
    [commentId]
  );

  return {
    ...rows[0],
    voters: [] // important for frontend logic
  };
};



const getCommentsByPostId = async (postId) => {
    const [rows] = await db.execute(
      `SELECT 
        c.id, 
        c.content, 
        c.vote_count, 
        c.created_at, 
        u.id AS user_id, 
        u.name AS user_name,
        u.profile_image
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [postId]
    );
    return rows;
  };

  const getCommentVotesByPostId = async (postId) => {
    const [rows] = await db.execute(
      `SELECT 
        c.id AS comment_id,
        u.id AS user_id,
        u.name AS user_name
       FROM comment_votes cv
       JOIN comments c ON cv.comment_id = c.id
       JOIN users u ON cv.user_id = u.id
       WHERE c.post_id = ?`,
      [postId]
    );
    return rows;
  };


  const hasUserVotedOnComment = async (userId, commentId) => {
    const [rows] = await db.execute(
      `SELECT id FROM comment_votes WHERE user_id = ? AND comment_id = ?`,
      [userId, commentId]
    );
    return rows.length > 0;
  };

  const addVoteToComment = async (userId, commentId) => {
    await db.execute(
      `INSERT INTO comment_votes (user_id, comment_id) VALUES (?, ?)`,
      [userId, commentId]
    );
    await db.execute(
      `UPDATE comments SET vote_count = vote_count + 1 WHERE id = ?`,
      [commentId]
    );
  };

  const removeVoteFromComment = async (userId, commentId) => {
    await db.execute(
      `DELETE FROM comment_votes WHERE user_id = ? AND comment_id = ?`,
      [userId, commentId]
    );
    await db.execute(
      `UPDATE comments SET vote_count = vote_count - 1 WHERE id = ?`,
      [commentId]
    );
  };

  const getCommentById = async (commentId) => {
    const [rows] = await db.execute(
      `SELECT * FROM comments WHERE id = ?`,
      [commentId]
    );
    return rows[0];
  };
  
  const deleteCommentVotes = async (commentId) => {
    await db.execute(
      `DELETE FROM comment_votes WHERE comment_id = ?`,
      [commentId]
    );
  };
  
  const deleteComment = async (commentId) => {
    await db.execute(
      `DELETE FROM comments WHERE id = ?`,
      [commentId]
    );
  };

  const updateCommentContent = async (commentId, newContent) => {
    await db.execute(
      `UPDATE comments SET content = ? WHERE id = ?`,
      [newContent, commentId]
    );
  };
  
  
  
  
  

module.exports = {
  createComment,
  getCommentsByPostId,
  getCommentVotesByPostId,
  hasUserVotedOnComment,
addVoteToComment,
removeVoteFromComment,
getCommentById,
deleteCommentVotes,
deleteComment,
updateCommentContent,
};
