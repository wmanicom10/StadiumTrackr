const db = require('../database/connection.js');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PROFILE_PIC_DIR = process.env.PROFILE_PIC_DIR;
const bcrypt = require('bcryptjs');
const sharp = require('sharp');

/*  deleteLog  */
const handleDeleteLog = async (req, res) => {
    const { visitId } = req.body;

    if (!visitId) {
        return res.status(400).json({ error: 'Visit ID is required' });
    }

    try {
        const [[{ user_id }]] = await db.execute('SELECT user_id FROM user_stadiums WHERE visit_id = ?', [visitId]);
        const [rows] = await db.execute('DELETE FROM user_stadiums WHERE visit_id = ?', [visitId]);

        await handleUpdateAchievementProgress(user_id);

        res.json({ rows });
    } catch (err) {
        console.error('Error in handleDeleteLog:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  editLog  */
const handleEditLog = async (req, res) => {
    const { visitId, editDateVisited, editNote } = req.body;

    if (!visitId) {
        return res.status(400).json({ error: 'Visit ID is required' });
    }

    try {
        const [[{ user_id }]] = await db.execute('SELECT user_id FROM user_stadiums WHERE visit_id = ?', [visitId]);
        const [rows] = await db.execute('UPDATE user_stadiums SET visited_on = ?, user_note = ? WHERE visit_id = ?', [editDateVisited, editNote, visitId]);

        await handleUpdateAchievementProgress(user_id);

        res.json({ rows });
    } catch (err) {
        console.error('Error in handleEditLog:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  updateAchievementProgress  */
async function getStats(userId) {
    const [[{ numStadiumsVisited, numStatesVisited, numCanada, numNonNorthAmerica, numCalifornia, numTexas, numFlorida }]] = await db.execute(`
        SELECT
            COUNT(DISTINCT us.stadium_id) AS numStadiumsVisited,
            COUNT(DISTINCT s.state) AS numStatesVisited,
            COUNT(DISTINCT CASE WHEN c.country_name = 'Canada' THEN us.stadium_id END) AS numCanada,
            COUNT(DISTINCT CASE WHEN c.country_name NOT IN ('Canada', 'The United States of America', 'Mexico') THEN us.stadium_id END) AS numNonNorthAmerica,
            COUNT(DISTINCT CASE WHEN s.state = 'CA' THEN us.stadium_id END) AS numCalifornia,
            COUNT(DISTINCT CASE WHEN s.state = 'TX' THEN us.stadium_id END) AS numTexas,
            COUNT(DISTINCT CASE WHEN s.state = 'FL' THEN us.stadium_id END) AS numFlorida
        FROM user_stadiums us
        JOIN stadiums s ON us.stadium_id = s.stadium_id
        JOIN countries c ON s.country_id = c.country_id
        WHERE us.user_id = ?
    `, [userId]);

    const [[{ numNFLVisited, numNBAVisited, numMLBVisited, numNHLVisited, numMLSVisited, numWNBAVisited, numNCAAFVisited, numNCAABVisited }]] = await db.execute(`
        SELECT
            COUNT(DISTINCT CASE WHEN l.league_name = 'NFL' THEN us.stadium_id END) AS numNFLVisited,
            COUNT(DISTINCT CASE WHEN l.league_name = 'NBA' THEN us.stadium_id END) AS numNBAVisited,
            COUNT(DISTINCT CASE WHEN l.league_name = 'MLB' THEN us.stadium_id END) AS numMLBVisited,
            COUNT(DISTINCT CASE WHEN l.league_name = 'NHL' THEN us.stadium_id END) AS numNHLVisited,
            COUNT(DISTINCT CASE WHEN l.league_name = 'MLS' THEN us.stadium_id END) AS numMLSVisited,
            COUNT(DISTINCT CASE WHEN l.league_name = 'WNBA' THEN us.stadium_id END) AS numWNBAVisited,
            COUNT(DISTINCT CASE WHEN l.league_name = 'NCAAF' THEN us.stadium_id END) AS numNCAAFVisited,
            COUNT(DISTINCT CASE WHEN l.league_name = 'NCAAB' THEN us.stadium_id END) AS numNCAABVisited
        FROM user_stadiums us
        JOIN stadiums s ON us.stadium_id = s.stadium_id
        JOIN teams t ON s.stadium_id = t.stadium_id
        JOIN leagues l ON t.league_id = l.league_id
        WHERE us.user_id = ?
    `, [userId]);

    const [[{ numMaxVisits }]] = await db.execute(`
        SELECT COALESCE(MAX(visit_count), 0) AS numMaxVisits
        FROM (
            SELECT us.stadium_id, COUNT(us.visit_id) AS visit_count
            FROM user_stadiums us
            WHERE us.user_id = ?
            AND us.visited_on IS NOT NULL
            GROUP BY us.stadium_id
        ) AS repeatVisits
    `, [userId]);

    const [visitDates] = await db.execute(`
        SELECT us.stadium_id, us.visited_on, s.city
        FROM user_stadiums us
        JOIN stadiums s ON us.stadium_id = s.stadium_id
        WHERE us.user_id = ?
    `, [userId]);

    return {
        numStadiumsVisited,
        numStatesVisited,
        numCanada,
        numNonNorthAmerica,
        numCalifornia,
        numTexas,
        numFlorida,
        numNFLVisited,
        numNBAVisited,
        numMLBVisited,
        numNHLVisited,
        numMLSVisited,
        numWNBAVisited,
        numNCAAFVisited,
        numNCAABVisited,
        numMaxVisits,
        visitDates
    };
}

function calculateAchievementProgress(achievement, stats) {
    switch (achievement.achievement_id) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 7:
        case 34:
        case 35:
        case 36:
            return stats.numStadiumsVisited;
        case 8:
        case 9:
        case 10:
        case 11:
            return stats.numStatesVisited;
        case 12:
            return stats.numCanada > 0 ? 1 : 0;
        case 13:
            return stats.numNonNorthAmerica > 0 ? 1 : 0;
        case 14:
            return (stats.numCalifornia > 0 ? 1 : 0) + 
                   (stats.numTexas > 0 ? 1 : 0) + 
                   (stats.numFlorida > 0 ? 1 : 0);
        case 15:
            return stats.numNFLVisited;
        case 16:
            return stats.numNBAVisited;
        case 17:
            return stats.numMLBVisited;
        case 18:
            return stats.numNHLVisited;
        case 19:
            return stats.numMLSVisited;
        case 37:
            return stats.numWNBAVisited;
        case 38:
        case 39:
        case 40:
            return stats.numNCAAFVisited;
        case 41:
        case 42:
        case 43:
            return stats.numNCAABVisited;
        case 20:
            return (stats.numNFLVisited > 0 ? 1 : 0) + 
                   (stats.numNBAVisited > 0 ? 1 : 0) + 
                   (stats.numMLBVisited > 0 ? 1 : 0);
        case 21:
            return (stats.numNFLVisited > 0 ? 1 : 0) + 
                   (stats.numNBAVisited > 0 ? 1 : 0) + 
                   (stats.numMLBVisited > 0 ? 1 : 0) +
                   (stats.numNHLVisited > 0 ? 1 : 0) + 
                   (stats.numMLSVisited > 0 ? 1 : 0);
        case 22:
        case 23:
        case 24:
        case 25:
        case 26:
            return stats.numMaxVisits;
        case 28: {
            const seasons = new Set();
            for (const visit of stats.visitDates) {
                if (!visit.visited_on) continue
                const month = new Date(visit.visited_on).getMonth() + 1;
                if (month >= 3 && month <= 5) seasons.add('spring');
                else if (month >= 6 && month <= 8) seasons.add('summer');
                else if (month >= 9 && month <= 11) seasons.add('fall');
                else seasons.add('winter');
            }
            return seasons.size;
        }
        case 31: {
            const uniqueDates = [...new Set(
                stats.visitDates
                .filter(v => v.visited_on)
                .map(v => new Date(v.visited_on).toDateString())
            )].map(d => new Date(d)).sort((a, b) => a - b);

            for (let i = 0; i <= uniqueDates.length - 3; i++) {
                const diff = (uniqueDates[i + 2] - uniqueDates[i]) / (1000 * 60 * 60 * 24);
                if (diff <= 2) {
                const stadiumsInWindow = new Set(
                    stats.visitDates.filter(v => {
                    const d = new Date(v.visited_on);
                    return d >= uniqueDates[i] && d <= uniqueDates[i + 2];
                    }).map(v => v.stadium_id)
                );
                if (stadiumsInWindow.size >= 3) return 1;
                }
            }
            return 0;
        }
        case 32: {
            const cityCounts = {};
            for (const visit of stats.visitDates) {
                if (!visit.city) continue;
                const city = visit.city;
                cityCounts[city] = cityCounts[city] || new Set();
                cityCounts[city].add(visit.stadium_id);
            }
            return Object.values(cityCounts).some(stadiums => stadiums.size >= 3) ? 1 : 0;
        }
        case 33: {
            const dateCounts = {};
            for (const visit of stats.visitDates) {
                if (!visit.visited_on) continue;
                const date = new Date(visit.visited_on).toDateString();
                dateCounts[date] = dateCounts[date] || new Set();
                dateCounts[date].add(visit.stadium_id);
            }
            return Object.values(dateCounts).some(stadiums => stadiums.size >= 2) ? 1 : 0;
        }
        default: return 0;
    }
}

const handleUpdateAchievementProgress = async (userId) => {
    const stats = await getStats(userId);
    const [achievements] = await db.query('SELECT * FROM achievements');

    for (const achievement of achievements) {
        const progress = calculateAchievementProgress(achievement, stats);
        const unlocked = progress >= achievement.progress_goal;

        await db.execute(`
            INSERT INTO user_achievements (user_id, achievement_id, progress_value, unlocked, unlocked_on)
            VALUES (?, ?, ?, ?, IF(?, NOW(), NULL))
            ON DUPLICATE KEY UPDATE
                progress_value = VALUES(progress_value),
                unlocked = VALUES(unlocked),
                unlocked_on = IF(? AND unlocked_on IS NULL, NOW(), IF(?, unlocked_on, NULL))`,
            [userId, achievement.achievement_id, progress, unlocked, unlocked, unlocked, unlocked]
        );
    }
}

/*  updateEmail  */
const handleUpdateEmail = async (req, res) => {
    const { newEmail } = req.body;
    const { userId, username, email, profilePic } = req.user;

    try {
        const [[existingUser]] = await db.execute('SELECT user_id FROM users WHERE email = ?', [newEmail]);

        if (existingUser) {
            return res.status(409).json({ error: 'Email already in use' });
        }

        if (email === newEmail) {
            return res.status(409).json({ error: 'New email must be different from current email' });
        }

        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        await db.query('UPDATE users SET email = ? WHERE user_id = ?', [newEmail, userId]);

        const token = jwt.sign(
            { userId, username, email: newEmail, profilePic },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  updatePassword  */
const handleUpdatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const { userId } = req.user;

    try {
        const [[user]] = await db.execute('SELECT password FROM users WHERE user_id = ?', [userId]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        const [result] = await db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashedPassword, userId]);

        res.json({ result });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  updateProfilePic  */
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
    const { userId, username, email } = req.user;

    try {
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

        const newFilename = `user_${username}.jpg`;
        const tempPath = path.join(PROFILE_PIC_DIR, req.file.filename);
        const newPath = path.join(PROFILE_PIC_DIR, newFilename);

        await sharp(tempPath)
            .resize(200, 200, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 80 })
            .toFile(newPath);

        fs.unlinkSync(tempPath);

        await db.query('UPDATE users SET profile_pic = ? WHERE user_id = ?', [newFilename, userId]);
        
        const token = jwt.sign(
            { userId, username, email, profilePic: newFilename },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  updateUsername  */
const handleUpdateUsername = async (req, res) => {
    const { newUsername } = req.body;
    const { userId, username, email, profilePic } = req.user;

    try {
        const [[existingUser]] = await db.execute('SELECT user_id FROM users WHERE username = ?', [newUsername]);

        if (existingUser) {
            return res.status(409).json({ error: 'Username is taken' });
        }

        if (username === newUsername) {
            return res.status(409).json({ error: 'New username must be different from current username' });
        }

        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        await db.query('UPDATE users SET username = ? WHERE user_id = ?', [newUsername, userId]);

        const token = jwt.sign(
            { userId, username: newUsername, email, profilePic },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  updateUserStadium  */
const handleUpdateUserStadium = async (req, res) => {
    const { stadiumId, isVisited } = req.body;
    const { userId } = req.user;

    if (!stadiumId || !userId) {
        return res.status(400).json({ error: 'Stadium id and user id are required' });
    }

    try {
        if (!userId || !stadiumId) {
            return res.status(404).json({ error: 'User or stadium not found' });
        }

        if (!isVisited) {
            const [rows] = await db.execute('INSERT INTO user_stadiums (stadium_id, user_id, added_on) VALUES (?, ?, NOW())', [stadiumId, userId]);

            await handleUpdateAchievementProgress(userId);

            res.json({ rows });
        } else {
            const [logged] = await db.execute(
                'SELECT visit_id FROM user_stadiums WHERE stadium_id = ? AND user_id = ? AND visited_on IS NOT NULL LIMIT 1',
                [stadiumId, userId]
            );

            if (logged.length > 0) {
                return res.json({ locked: true });
            }

            const [rows] = await db.execute('DELETE FROM user_stadiums WHERE stadium_id = ? AND user_id = ?', [stadiumId, userId]);
            
            await handleUpdateAchievementProgress(userId);
            
            res.json({ rows });
        }
    } catch (err) {
        console.error('Error in handleUpdateUserStadium:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  updateUserWishlist  */
const handleUpdateUserWishlist = async (req, res) => {
    const { stadiumId, isWishlist } = req.body;
    const { userId } = req.user;

    if (!stadiumId || !userId) {
        return res.status(400).json({ error: 'Stadium id and username are required' });
    }

    try {
        if (!userId || !stadiumId) {
            return res.status(404).json({ error: 'User or stadium not found' });
        }

        if (!isWishlist) {
            const [rows] = await db.execute('INSERT INTO user_wishlist_stadiums (stadium_id, user_id, added_on) VALUES (?, ?, NOW())', [stadiumId, userId]);

            res.json({ rows });
        } else {
            const [rows] = await db.execute('DELETE FROM user_wishlist_stadiums WHERE stadium_id = ? AND user_id = ?', [stadiumId, userId]);

            res.json({ rows });
        }
    } catch (err) {
        console.error('Error in handleUpdateUserWishlist:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  resetPassword  */
const handleResetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const [rows] = await db.query('SELECT user_id FROM password_resets WHERE token = ? AND expires_at > NOW()', [token]);

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }

        const userId = rows[0].user_id;
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        const [result] = await db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashedPassword, userId]);

        await db.query('DELETE FROM password_resets WHERE token = ?', [token]);

        res.json({ result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleDeleteLog, handleEditLog, handleUpdateAchievementProgress, handleUpdateEmail, handleUpdatePassword, upload, handleUpdateProfilePic, handleUpdateUsername, handleUpdateUserStadium, handleUpdateUserWishlist, handleResetPassword };