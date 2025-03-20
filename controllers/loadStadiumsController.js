const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'StadiumTrackr'
});

const handleLoadStadiums = async (req, res) => {
    const { league } = req.body;

    try {
        const [rows] = await db.execute('select distinct stadium_name, image, location from teams join stadiums on teams.stadium_id = stadiums.stadium_id where league_id = (select league_id from leagues where league_name = ?) order by stadium_name', [league]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Could not load stadiums' });
        }

        res.json({ rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadStadiums };