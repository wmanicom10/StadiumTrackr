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
        return res.status(400).json({ error: 'Stadium name and username are required' });
    }

    try {
        if (!isVisited) {
            const [rows] = await db.execute(`INSERT INTO user_stadiums (stadium_id, user_id, added_on) VALUES ((SELECT stadium_id FROM stadiums WHERE stadium_name = ?), (SELECT user_id FROM users WHERE username = ?), NOW())`, [name, username]);

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

const handleUpdateUserWishlist = async (req, res) => {
    const { name, username, isWishlist } = req.body;

    if (!name || !username) {
        return res.status(400).json({ error: 'Stadium name and username are required' });
    }

    try {
        if (!isWishlist) {
            const [rows] = await db.execute(`INSERT INTO user_wishlist_stadiums (stadium_id, user_id, added_on) VALUES ((SELECT stadium_id FROM stadiums WHERE stadium_name = ?), (SELECT user_id FROM users WHERE username = ?), NOW())`, [name, username]);

            res.json({ rows });
        } else {
            const [rows] = await db.execute(`DELETE FROM user_wishlist_stadiums WHERE stadium_id = (SELECT stadium_id FROM stadiums WHERE stadium_name = ?) AND user_id = (SELECT user_id FROM users WHERE username = ?)`, [name, username]);

            res.json({ rows });
        }
    } catch (err) {
        console.error('Error in handleUpdateUserWishlist:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleUpdateUserStadium, handleUpdateUserWishlist };