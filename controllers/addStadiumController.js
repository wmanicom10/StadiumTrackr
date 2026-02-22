const db = require('../database/connection.js');
const { getStadiumId, getUserId } = require('../database/dbHelpers.js');

const handleAddStadium = async (req, res) => {
    const { stadiumId, username, dateVisited, note } = req.body;

    if (!username || !stadiumId) {
        return res.status(400).json({ error: 'Stadium id and/or username is required' });
    }

    try {
        const userId = username ? await getUserId(username) : null;

        if (!stadiumId || !userId) {
            return res.status(404).json({ error: 'Stadium or user not found' });
        }

        const [rows] = await db.execute('INSERT INTO user_stadiums (stadium_id, user_id, added_on, visited_on, user_note) SELECT s.stadium_id, u.user_id, NOW(), ?, ? FROM stadiums s, users u WHERE s.stadium_id = ? AND u.username = ?', [dateVisited, note, stadiumId, username]);

        await db.execute('DELETE FROM user_wishlist_stadiums WHERE stadium_id = ? AND user_id = ?', [stadiumId, userId]);

        res.json({ rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleAddStadium };