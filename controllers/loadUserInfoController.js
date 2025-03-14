const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'StadiumTrackr'
});

const handleLoadUserInfo = async (req, res) => {
    const { username } = req.body;

    try {
        const [userInfo] = await db.execute('SELECT COUNT(DISTINCT user_stadiums.stadium_id) AS numStadiumsVisited, COUNT(DISTINCT stadiums.country_id) AS numCountriesVisited, COUNT(user_stadiums.stadium_id) AS numEventsAttended FROM user_stadiums JOIN stadiums ON user_stadiums.stadium_id = stadiums.stadium_id JOIN users ON user_stadiums.user_id = users.user_id WHERE users.username = ?', [username]);

        const { numStadiumsVisited, numCountriesVisited, numEventsAttended } = userInfo[0];

        const [wishlistItems] = await db.execute('select * from user_wishlists join stadiums on user_wishlists.stadium_id = stadiums.stadium_id where user_id = (select user_id from users where username = ?)', [username]);

        res.json({ numStadiumsVisited, numCountriesVisited, numEventsAttended, wishlistItems });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadUserInfo };