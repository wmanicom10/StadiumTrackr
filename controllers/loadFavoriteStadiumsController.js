const db = require('../database/connection.js');
const { getUserId } = require('../database/dbHelpers.js');

const handleLoadFavoriteStadiums = async (req, res) => {
    const { username } = req.body;

    try {
        const userId = await getUserId(username);

        if (!userId) return res.status(404).json({ error: 'User not found' });

        const [favoriteStadiums] = await db.query('SELECT stadiums.stadium_id, stadium_name, city, state, image, order_index FROM user_favorite_stadiums JOIN stadiums ON user_favorite_stadiums.stadium_id = stadiums.stadium_id WHERE user_id = ? ORDER BY order_index ASC', [userId]);

        res.json({ favoriteStadiums });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadFavoriteStadiums };