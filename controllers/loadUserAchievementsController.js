const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const handleLoadUserAchievements = async (req, res) => {
    const { username, earned, sortBy } = req.body;
    try {
        let query = `
            SELECT DISTINCT 
                achievements.achievement_id,
                achievements.achievement_name, 
                achievements.achievement_description,
                achievements.achievement_image,
                achievements.progress_goal, 
                user_achievements.progress_value,
                user_achievements.unlocked,
                user_achievements.unlocked_on
            FROM achievements
            LEFT JOIN user_achievements ON user_achievements.achievement_id = achievements.achievement_id
                AND user_achievements.user_id = (SELECT user_id FROM users WHERE username = ?)
        `;
        
        const params = [username];
        
        // Build WHERE clause for filtering
        let whereConditions = [];
        
        if (earned === 'earned') {
            whereConditions.push('user_achievements.unlocked = TRUE');
        } else if (earned === 'not-earned') {
            whereConditions.push('(user_achievements.unlocked = FALSE OR user_achievements.unlocked IS NULL)');
        }
        
        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }
        
        switch (sortBy) {
            case 'name-desc':
                query += ` ORDER BY achievements.achievement_name DESC`;
                break;
            case 'name-asc':
                query += ` ORDER BY achievements.achievement_name ASC`;
                break;
            case 'progress':
                query += ` ORDER BY COALESCE(user_achievements.progress_value, 0) / achievements.progress_goal DESC, achievements.achievement_id ASC`;
                break;
            case 'earned-asc':
                query += ` ORDER BY (user_achievements.unlocked IS NOT TRUE) ASC, user_achievements.unlocked_on ASC, achievements.achievement_id ASC`;
                break;
            case 'earned-desc':
                query += ` ORDER BY user_achievements.unlocked_on DESC, achievements.achievement_id ASC`;
                break;
            default:
                query += ` ORDER BY achievements.achievement_name ASC`;
        }
        
        const [userAchievements] = await db.query(query, params);
        res.json({ userAchievements });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadUserAchievements };