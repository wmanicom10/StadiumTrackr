const db = require('../config/db.js');
const { getUserId, getStadiumId } = require('../utils/dbHelpers.js');

const handleRemoveStadium = async (req, res) => {
    const { stadiumName, username } = req.body;

    if (!stadiumName || !username) {
        return res.status(400).json({ error: 'Stadium name and username are required' });
    }

    try {
        const userId = await getUserId(username);
        const stadiumId = await getStadiumId(stadiumName);

        if (!userId || !stadiumId) {
            return res.status(404).json({ error: 'User or stadium not found' });
        }

        const [result] = await db.execute('DELETE FROM user_stadiums WHERE stadium_id = ? AND user_id = ?', [stadiumId, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Could not remove stadium' });
        }

        res.json({ message: 'Stadium removed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleRemoveStadium };