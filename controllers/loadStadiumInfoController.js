const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const handleLoadStadiumInfo = async (req, res) => {
    const { name, username } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Stadium name is required' });
    }

    try {
        const [stadium] = await db.execute('SELECT stadium_name, city, state, image, capacity, opened_date, construction_cost, visits, ROUND(AVG(latest_ratings.rating), 2) AS average_rating, team_name, league_name FROM stadiums JOIN teams ON stadiums.stadium_id = teams.stadium_id JOIN leagues ON teams.league_id = leagues.league_id LEFT JOIN (SELECT us1.stadium_id, us1.user_id, us1.rating FROM user_stadiums us1 INNER JOIN (SELECT user_id, stadium_id, MAX(rated_on) AS max_time FROM user_stadiums GROUP BY user_id, stadium_id) us2 ON us1.user_id = us2.user_id  AND us1.stadium_id = us2.stadium_id AND us1.rated_on = us2.max_time) latest_ratings ON stadiums.stadium_id = latest_ratings.stadium_id WHERE stadiums.stadium_name = ? GROUP BY teams.team_id', [name]);

        const [userActivity] = await db.execute('SELECT s.stadium_name, u.username, us.visited_on, us.rating, us.rated_on, us.review_id, COALESCE(likes.liked_count, 0) AS liked_count FROM user_stadiums us JOIN users u ON us.user_id = u.user_id JOIN stadiums s ON us.stadium_id = s.stadium_id LEFT JOIN (SELECT sl.user_id, sl.stadium_id, COUNT(*) AS liked_count FROM stadium_likes sl GROUP BY sl.user_id, sl.stadium_id) likes ON likes.user_id = u.user_id AND likes.stadium_id = s.stadium_id WHERE s.stadium_name = ? AND u.username = ? ORDER BY us.rated_on DESC', [name, username]);

        const [friendActivity] = await db.execute('SELECT username, rating, rated_on FROM user_followers JOIN user_stadiums ON user_followers.user_id = user_stadiums.user_id JOIN stadiums ON user_stadiums.stadium_id = stadiums.stadium_id JOIN users ON user_followers.user_id = users.user_id WHERE user_follower_id = (SELECT user_id FROM users WHERE username = ?) AND stadium_name = ? ORDER BY rating DESC, rated_on DESC', [username, name]);

        const [friendReviews] = await db.execute('SELECT username, user_stadiums.rating, rated_on, review, like_count FROM user_followers JOIN user_stadiums ON user_followers.user_id = user_stadiums.user_id JOIN stadiums ON user_stadiums.stadium_id = stadiums.stadium_id JOIN users ON user_followers.user_id = users.user_id JOIN stadium_reviews on user_stadiums.review_id = stadium_reviews.review_id WHERE user_follower_id = (SELECT user_id FROM users WHERE username = ?) AND stadium_name = ? ORDER BY like_count DESC, rated_on DESC', [username, name]);

        const [popularReviews] = await db.execute('SELECT username, review, rating, like_count FROM stadium_reviews JOIN users on stadium_reviews.user_id = users.user_id JOIN stadiums on stadium_reviews.stadium_id = stadiums.stadium_id WHERE stadiums.stadium_name = ? ORDER BY like_count desc, reviewed_on desc LIMIT 3', [name]);

        const [recentReviews] = await db.execute('SELECT username, review, rating, like_count, reviewed_on FROM stadium_reviews JOIN users on stadium_reviews.user_id = users.user_id JOIN stadiums on stadium_reviews.stadium_id = stadiums.stadium_id WHERE stadiums.stadium_name = ? ORDER BY reviewed_on desc, reviewed_on desc LIMIT 3', [name]);
          
        if (stadium.length === 0) {
            return res.status(404).json({ error: 'Error loading stadium info' });
        }

        const stadiumInfo = {
            stadium: {
                name: stadium[0].stadium_name,
                city: stadium[0].city,
                state: stadium[0].state,
                image: stadium[0].image,
                capacity: stadium[0].capacity,
                openedDate: stadium[0].opened_date,
                constructionCost: stadium[0].construction_cost,
                visits: stadium[0].visits,
                averageRating: stadium[0].average_rating ?? 0.0
            },
            userActivity: userActivity.map(({ stadium_name, username, visited_on, rating, rated_on, review_id, liked_count }) => ({
                stadium_name, 
                username, 
                visited_on, 
                rating, 
                rated_on, 
                review_id,
                liked_count
            })),
            friendActivity: friendActivity,
            friend_reviews: friendReviews,
            teams: stadium.map(({ team_name, league_name }) => ({
                team_name,
                league: league_name
            })),
            popular_reviews: popularReviews.map(({ username, review, rating, like_count }) => ({
                username,
                review, 
                rating,
                like_count
            })),
            recent_reviews: recentReviews.map(({ username, review, rating, like_count, reviewed_on }) => ({
                username,
                review,
                rating,
                like_count,
                reviewed_on
            }))
        };

        res.json({ stadiumInfo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadStadiumInfo };