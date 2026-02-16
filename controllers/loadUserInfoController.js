const db = require('../database/connection.js');
const { getUserId } = require('../database/dbHelpers.js');

const handleLoadUserInfo = async (req, res) => {
    const { username } = req.body;

    try {
        const userId = await getUserId(username);
        
        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [userStadiums] = await db.execute('SELECT MAX(added_on) AS added_on, stadium_name, city, state, image FROM user_stadiums JOIN stadiums ON user_stadiums.stadium_id = stadiums.stadium_id WHERE user_id = ? GROUP BY stadium_name, city, state, image ORDER BY added_on DESC', [userId]);

        const [userInfo] = await db.execute('SELECT COUNT(DISTINCT user_stadiums.stadium_id) AS numStadiumsVisited, COUNT(DISTINCT stadiums.country_id) AS numCountriesVisited, COUNT(CASE WHEN user_stadiums.visited_on IS NOT NULL THEN user_stadiums.stadium_id END) AS numEventsAttended FROM user_stadiums JOIN stadiums ON user_stadiums.stadium_id = stadiums.stadium_id WHERE user_stadiums.user_id = ?', [userId]);

        const { numStadiumsVisited, numCountriesVisited, numEventsAttended } = userInfo[0];

        const [wishlistItems] = await db.execute('SELECT added_on, stadium_name, city, state, image FROM user_wishlist_stadiums JOIN stadiums ON user_wishlist_stadiums.stadium_id = stadiums.stadium_id WHERE user_id = ? ORDER BY added_on DESC', [userId]);

        const [userAchievements] = await db.execute('SELECT a.achievement_name, a.achievement_image, a.achievement_description, ua.unlocked_on FROM achievements a LEFT JOIN user_achievements ua ON a.achievement_id = ua.achievement_id AND ua.user_id = ? WHERE ua.unlocked_on IS NOT NULL ORDER BY (ua.unlocked IS NOT TRUE) ASC, ua.unlocked_on DESC LIMIT 3', [userId]);

        res.json({ userStadiums, numStadiumsVisited, numCountriesVisited, numEventsAttended, wishlistItems, userAchievements });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadUserInfo };