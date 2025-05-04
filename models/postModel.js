// models/postModel.js
const db = require('../connection/db');

async function createPost({ user_id, title, description }) {
  const [result] = await db.execute(
    `INSERT INTO posts (user_id, title, description) VALUES (?, ?, ?)`,
    [user_id, title, description]
  );
  return result.insertId;
}

const getAllPosts = async () => {
    const [rows] = await db.execute(
      `SELECT posts.id, posts.title, posts.description, posts.created_at, users.name AS author 
       FROM posts 
       JOIN users ON posts.user_id = users.id 
       ORDER BY posts.created_at DESC`
    );
    return rows;
  };


  async function getAllPostsDetailed({ sortBy = 'date', limit, userId = null } = {}) {
    userId = userId !== null ? Number(userId) : null;
    // 1) Decide SQL ORDER BY
    //    - date  → newest first
    //    - votes → highest score first
    const orderBy =
      sortBy === 'votes'
        ? 'p.score DESC'
        : 'p.created_at DESC';
  
    // 2) Grab all joined rows in that order
    const sql = `
      SELECT
        p.id            AS postId,
        p.user_id,
        p.title,
        p.description,
        p.created_at,
        p.score,
        u.name          AS author,
        u.profile_image,
        ${userId !== null 
          ? "COALESCE(pv.vote_type = 'up', FALSE)   AS user_vote_up, " +
          "COALESCE(pv.vote_type = 'down', FALSE) AS user_vote_down"
          : "FALSE AS user_vote_up, FALSE AS user_vote_down"
              },
        u.position         AS author_position,
        pm.id           AS mediaId,
        pm.type         AS mediaType,
        pm.url          AS mediaUrl,
        pl.id           AS pollId,
        pl.question     AS pollQuestion,
        pl.more_option_enabled AS pollAllowNew,
        po.id           AS optionId,
        po.option_text  AS optionText,
        po.vote_count   AS optionVotes
      FROM posts p
      JOIN users u            ON p.user_id   = u.id
      ${userId !== null 
                ? `LEFT JOIN post_votes pv 
                      ON pv.post_id = p.id 
                     AND pv.user_id = ${db.escape(userId)}` 
                : ''}
      LEFT JOIN post_media pm    ON pm.post_id = p.id
      LEFT JOIN polls pl         ON pl.post_id = p.id
      LEFT JOIN poll_options po  ON po.poll_id = pl.id
      ORDER BY ${orderBy}
    `;
    

    const [rows] = await db.execute(sql);
  
    // 3) Group & de-duplicate into post objects (Map preserves insertion order)
    const postMap = new Map();
    for (const row of rows) {
      if (!postMap.has(row.postId)) {
        postMap.set(row.postId, {
          id:            row.postId,
          user_id:       row.user_id,
          user_vote_up:  !!row.user_vote_up,
          user_vote_down: !!row.user_vote_down,
          title:         row.title,
          description:   row.description,
          created_at:    row.created_at,
          score:         row.score,
          author:        row.author,
          author_position:  row.author_position,
          profile_image: row.profile_image,
          media:         [],
          poll:          null
        });
      }
      const post = postMap.get(row.postId);
  
      if (row.mediaId && !post.media.some(m => m.id === row.mediaId)) {
        post.media.push({
          id:   row.mediaId,
          type: row.mediaType,
          url:  row.mediaUrl
        });
      }
  
      if (row.pollId) {
        if (!post.poll) {
          post.poll = {
            id:              row.pollId,
            question:        row.pollQuestion,
            allowNewOptions: !!row.pollAllowNew,
            options:         []
          };
        }
        if (
          row.optionId &&
          !post.poll.options.some(o => o.id === row.optionId)
        ) {
          post.poll.options.push({
            id:         row.optionId,
            text:       row.optionText,
            vote_count: row.optionVotes
          });
        }
      }
    }
  
    // 4) Pull into an array (in SQL order) …
let posts = Array.from(postMap.values());

// 👉 Explicit final sort by your chosen field
if (sortBy === 'votes') {
  posts.sort((a, b) => (b.score || 0) - (a.score || 0));
} else {
  posts.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// 5) Then apply the limit at the *post* level
const n = Number(limit);
if (Number.isInteger(n) && n > 0) {
  posts = posts.slice(0, n);
}

return posts;
  }
  
  

  const getPostById = async (id) => {
    const [rows] = await db.execute(
      `SELECT posts.id, posts.title, posts.description, posts.created_at, users.name AS author 
       FROM posts 
       JOIN users ON posts.user_id = users.id 
       WHERE posts.id = ?`,
      [id]
    );
    return rows[0]; // Expecting a single result
  };

  const deletePostById = async (id) => {
    const [result] = await db.execute(
      `DELETE FROM posts WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  };

  
  

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  deletePostById,
  getAllPostsDetailed,
};
