const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

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
        
        if (league && league !== 'all') {
            query += ` AND leagues.league_name = ?`;
            params.push(league.toUpperCase());
        }
        
        if (country && country !== 'all') {
            if (country === 'us') {
                query += ` AND countries.country_name = ?`;
                params.push('The United States of America');
            } else if (country === 'canada') {
                query += ` AND countries.country_name = ?`;
                params.push('Canada');
            }
        }
        
        if (sortBy === 'name-desc') {
            query += ` ORDER BY stadiums.stadium_name DESC`;
        } else {
            query += ` ORDER BY stadiums.stadium_name ASC`;
        }
        
        const [stadiums] = await db.query(query, params);
        
        res.json({ stadiums });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadStadiums };