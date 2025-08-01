const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const handleLoadUserStadiums = async (req, res) => {
    const { username, league, sortType } = req.body;

    try {
        let orderByClause;
        switch (sortType) {
            case 'stadiumName':
                orderByClause = 'ORDER BY stadium_name ASC';
                break;
            case 'stadiumPopularity':
                orderByClause = 'ORDER BY visits DESC, added_on DESC';
                break;
            case 'whenAddedNewest':
                orderByClause = 'ORDER BY added_on DESC';
                break;
            case 'whenAddedEarliest':
                orderByClause = 'ORDER BY added_on ASC';
                break;
            case 'dateVisitedNewest':
                orderByClause = 'ORDER BY visited_on DESC, added_on DESC';
                break;
            case 'dateVisitedEarliest':
                orderByClause = 'ORDER BY CASE WHEN visited_on IS NULL THEN 1 ELSE 0 END, visited_on ASC, added_on DESC';
                break;
            default:
                return res.status(400).json({ error: 'Invalid sort type' });
        }

        const baseSelect = `WITH ranked_stadiums AS (SELECT stadiums.stadium_name, stadiums.city, stadiums.state, stadiums.image, user_stadiums.visited_on, user_stadiums.added_on, ${sortType === 'stadiumPopularity' ? 'stadiums.visits,' : ''} ROW_NUMBER() OVER (PARTITION BY stadiums.stadium_name ORDER BY user_stadiums.added_on DESC) AS rn FROM user_stadiums JOIN stadiums ON user_stadiums.stadium_id = stadiums.stadium_id ${league !== 'any' ? `JOIN teams ON stadiums.stadium_id = teams.stadium_id JOIN leagues ON teams.league_id = leagues.league_id` : ''} WHERE user_stadiums.user_id = (SELECT user_id FROM users WHERE username = ?) ${league !== 'any' ? `AND leagues.league_id = (SELECT league_id FROM leagues WHERE league_name = ?)` : ''}) SELECT stadium_name, city, state, image, visited_on, added_on ${sortType === 'stadiumPopularity' ? ', visits' : ''} FROM ranked_stadiums WHERE rn = 1 ${orderByClause}`;

        const queryParams = league === 'any' ? [username] : [username, league];
        const [userStadiums] = await db.execute(baseSelect, queryParams);

        res.json({ userStadiums });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadUserStadiums };