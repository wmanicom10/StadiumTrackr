const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const handleLoadMapStadiums = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT stadium_name, street_address, city, state, zip, latitude, longitude, image FROM stadiums order by stadium_id');

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Could not load stadiums' });
        }

        const formattedRows = rows.map(row => ({
            stadium_name: row.stadium_name,
            address: `${row.street_address}, ${row.city}, ${row.state} ${row.zip}`,
            location: [row.latitude, row.longitude],
            image: row.image
        }));

        res.json({ rows: formattedRows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadMapStadiums };