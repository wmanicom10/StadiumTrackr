const db = require('../database/connection.js');

const handleLoadStadiumMap = async (req, res) => {
    const { name } = req.body;

    try {
        const [rows] = await db.execute('SELECT stadium_name, street_address, city, state, zip, image, latitude, longitude FROM stadiums WHERE stadium_name = ?', [name]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Could not load stadium map' });
        }

        const result = rows[0];

        res.json({ result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadStadiumMap };