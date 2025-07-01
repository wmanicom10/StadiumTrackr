const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const handleAddStadium = async (req, res) => {
    const { username, stadiumName, visitedOn, userReview, userRating, userLiked } = req.body;

    if (userLiked) {
        await db.execute('INSERT INTO stadium_likes (stadium_id, user_id, liked_on) VALUES ((SELECT stadium_id FROM stadiums WHERE stadium_name = ?), (SELECT user_id FROM users WHERE username = ?), now())', [stadiumName, username])
    }

    if (userReview !== null) {
        const [addReview] = await db.execute('INSERT INTO stadium_reviews (user_id, stadium_id, review, rating, reviewed_on, like_count) VALUES ((SELECT user_id FROM users WHERE username = ?), (SELECT stadium_id FROM stadiums WHERE stadium_name = ?), ?, ?, NOW(), 0)', [username, stadiumName, userReview, userRating]);

        const [addStadium] = await db.execute('INSERT INTO user_stadiums (stadium_id, user_id, visited_on, rating, rated_on, review_id) VALUES ((SELECT stadium_id FROM stadiums WHERE stadium_name = ?), (SELECT user_id FROM users WHERE username = ?), ?, ?, now(), (SELECT review_id FROM stadium_reviews WHERE user_id = (SELECT user_id FROM users WHERE username = ?) AND stadium_id = (SELECT stadium_id FROM stadiums WHERE stadium_name = ?) ORDER BY reviewed_on DESC LIMIT 1))', [stadiumName, username, visitedOn, userRating, username, stadiumName]);

        res.json({ addReview, addStadium });
    }
    else {
        const [addStadium] = await db.execute('INSERT INTO user_stadiums (stadium_id, user_id, visited_on, rating, rated_on, review_id) VALUES ((SELECT stadium_id FROM stadiums WHERE stadium_name = ?), (SELECT user_id FROM users WHERE username = ?), now(), ?, now(), null)', [stadiumName, username, userRating]);

        res.json({ addStadium });
    }
};

module.exports = { handleAddStadium };