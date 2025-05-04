// server.js
const express = require('express');
const cors = require('cors');
const postRoutes = require('./routes/postRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const pollRoutes = require('./routes/pollRoutes');
const commentRoutes = require('./routes/commentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes =require('./routes/reportRoutes')

const app = express();

app.use(cors());
app.use(express.json());

app.use('/posts', postRoutes);
app.use('/media', mediaRoutes);
app.use('/polls', pollRoutes);
app.use('/comments', commentRoutes);
app.use('/admin', adminRoutes);
app.use('/users', userRoutes);
app.use('/report', reportRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
