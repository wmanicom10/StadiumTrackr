const db = require('../config/db.js');
const { getUserId, buildSortOrder } = require('../utils/dbHelpers.js');

const handleLoadUserActivity = async (req, res) => {
    const { username, activity, stadium, sortBy } = req.body;
    
    try {
        const userId = await getUserId(username);
        
        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

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
                WHERE user_stadiums.user_id = ?
            `;
            params.push(userId);
            
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
                WHERE user_wishlist_stadiums.user_id = ?
            `;
            params.push(userId);
            
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
        
        query += buildSortOrder(sortBy);
        
        const [userActivity] = await db.query(query, params);

        res.json({ userActivity });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadUserActivity };