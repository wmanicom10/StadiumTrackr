const db = require('../database/connection.js');
const { getStadiumId, getUserId } = require('../database/dbHelpers.js');

const handleSaveFavoriteStadiums = async (req, res) => {
    const { username, stadiumNames } = req.body;
    const connection = await db.getConnection();
    try {
        const userId = await getUserId(username);
        if (!userId) return res.status(404).json({ error: 'User not found' });

        await connection.beginTransaction();

        await connection.query(
            'DELETE FROM user_favorite_stadiums WHERE user_id = ?',
            [userId]
        );

        for (let i = 0; i < stadiumNames.length; i++) {
            const stadiumId = await getStadiumId(stadiumNames[i]);
            if (stadiumId) {
                await connection.query(
                    'INSERT INTO user_favorite_stadiums (user_id, stadium_id, order_index) VALUES (?, ?, ?)',
                    [userId, stadiumId, i]
                );
            }
        }

        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
};

module.exports = { handleSaveFavoriteStadiums };