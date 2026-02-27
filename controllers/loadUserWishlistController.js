const db = require('../database/connection.js');
const { getUserId, buildCountryFilter, buildLeagueFilter, buildSortOrder } = require('../database/dbHelpers.js');

const handleLoadUserWishlist = async (req, res) => {
    const { username, league, country, sortBy } = req.body;
    try {
        const userId = await getUserId(username);
        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        let query = `
            SELECT DISTINCT 
                stadiums.stadium_id,
                stadiums.stadium_name, 
                stadiums.image, 
                stadiums.city, 
                stadiums.state,
                stadiums.country_id,
                user_wishlist_stadiums.added_on,
                1 AS wishlist,
                CASE WHEN v.stadium_id IS NOT NULL THEN 1 ELSE 0 END AS visited
            FROM user_wishlist_stadiums
            JOIN stadiums ON user_wishlist_stadiums.stadium_id = stadiums.stadium_id
            JOIN teams ON stadiums.stadium_id = teams.stadium_id
            JOIN leagues ON teams.league_id = leagues.league_id
            JOIN countries ON stadiums.country_id = countries.country_id
            LEFT JOIN user_stadiums v ON v.stadium_id = stadiums.stadium_id AND v.user_id = ?
            WHERE user_wishlist_stadiums.user_id = ?
        `;

        const params = [userId, userId];

        const leagueFilter = buildLeagueFilter(league);
        query += leagueFilter.sql;
        params.push(...leagueFilter.params);

        const countryFilter = buildCountryFilter(country);
        query += countryFilter.sql;
        params.push(...countryFilter.params);

        query += buildSortOrder(sortBy, 'stadiums');

        const [userWishlist] = await db.query(query, params);
        res.json({ userWishlist });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadUserWishlist };