// models/postVoteModel.js
const db = require('../connection/db');

/**
 * Fetch a single user’s vote for one post.
 * @param {number} userId
 * @param {number} postId
 * @returns {{ user_id:number, post_id:number, vote_type:string }|null}
 */
async function findVote(userId, postId) {
  const sql = `
    SELECT user_id, post_id, vote_type
      FROM post_votes
     WHERE user_id = ? AND post_id = ?
  `;
  const [rows] = await db.execute(sql, [userId, postId]);
  // if no row, return null
  return rows.length ? rows[0] : null;
}

/**
 * Upsert a vote and adjust posts.score in one transaction
 * @param {number} userId
 * @param {number} postId
 * @param {number} value   1 = up, -1 = down, 0 = un‑vote
 * @returns {{ delta:number, newScore:number, userVote:number }}
 */
async function upsertVote(userId, postId, value) {
  // guard‑rails
  if (![1, 0, -1].includes(value)) {
    throw new Error('value must be 1, 0, or -1');
  }

  const conn = await db.getConnection();     // mysql2/promise pool

  try {
    await conn.beginTransaction();

    // -- what is the current vote (if any)?
    const [[prev]] = await conn.execute(
      'SELECT vote_type FROM post_votes WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );
    const current = prev ? (prev.vote_type === 'up' ? 1 : -1) : 0;

    // ------------------------------------------------------------------
    if (value === current) {
      // no change → short‑circuit
      await conn.commit();
      const newScore = await getScore(conn, postId);
      return { delta: 0, newScore, userVote: current };
    }

    let delta;                                // how much to add to posts.score

    if (value === 0) {
      // UN‑VOTE (remove the row)
      await conn.execute(
        'DELETE FROM post_votes WHERE user_id = ? AND post_id = ?',
        [userId, postId]
      );
      delta = -current;                       // undo previous vote
    } else if (current === 0) {
      // brand‑new vote
      await conn.execute(
        'INSERT INTO post_votes (user_id, post_id, vote_type) VALUES (?,?,?)',
        [userId, postId, value === 1 ? 'up' : 'down']
      );
      delta = value;
    } else {
      // SWITCH sides
      await conn.execute(
        'UPDATE post_votes SET vote_type = ? WHERE user_id = ? AND post_id = ?',
        [value === 1 ? 'up' : 'down', userId, postId]
      );
      delta = value * 2;                      // -1→+1 = +2, +1→-1 = -2
    }

    // bump materialised counter
    await conn.execute(
      'UPDATE posts SET score = score + ? WHERE id = ?',
      [delta, postId]
    );

    await conn.commit();
    const newScore = await getScore(conn, postId);
    return { delta, newScore, userVote: value };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();                           // always free the connection
  }
}

/* helper -------------------------------------------------------------- */
async function getScore(conn, postId) {
  const [[{ score }]] = await conn.execute(
    'SELECT score FROM posts WHERE id = ?', [postId]
  );
  return score;
}

module.exports = { upsertVote, findVote, };
