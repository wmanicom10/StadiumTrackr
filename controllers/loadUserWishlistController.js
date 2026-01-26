const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const handleLoadUserWishlist = async (req, res) => {
    const { username, league, country, sortBy } = req.body;

    try {
        let query = `
            SELECT DISTINCT 
                stadiums.stadium_id,
                stadiums.stadium_name, 
                stadiums.image, 
                stadiums.city, 
                stadiums.state,
                stadiums.country_id,
                user_wishlist_stadiums.added_on
            FROM user_wishlist_stadiums
            JOIN stadiums ON user_wishlist_stadiums.stadium_id = stadiums.stadium_id
            JOIN users ON user_wishlist_stadiums.user_id = users.user_id
            JOIN teams ON stadiums.stadium_id = teams.stadium_id
            JOIN leagues ON teams.league_id = leagues.league_id
            JOIN countries ON stadiums.country_id = countries.country_id
            WHERE users.username = ?
        `;
        
        const params = [username];
        
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
        
        switch (sortBy) {
            case 'name-desc':
                query += ` ORDER BY stadiums.stadium_name DESC`;
                break;
            case 'name-asc':
                query += ` ORDER BY stadiums.stadium_name ASC`;
                break;
            case 'added-desc':
                query += ` ORDER BY user_wishlist_stadiums.added_on DESC`;
                break;
            case 'added-asc':
                query += ` ORDER BY user_wishlist_stadiums.added_on ASC`;
                break;
            default:
                query += ` ORDER BY stadiums.stadium_name ASC`;
        }
        
        const [userWishlist] = await db.query(query, params);

        res.json({ userWishlist });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadUserWishlist };