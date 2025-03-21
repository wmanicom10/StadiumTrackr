const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'StadiumTrackr'
});

const handleLoadLeagues = async (req, res) => {
    try {
        const [leagues] = await db.execute('select league_name from leagues');

        console.log(leagues);

        if (leagues.length === 0) {
            return res.status(404).json({ error: 'Could not load stadiums' });
        }

        res.json({ leagues });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadLeagues };