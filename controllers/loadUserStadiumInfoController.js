const db = require('../database/connection.js');
const { getUserId } = require('../database/dbHelpers.js');

const handleLoadUserStadiumInfo = async (req, res) => {
    const { username } = req.body;

    try {
        const userId = await getUserId(username);
        
        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const leagues = ["NFL", "NBA", "MLB", "NHL", "MLS", "WNBA"];
        const userStadiums = {};

        for (const league of leagues) {
            const [stadiums] = await db.execute('SELECT DISTINCT stadium_name, location, image FROM user_stadiums JOIN stadiums ON user_stadiums.stadium_id = stadiums.stadium_id JOIN teams ON stadiums.stadium_id = teams.stadium_id JOIN leagues ON teams.league_id = leagues.league_id WHERE user_stadiums.user_id = ? AND league_name = ? ORDER BY stadium_name', [userId, league]);
            userStadiums[league] = stadiums;
        }

        res.json({ userStadiums });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadUserStadiumInfo };