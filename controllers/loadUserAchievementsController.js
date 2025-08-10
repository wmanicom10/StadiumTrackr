const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const handleLoadUserAchievements = async (req, res) => {
    const { username, earned, sortType } = req.body;

    try {
        let baseQuery = `SELECT a.achievement_id, a.achievement_name, a.achievement_description, a.achievement_image, a.progress_goal, ua.progress_value, ua.unlocked, ua.unlocked_on FROM achievements a LEFT JOIN user_achievements ua ON a.achievement_id = ua.achievement_id AND ua.user_id = (SELECT user_id FROM users WHERE username = ?)`;

        if (earned === 'Earned') {
            baseQuery += ' WHERE ua.unlocked = TRUE';
        } 
        else if (earned === 'Not Earned') {
            baseQuery += ' WHERE (ua.unlocked = FALSE OR ua.unlocked IS NULL)';
        } 

        switch (sortType) {
            case 'achievementName':
                baseQuery += ' ORDER BY a.achievement_name ASC';
                break;
            case 'achievementProgress':
                baseQuery += ' ORDER BY COALESCE(ua.progress_value, 0) / a.progress_goal DESC, a.achievement_id ASC';
                break;
            case 'achievementRarity':
                baseQuery += `ORDER BY (SELECT COUNT(*) FROM user_achievements ua2 WHERE ua2.achievement_id = a.achievement_id AND ua2.unlocked_on IS NOT NULL) ASC, a.achievement_id ASC`;
                break;
            case 'whenEarnedNewest':
                baseQuery += ' ORDER BY ua.unlocked_on DESC, a.achievement_id ASC';
                break;
            case 'whenEarnedEarliest':
                baseQuery += ' ORDER BY (ua.unlocked IS NOT TRUE) ASC, ua.unlocked_on ASC, a.achievement_id ASC';
                break;
            default:
                console.log('Invalid sort type');
        }

        const [userAchievements] = await db.execute(baseQuery, [username]);

        res.json({ userAchievements });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadUserAchievements };