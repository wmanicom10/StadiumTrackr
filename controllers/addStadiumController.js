const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const handleAddStadium = async (req, res) => {
    const { username, name, dateVisited, note } = req.body;

    if (!username || !name) {
        return res.status(400).json({ error: 'Stadium name and/or username is required' });
    }

    try {
        const [rows] = await db.execute('INSERT INTO user_stadiums (stadium_id, user_id, added_on, visited_on, user_note) SELECT s.stadium_id, u.user_id, NOW(), ?, ? FROM stadiums s, users u WHERE s.stadium_name = ? AND u.username = ?', [dateVisited, note, name, username]);

        await db.execute('UPDATE stadiums SET visits = visits + 1 WHERE stadium_name = ?', [name]);

        res.json({ rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleAddStadium };