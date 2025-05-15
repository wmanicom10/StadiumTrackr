const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const handleLoadUserInfo = async (req, res) => {
    const { username } = req.body;

    try {
        const [userInfo] = await db.execute('select count(distinct user_stadiums.stadium_id) as numStadiumsVisited, count(distinct stadiums.country_id) as numCountriesVisited, count(user_stadiums.stadium_id) as numEventsAttended from user_stadiums join stadiums on user_stadiums.stadium_id = stadiums.stadium_id join users on user_stadiums.user_id = users.user_id where users.username = ?', [username]);

        const { numStadiumsVisited, numCountriesVisited, numEventsAttended } = userInfo[0];

        const [favoriteStadiums] = await db.execute('select * from user_favorite_stadiums join stadiums on user_favorite_stadiums.stadium_id = stadiums.stadium_id where user_id = (select user_id from users where username = ?) order by date_added desc', [username]);

        const [wishlistItems] = await db.execute('select * from user_wishlist_stadiums join stadiums on user_wishlist_stadiums.stadium_id = stadiums.stadium_id where user_id = (select user_id from users where username = ?) order by date_added desc', [username]);

        const [recentStadiumsVisited] = await db.execute('select * from user_stadiums join stadiums on user_stadiums.stadium_id = stadiums.stadium_id where user_id = (select user_id from users where username = ?) order by rated_on desc limit 2', [username]);

        res.json({ numStadiumsVisited, numCountriesVisited, numEventsAttended, favoriteStadiums, wishlistItems, recentStadiumsVisited });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadUserInfo };