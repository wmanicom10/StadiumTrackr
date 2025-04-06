const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'StadiumTrackr'
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