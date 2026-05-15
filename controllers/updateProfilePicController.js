const multer = require('multer');
const path = require('path');
const db = require('../database/connection.js');
const { getUserId } = require('../database/dbHelpers.js');
const fs = require('fs');
const PROFILE_PIC_DIR = process.env.PROFILE_PIC_DIR;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, PROFILE_PIC_DIR);
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
            const fullOldPath = path.join(PROFILE_PIC_DIR, path.basename(user.profile_pic));
            if (fs.existsSync(fullOldPath)) {
                fs.unlinkSync(fullOldPath);
            }
        }

        const newFilename = `user_${userId}${ext}`;
	const oldPath = path.join(PROFILE_PIC_DIR, req.file.filename);
	const newPath = path.join(PROFILE_PIC_DIR, newFilename);
	const webPath = `images/profile-pics/${newFilename}`;

        fs.renameSync(oldPath, newPath);

        await db.query('UPDATE users SET profile_pic = ? WHERE user_id = ?', [webPath, userId]);
        res.json({ profile_pic: webPath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { upload, handleUpdateProfilePic };