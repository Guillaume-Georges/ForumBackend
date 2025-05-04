// controllers/userController.js
const { cloudinary } = require('../config/cloudinary')
const axios = require('axios')
require('dotenv').config();
const userModel = require('../models/userModel');

// helper that obtains a Management-API access-token once and reuses it
let mgmtToken     = null;
let mgmtExpiresAt = 0;
async function getManagementToken() {
  if (mgmtToken && Date.now() < mgmtExpiresAt) return mgmtToken;

  const { data } = await axios.post(
    `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    {
      client_id:     process.env.AUTH0_MGMT_CLIENT_ID,
      client_secret: process.env.AUTH0_MGMT_CLIENT_SECRET,
      audience:      `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
      grant_type:    'client_credentials',
    }
  );
  mgmtToken     = data.access_token;
  mgmtExpiresAt = Date.now() + (data.expires_in - 30) * 1000; // renew a bit early
  return mgmtToken;
}


async function AddUser(req, res) {
  try {
    const { auth0_id, name, email, profile_image } = req.body;

    if (!auth0_id) {
      return res.status(400).json({ error: 'auth0_id is required' });
    }

    let cloudImageUrl = profile_image;

    // Only upload if profile_image is a remote URL
    if (profile_image && profile_image.startsWith('http')) {
      try {
        const response = await axios({
          url: profile_image,
          responseType: 'arraybuffer',
          method: 'GET'
        });

        const uploadRes = await cloudinary.uploader.upload_stream(
          {
            folder: 'forum-profile-images',
            public_id: `${auth0_id.replace('|', '_')}`,
            overwrite: true,
            resource_type: 'image'
          },
          async (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error)
              return res.status(500).json({ error: 'Cloudinary upload failed' })
            }

            cloudImageUrl = result.secure_url;

            const user = await userModel.CreateUser({
              auth0_id,
              name,
              email,
              profile_image: cloudImageUrl
            });

            return res.json(user);
          }
        );

        // Pipe the image buffer into Cloudinary stream
        require('stream').Readable.from(response.data).pipe(uploadRes);

        return; // prevent fallthrough before async stream finishes
      } catch (err) {
        console.error('Image download or upload failed:', err);
        // fallback to original image
      }
    }

    // No image to upload or fallback
    const user = await userModel.CreateUser({ auth0_id, name, email, profile_image: cloudImageUrl });
    res.json(user);
  } catch (err) {
    console.error('checkOrAddUser error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

/* DELETE  /users/:id  */
async function deleteUserAccount(req, res) {
  const userId = +req.params.id;

  // (optional) simple owner-check:
  if (userId !== req.body.id) return res.sendStatus(403);

  try {
    /* 1 ─ look up the auth0_id stored in DB */
    const auth0Id = await userModel.GetAuth0Id(userId);
    if (!auth0Id) return res.sendStatus(404);

    /* 2 ─ call Auth0 Management API to remove the identity */
    const token = await getManagementToken();
    await axios.delete(
      `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(auth0Id)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    /* 3 ─ finally remove the local row */
    await userModel.DeleteAccount(userId);

    return res.sendStatus(204);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Account deletion failed' });
  }
};

async function getUserPosts(req, res) {
  const userId = req.params.userId;
  try {
    const posts = await userModel.getUserPosts(userId);
    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Failed to load posts' });
  }
}

async function GetUserProfile(req, res) {
  const userId = req.params.id;

  try {
    const user = await userModel.GetUserProfile(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

async function UpdateUserProfile(req, res) {
  const userId = req.params.id;
  const { name, position, linkedin_url, facebook_url, instagram_url, website_url } = req.body;
  console.log('Info:', name, position, linkedin_url, facebook_url, instagram_url, website_url);

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid name' });
  }

  try {
    await userModel.UpdateUserProfile(userId, { name, position, linkedin_url, facebook_url, instagram_url, website_url });
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}


module.exports = {
  AddUser,
  UpdateUserProfile,
  GetUserProfile,
  getUserPosts,
  deleteUserAccount,
};
