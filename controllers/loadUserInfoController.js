const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const handleLoadUserInfo = async (req, res) => {
    const { username } = req.body;

    try {
        const [userStadiums] = await db.execute('SELECT MAX(added_on) AS added_on, stadium_name, city, state, image FROM user_stadiums JOIN stadiums ON user_stadiums.stadium_id = stadiums.stadium_id WHERE user_id = (SELECT user_id FROM users WHERE username = ?) GROUP BY stadium_name, city, state, image ORDER BY added_on DESC', [username]);

        const [userInfo] = await db.execute('SELECT COUNT(DISTINCT user_stadiums.stadium_id) AS numStadiumsVisited, COUNT(DISTINCT stadiums.country_id) AS numCountriesVisited, COUNT(CASE WHEN user_stadiums.visited_on IS NOT NULL THEN user_stadiums.stadium_id END) AS numEventsAttended FROM user_stadiums JOIN stadiums ON user_stadiums.stadium_id = stadiums.stadium_id JOIN users ON user_stadiums.user_id = users.user_id WHERE users.username = ?', [username]);

        const { numStadiumsVisited, numCountriesVisited, numEventsAttended } = userInfo[0];

        const [wishlistItems] = await db.execute('select added_on, stadium_name, city, state, image from user_wishlist_stadiums join stadiums on user_wishlist_stadiums.stadium_id = stadiums.stadium_id where user_id = (select user_id from users where username = ?) order by added_on desc', [username]);

        res.json({ userStadiums, numStadiumsVisited, numCountriesVisited, numEventsAttended, wishlistItems });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadUserInfo };