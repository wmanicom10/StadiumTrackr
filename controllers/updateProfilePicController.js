const multer = require('multer');
const path = require('path');
const db = require('../database/connection.js');
const { getUserId } = require('../database/dbHelpers.js');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/profile-pics/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `temp_${Date.now()}${ext}`);
    }
});

const upload = multer({ storage });

const handleUpdateProfilePic = async (req, res) => {
    const { username } = req.body;
    const ext = path.extname(req.file.filename);

    try {
        const userId = await getUserId(username);
        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [[user]] = await db.execute('SELECT profile_pic FROM users WHERE user_id = ?', [userId]);
        if (user.profile_pic && !user.profile_pic.includes('default.png')) {
            if (fs.existsSync(user.profile_pic)) {
                fs.unlinkSync(user.profile_pic);
            }
        }

        const newFilename = `user_${userId}${ext}`;
        const oldPath = `images/profile-pics/${req.file.filename}`;
        const newPath = `images/profile-pics/${newFilename}`;

        fs.renameSync(oldPath, newPath);

        await db.query('UPDATE users SET profile_pic = ? WHERE user_id = ?', [newPath, userId]);
        res.json({ profile_pic: newPath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { upload, handleUpdateProfilePic };