const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const handleLoadUserActivity = async (req, res) => {
    const { username, activity, stadium, sortBy } = req.body;
    
    try {
        let query = '';
        let params = [];
        
        if (activity === 'all' || activity === 'logged' || activity === 'visited') {
            query = `
                SELECT 
                    stadiums.stadium_id,
                    stadiums.stadium_name,
                    stadiums.image,
                    stadiums.city,
                    stadiums.state,
                    stadiums.country_id,
                    user_stadiums.visit_id,
                    user_stadiums.added_on,
                    user_stadiums.visited_on,
                    user_stadiums.user_note,
                    'stadium' as activity_type
                FROM user_stadiums
                JOIN stadiums ON user_stadiums.stadium_id = stadiums.stadium_id
                JOIN users ON user_stadiums.user_id = users.user_id
                WHERE users.username = ?
            `;
            params.push(username);
            
            if (stadium && stadium !== '') {
                query += ` AND stadiums.stadium_name = ?`;
                params.push(stadium);
            }
            
            if (activity === 'logged') {
                query += ` AND user_stadiums.visited_on IS NOT NULL`;
            } else if (activity === 'visited') {
                query += ` AND user_stadiums.visited_on IS NULL`;
            }
        }
        
        if (activity === 'all' || activity === 'wishlist') {
            let wishlistQuery = `
                SELECT 
                    stadiums.stadium_id,
                    stadiums.stadium_name,
                    stadiums.image,
                    stadiums.city,
                    stadiums.state,
                    stadiums.country_id,
                    NULL as visit_id,
                    user_wishlist_stadiums.added_on,
                    NULL as visited_on,
                    NULL as user_note,
                    'wishlist' as activity_type
                FROM user_wishlist_stadiums
                JOIN stadiums ON user_wishlist_stadiums.stadium_id = stadiums.stadium_id
                JOIN users ON user_wishlist_stadiums.user_id = users.user_id
                WHERE users.username = ?
            `;
            params.push(username);
            
            if (stadium && stadium !== '') {
                wishlistQuery += ` AND stadiums.stadium_name = ?`;
                params.push(stadium);
            }
            
            if (activity === 'all') {
                query = `(${query}) UNION ALL (${wishlistQuery})`;
            } else if (activity === 'wishlist') {
                query = wishlistQuery;
            }
        }
        
        switch (sortBy) {
            case 'date-desc':
                query += ` ORDER BY added_on DESC`;
                break;
            case 'date-asc':
                query += ` ORDER BY added_on ASC`;
                break;
            case 'name-desc':
                query += ` ORDER BY stadium_name DESC`;
                break;
            case 'name-asc':
                query += ` ORDER BY stadium_name ASC`;
                break;
            default:
                query += ` ORDER BY added_on DESC`;
        }
        
        const [userActivity] = await db.query(query, params);

        res.json({ userActivity });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadUserActivity };