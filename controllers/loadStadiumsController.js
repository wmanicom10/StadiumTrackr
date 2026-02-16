const db = require('../database/connection.js');
const { buildCountryFilter, buildLeagueFilter, buildSortOrder } = require('../database/dbHelpers.js');

const handleLoadStadiums = async (req, res) => {
    const { league, country, sortBy } = req.body;
        
    try {
        let query = `
            SELECT DISTINCT 
                stadiums.stadium_id,
                stadiums.stadium_name, 
                stadiums.image, 
                stadiums.city, 
                stadiums.state,
                stadiums.country_id
            FROM stadiums
            JOIN teams ON stadiums.stadium_id = teams.stadium_id
            JOIN leagues ON teams.league_id = leagues.league_id
            JOIN countries ON stadiums.country_id = countries.country_id
            WHERE 1=1
        `;
        
        const params = [];
        
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