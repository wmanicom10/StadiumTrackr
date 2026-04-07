const db = require('../database/connection.js');

const handleLoadAboutInfo = async (req, res) => {
    try {
        const [aboutInfo] = await db.query('SELECT (SELECT COUNT(stadium_id) FROM stadiums) AS num_stadiums, (SELECT COUNT(league_id) FROM leagues) AS num_leagues, (SELECT COUNT(country_id) FROM countries) AS num_countries');

        res.json({ aboutInfo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadAboutInfo };