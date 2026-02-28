const db = require('../database/connection.js');

const handleLoadPopularStadiums = async (req, res) => {
    try {
        const [popularStadiums] = await db.execute('SELECT s.stadium_id, s.stadium_name, s.image, s.city, s.state, COUNT(DISTINCT us.user_id) + COUNT(DISTINCT w.user_id) AS popularity FROM stadiums s LEFT JOIN user_stadiums us ON us.stadium_id = s.stadium_id LEFT JOIN user_wishlist_stadiums w ON w.stadium_id = s.stadium_id GROUP BY s.stadium_id, s.stadium_name, s.image, s.city, s.state ORDER BY popularity DESC, s.stadium_name ASC LIMIT 3');

        res.json({ popularStadiums });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { handleLoadPopularStadiums };