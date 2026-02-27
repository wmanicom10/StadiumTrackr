const db = require('../database/connection.js');
const { buildCountryFilter, buildLeagueFilter, buildSortOrder } = require('../database/dbHelpers.js');

const handleLoadStadiums = async (req, res) => {
    const { league, country, sortBy, username } = req.body;
        
    try {
        let query = `
            SELECT DISTINCT 
                stadiums.stadium_id,
                stadiums.stadium_name, 
                stadiums.image, 
                stadiums.city, 
                stadiums.state,
                stadiums.country_id
                ${username ? `,
                CASE WHEN v.stadium_id IS NOT NULL THEN 1 ELSE 0 END AS visited,
                CASE WHEN w.stadium_id IS NOT NULL THEN 1 ELSE 0 END AS wishlist` : ''}
            FROM stadiums
            JOIN teams ON stadiums.stadium_id = teams.stadium_id
            JOIN leagues ON teams.league_id = leagues.league_id
            JOIN countries ON stadiums.country_id = countries.country_id
            ${username ? `
                LEFT JOIN users u ON u.username = ?
                LEFT JOIN user_stadiums v ON v.stadium_id = stadiums.stadium_id AND v.user_id = u.user_id
                LEFT JOIN user_wishlist_stadiums w ON w.stadium_id = stadiums.stadium_id AND w.user_id = u.user_id` : ''}
            WHERE 1=1
        `;
        
        const params = [];
        if (username) params.push(username);

        const leagueFilter = buildLeagueFilter(league);
        query += leagueFilter.sql;
        params.push(...leagueFilter.params);

        const countryFilter = buildCountryFilter(country);
        query += countryFilter.sql;
        params.push(...countryFilter.params);

        query += buildSortOrder(sortBy, 'stadiums');

        const [stadiums] = await db.query(query, params);
        res.json({ stadiums });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadStadiums };