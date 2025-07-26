const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const handleLoadUserHomeMap = async (req, res) => {
    const { username } = req.body;

    try {
        const [stadiums] = await db.execute('SELECT s.stadium_name, s.street_address, s.city, s.state, s.zip, s.image, s.latitude, s.longitude FROM stadiums s JOIN user_stadiums us ON s.stadium_id = us.stadium_id JOIN users u ON us.user_id = u.user_id WHERE u.username = ?', [username]);

        const formattedRows = stadiums.map(row => ({
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