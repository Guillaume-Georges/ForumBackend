// models/userModel.js
const db = require('../connection/db');



async function CreateUser({ auth0_id, name, email, profile_image }) {
  // 1) Check if user exists
  const [rows] = await db.execute(
    `SELECT id, auth0_id, name, profile_image, role FROM users WHERE auth0_id = ?`,
    [auth0_id]
  );

  if (rows.length > 0) {
    // Update the existing user with new name and profile_image
    await db.execute(
      `UPDATE users SET name = ?, profile_image = ? WHERE auth0_id = ?`,
      [name || null, profile_image || null, auth0_id]
    );

    // Return the updated user row including role
    const [updatedRows] = await db.execute(
      `SELECT id, auth0_id, name, profile_image, role FROM users WHERE auth0_id = ?`,
      [auth0_id]
    );
    return updatedRows[0];
  }

  // 2) Insert new user when not found
  const [result] = await db.execute(
    `INSERT INTO users (auth0_id, name, profile_image) VALUES (?, ?, ?)`,
    [auth0_id, name || null, profile_image || null]
  );

  const newUserId = result.insertId;

  // 3) Return the newly created user row including role
  const [newUserRows] = await db.execute(
    `SELECT id, auth0_id, name, profile_image, role FROM users WHERE id = ?`,
    [newUserId]
  );

  return newUserRows[0];
}

async function getUserPosts(userId) {
  const [rows] = await db.execute(
    `SELECT
        u.id          AS user_id,
        u.name,
        u.role,
        u.position,
        u.profile_image,
        u.linkedin_url,
        u.facebook_url,
        u.website_url,

        p.id          AS post_id,
        p.title,
        p.description,
        p.score,
        p.created_at
     FROM users u
     LEFT JOIN posts p   ON p.user_id = u.id      /* null rows when no posts */
     WHERE u.id = ?
     ORDER BY p.created_at DESC`,
    [userId]
  );

  if (rows.length === 0) return null;            // user doesn’t exist

  /* ---------- build user object from the first row ---------- */
  const {
    user_id, name, role, position,
    profile_image, linkedin_url, facebook_url, website_url
  } = rows[0];

  const user = {
    id:            user_id,
    name,
    role,
    position,
    profile_image,
    linkedin_url,
    facebook_url,
    website_url
  };

  /* ---------- collect posts (skip nulls if the user has none) ---------- */
  const posts = rows
    .filter(r => r.post_id !== null)
    .map(r => ({
      id:          r.post_id,
      user_id:     r.user_id,
      title:       r.title,
      description: r.description,
      score:       r.score,
      created_at:  r.created_at
    }));

  return { user, posts };
}




async function GetUserProfile(userId) {
  const [rows] = await db.execute(
    'SELECT id, name, position, linkedin_url, facebook_url, instagram_url, website_url, profile_image FROM users WHERE id = ?',
    [userId]
  );
  return rows[0] || null;
}

async function UpdateUserProfile(userId, { name, position, linkedin_url, facebook_url, instagram_url, website_url }) {
  await db.execute(
    'UPDATE users SET name = ?, position = ?, linkedin_url = ?, facebook_url = ?, instagram_url = ?, website_url = ? WHERE id = ?',
    [name, position || null, linkedin_url || null, facebook_url || null, instagram_url || null, website_url || null, userId]
  );
  return true;
}

/** Return auth0_id (or null) for an internal numeric user id */
async function GetAuth0Id(userId) {
  const [rows] = await db.execute(
    'SELECT auth0_id FROM users WHERE id = ?',
    [userId]
  );
  return rows.length ? rows[0].auth0_id : null;
}

/** Hard-delete the row from MySQL */
async function DeleteAccount(userId) {
  await db.execute('DELETE FROM users WHERE id = ?', [userId]);
  return true;
}


module.exports = {
  CreateUser,
  GetAuth0Id,
  GetUserProfile,
  DeleteAccount,
  UpdateUserProfile,
  getUserPosts,
};


