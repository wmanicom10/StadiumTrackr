const db = require('../database/connection.js');
const { getUserId } = require('../database/dbHelpers.js');

const handleLoadUserHomeMap = async (req, res) => {
    const { username } = req.body;

    try {
        const userId = await getUserId(username);
        
        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [stadiums] = await db.execute('SELECT s.stadium_id, s.stadium_name, s.street_address, s.city, s.state, s.zip, s.image, s.latitude, s.longitude FROM stadiums s JOIN user_stadiums us ON s.stadium_id = us.stadium_id WHERE us.user_id = ?', [userId]);

        const formattedRows = stadiums.map(row => ({
            stadium_id: row.stadium_id,
            stadium_name: row.stadium_name,
            address: `${row.street_address}, ${row.city}, ${row.state} ${row.zip}`,
            location: [row.latitude, row.longitude],
            image: row.image
        }));

        res.json({ formattedRows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadUserHomeMap };