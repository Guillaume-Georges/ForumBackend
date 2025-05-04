// models/mediaModel.js
const db = require('../connection/db');

const addMediaToPost = async ({ post_id, type, url }) => {
  const [result] = await db.execute(
    `INSERT INTO post_media (post_id, type, url) VALUES (?, ?, ?)`,
    [post_id, type, url]
  );
  return result.insertId;
};

const getMediaByPostId = async (post_id) => {
    const [rows] = await db.execute(
      `SELECT id, url FROM post_media WHERE post_id = ?`,
      [post_id]
    );
    return rows;
  };

  const deleteMediaById = async (mediaId) => {
    const [rows] = await db.execute(
      `SELECT url FROM post_media WHERE id = ?`,
      [mediaId]
    );
  
    if (!rows.length) return null;
  
    const fileUrl = rows[0].url;
  
    await db.execute(
      `DELETE FROM post_media WHERE id = ?`,
      [mediaId]
    );
  
    return fileUrl;
  };
  


module.exports = {
  addMediaToPost,
  getMediaByPostId,
  deleteMediaById,
};
