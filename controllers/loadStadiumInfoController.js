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
        const [stadium] = await db.execute('SELECT s.stadium_name, s.city, s.state, s.image, s.capacity, s.opened_date, s.construction_cost, s.visits, t.team_name, l.league_name FROM stadiums s JOIN teams t ON s.stadium_id = t.stadium_id JOIN leagues l ON t.league_id = l.league_id WHERE s.stadium_name = ?', [name]);

        const [userVisited] = await db.execute('SELECT username, added_on FROM user_stadiums JOIN users ON user_stadiums.user_id = users.user_id WHERE stadium_id = (SELECT stadium_id FROM stadiums WHERE stadium_name = ?) AND user_stadiums.user_id = (SELECT user_id FROM users WHERE username = ?)', [name, username]);

        const [userWishlist] = await db.execute('SELECT username, added_on FROM user_wishlist_stadiums JOIN users ON user_wishlist_stadiums.user_id = users.user_id WHERE stadium_id = (SELECT stadium_id FROM stadiums WHERE stadium_name = ?) AND user_wishlist_stadiums.user_id = (SELECT user_id FROM users WHERE username = ?)', [name, username]);
          
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
            },
            teams: stadium.map(({ team_name, league_name }) => ({
                team_name,
                league: league_name
            })),
            userVisited: userVisited,
            userWishlist: userWishlist
        };

        res.json({ stadiumInfo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadStadiumInfo };