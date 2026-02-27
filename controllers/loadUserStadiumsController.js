const db = require('../database/connection.js');
const { getUserId, buildCountryFilter, buildLeagueFilter, buildSortOrder } = require('../database/dbHelpers.js');

const handleLoadUserStadiums = async (req, res) => {
    const { username, league, country, sortBy } = req.body;
    try {
        const userId = await getUserId(username);
        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const leagueFilter = buildLeagueFilter(league);
        const countryFilter = buildCountryFilter(country);

        let query = `
            SELECT 
                stadiums.stadium_id,
                stadiums.stadium_name, 
                stadiums.image, 
                stadiums.city, 
                stadiums.state,
                stadiums.country_id,
                1 AS visited,
                CASE WHEN MAX(w.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS wishlist
            FROM user_stadiums
            JOIN stadiums ON user_stadiums.stadium_id = stadiums.stadium_id
            JOIN teams ON stadiums.stadium_id = teams.stadium_id
            JOIN leagues ON teams.league_id = leagues.league_id
            JOIN countries ON stadiums.country_id = countries.country_id
            LEFT JOIN user_wishlist_stadiums w ON w.stadium_id = stadiums.stadium_id AND w.user_id = ?
            WHERE user_stadiums.user_id = ?
            ${leagueFilter.sql}
            ${countryFilter.sql}
            GROUP BY stadiums.stadium_id, stadiums.stadium_name, stadiums.image, stadiums.city, stadiums.state, stadiums.country_id
        `;

        query += buildSortOrder(sortBy, 'stadiums');

        const params = [userId, userId, ...leagueFilter.params, ...countryFilter.params];

        const [userStadiums] = await db.query(query, params);
        res.json({ userStadiums });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadUserStadiums };