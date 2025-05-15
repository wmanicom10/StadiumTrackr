const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const handleSearchStadiums = async (req, res) => {
    const { name } = req.body;

    try {
        const [stadiums] = await db.execute('select stadium_name, image from stadiums where stadium_name like ?', [`${name}%`]);

        res.json({ stadiums });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleSearchStadiums };