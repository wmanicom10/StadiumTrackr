const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'StadiumTrackr'
});

const handleLoadUserStadiumInfo = async (req, res) => {
    const { username } = req.body;

    try {
        const leagues = ["NFL", "NBA", "MLB", "NHL", "MLS"];

        const userStadiums = {};

        for (const league of leagues) {
            const [stadiums] = await db.execute('select distinct stadium_name, location, image from user_stadiums join stadiums on user_stadiums.stadium_id = stadiums.stadium_id join teams on stadiums.stadium_id = teams.stadium_id join leagues on teams.league_id = leagues.league_id where user_stadiums.user_id = (select user_id from users where username = ?) and league_name = ? order by stadium_name', [username, league]);

            userStadiums[league] = stadiums;
        }

        res.json({ userStadiums });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadUserStadiumInfo };