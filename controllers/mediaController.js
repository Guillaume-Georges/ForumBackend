// controllers/mediaController.js
const mediaModel = require('../models/mediaModel');
const { cloudinary } = require('../config/cloudinary');

const uploadMediaToPost = async (req, res) => {
    try {
      const postId = req.query.post_id;
      const file = req.file;
  
      if (!postId) {
        return res.status(400).json({ error: 'Missing post_id in query' });
      }
  
      if (!file || !file.path) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
  
      const mediaType = file.mimetype.includes('image') ? 'image'
                      : file.mimetype.includes('video') ? 'video'
                      : file.mimetype.includes('pdf') ? 'pdf'
                      : 'file';
  
      const mediaId = await mediaModel.addMediaToPost({
        post_id: postId,
        type: mediaType,
        url: file.path
      });
  
      res.status(201).json({ message: 'Media uploaded', mediaId, url: file.path });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Upload failed' });
    }
  };
  
const deleteMedia = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const fileUrl = await mediaModel.deleteMediaById(mediaId);

        if (!fileUrl) {
        return res.status(404).json({ error: 'Media not found' });
        }

        const { resource_type, public_id } = extractPublicIdAndType(fileUrl);

        if (public_id) {
        await cloudinary.uploader.destroy(public_id, {
            resource_type,
        });
        }

        res.json({ message: 'Media deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Delete failed' });
    }
};
  

// Utility to extract Cloudinary public ID from the URL
const extractPublicId = (url) => {
    const matches = url.match(/\/forum-media\/([^\.]+)/);
    return matches ? `forum-media/${matches[1]}` : null;
  };

const extractPublicIdAndType = (url) => {
const typeMatch = url.match(/cloudinary\.com\/[^/]+\/([^/]+)\/upload/);
const idMatch = url.match(/\/forum-media\/([^\.]+)/);

const resource_type = typeMatch ? typeMatch[1] : 'image'; // fallback to image
const public_id = idMatch ? `forum-media/${idMatch[1]}` : null;

return { resource_type, public_id };
};
  
  

module.exports = {
  uploadMediaToPost,
  deleteMedia,
};
