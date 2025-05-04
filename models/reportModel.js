const db = require('../connection/db');

async function createReport({ postId, commentId, userId, reason }) {
  await db.execute(
    `INSERT INTO flagged_items
       (post_id_flagged, comment_id_flagged, flagged_by, flagged_reason)
     VALUES (?, ?, ?, ?)`,
    [postId ?? null, commentId ?? null, userId, reason]
  );
}
module.exports = { createReport };
