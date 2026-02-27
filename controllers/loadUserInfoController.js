const db = require('../database/connection.js');
const { getUserId } = require('../database/dbHelpers.js');

const handleLoadUserInfo = async (req, res) => {
    const { username } = req.body;

    try {
        const userId = await getUserId(username);
        
        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [userStadiums] = await db.execute(`
            SELECT 
                MAX(us.added_on) AS added_on, 
                us.stadium_id, 
                s.stadium_name, 
                s.city, 
                s.state, 
                s.image,
                1 AS visited,
                CASE WHEN w.stadium_id IS NOT NULL THEN 1 ELSE 0 END AS wishlist
            FROM user_stadiums us
            JOIN stadiums s ON us.stadium_id = s.stadium_id
            LEFT JOIN user_wishlist_stadiums w ON w.stadium_id = us.stadium_id AND w.user_id = ?
            WHERE us.user_id = ?
            GROUP BY us.stadium_id, s.stadium_name, s.city, s.state, s.image
            ORDER BY MAX(us.added_on) DESC
            LIMIT 2
        `, [userId, userId]);

        const [userInfo] = await db.execute('SELECT COUNT(DISTINCT user_stadiums.stadium_id) AS numStadiumsVisited, COUNT(DISTINCT stadiums.country_id) AS numCountriesVisited, COUNT(CASE WHEN user_stadiums.visited_on IS NOT NULL THEN user_stadiums.stadium_id END) AS numEventsAttended FROM user_stadiums JOIN stadiums ON user_stadiums.stadium_id = stadiums.stadium_id WHERE user_stadiums.user_id = ?', [userId]);

        const { numStadiumsVisited, numCountriesVisited, numEventsAttended } = userInfo[0];

        const [wishlistItems] = await db.execute(`
            SELECT 
                uw.added_on, 
                uw.stadium_id, 
                s.stadium_name, 
                s.city, 
                s.state, 
                s.image,
                1 AS wishlist,
                CASE WHEN v.stadium_id IS NOT NULL THEN 1 ELSE 0 END AS visited
            FROM user_wishlist_stadiums uw
            JOIN stadiums s ON uw.stadium_id = s.stadium_id
            LEFT JOIN user_stadiums v ON v.stadium_id = uw.stadium_id AND v.user_id = ?
            WHERE uw.user_id = ?
            ORDER BY uw.added_on DESC
            LIMIT 2
        `, [userId, userId]);

        const [userAchievements] = await db.execute('SELECT a.achievement_name, a.achievement_image, a.achievement_description, ua.unlocked_on FROM achievements a LEFT JOIN user_achievements ua ON a.achievement_id = ua.achievement_id AND ua.user_id = ? WHERE ua.unlocked_on IS NOT NULL ORDER BY (ua.unlocked IS NOT TRUE) ASC, ua.unlocked_on DESC LIMIT 3', [userId]);

        res.json({ userStadiums, numStadiumsVisited, numCountriesVisited, numEventsAttended, wishlistItems, userAchievements });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadUserInfo };