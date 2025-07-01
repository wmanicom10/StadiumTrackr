const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const handleUpdateUserStadium = async (req, res) => {
    const { name, username, isVisited } = req.body;

    if (!name || !username) {
        return res.status(400).json({ error: 'Stadium name/username is required' });
    }

    try {
        if (isVisited) {
            const [rows] = await db.execute(`INSERT INTO user_stadiums (stadium_id, user_id, rated_on) VALUES ((SELECT stadium_id FROM stadiums WHERE stadium_name = ?), (SELECT user_id FROM users WHERE username = ?), NOW())`, [name, username]);

            await db.execute('UPDATE stadiums SET visits = visits + 1 WHERE stadium_name = ?', [name]);

            res.json({ rows });
        } else {
            const [rows] = await db.execute(`DELETE FROM user_stadiums WHERE stadium_id = (SELECT stadium_id FROM stadiums WHERE stadium_name = ?) AND user_id = (SELECT user_id FROM users WHERE username = ?)`, [name, username]);

            await db.execute('UPDATE stadiums SET visits = visits - 1 WHERE stadium_name = ? AND visits > 0', [name]);

            res.json({ rows });
        }
    } catch (err) {
        console.error('Error in handleUpdateUserStadium:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const handleUpdateUserLike = async (req, res) => {
    const { name, username, isLiked } = req.body;

    if (!name || !username) {
        return res.status(400).json({ error: 'Stadium name/username is required' });
    }

    try {
        if (isLiked) {
            const [rows] = await db.execute(`INSERT INTO stadium_likes (stadium_id, user_id, liked_on) VALUES ((SELECT stadium_id FROM stadiums WHERE stadium_name = ?), (SELECT user_id FROM users WHERE username = ?), NOW())`, [name, username]);

            res.json({ rows });
        } else {
            const [rows] = await db.execute(`DELETE FROM stadium_likes WHERE stadium_id = (SELECT stadium_id FROM stadiums WHERE stadium_name = ?) AND user_id = (SELECT user_id FROM users WHERE username = ?)`, [name, username]);

            res.json({ rows });
        }
    } catch (err) {
        console.error('Error in handleUpdateUserLike:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const handleUpdateUserRating = async (req, res) => {
    const { name, username, selectedRating } = req.body;

    if (!name || !username) {
        return res.status(400).json({ error: 'Stadium name/username is required' });
    }

    try {
        const [rows] = await db.execute(`INSERT INTO user_stadiums (stadium_id, user_id, rating, rated_on) VALUES ((SELECT stadium_id FROM stadiums WHERE stadium_name = ?), (SELECT user_id FROM users WHERE username = ?), ?, NOW())`, [name, username, selectedRating]);

        const [visited] = await db.execute('SELECT COUNT(*) AS visited_count FROM user_stadiums JOIN stadiums ON user_stadiums.stadium_id = stadiums.stadium_id JOIN users ON user_stadiums.user_id = users.user_id WHERE stadium_name = ? AND username = ?', [name, username]);

        if (visited[0].visited_count === 1) {
            await db.execute('UPDATE stadiums SET visits = visits + 1 WHERE stadium_name = ?', [name]);
        }

        res.json({ rows });
    } catch (err) {
        console.error('Error updating user rating', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { handleUpdateUserStadium, handleUpdateUserLike, handleUpdateUserRating };