const db = require('../database/connection.js');
const { getUserId } = require('../database/dbHelpers.js');

const handleLoadStadiumInfo = async (req, res) => {
    const { id, username } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Stadium id is required' });
    }

    try {
        const userId = username ? await getUserId(username) : null;

        const [stadium] = await db.execute('SELECT s.stadium_id, s.stadium_name, s.city, s.state, s.image, s.capacity, s.opened_date, s.construction_cost, t.team_name, l.league_name FROM stadiums s JOIN teams t ON s.stadium_id = t.stadium_id JOIN leagues l ON t.league_id = l.league_id WHERE s.stadium_id = ?', [id]);

        const [visits] = await db.execute('SELECT COUNT(DISTINCT user_id) as visits FROM user_stadiums WHERE stadium_id = ?', [id]);

        const [userVisited] = userId ? await db.execute('SELECT username, added_on, visited_on FROM user_stadiums JOIN users ON user_stadiums.user_id = users.user_id WHERE stadium_id = ? AND user_stadiums.user_id = ?', [id, userId]) : [[]];

        const [userWishlist] = userId ? await db.execute('SELECT username, added_on FROM user_wishlist_stadiums JOIN users ON user_wishlist_stadiums.user_id = users.user_id WHERE stadium_id = ? AND user_wishlist_stadiums.user_id = ?', [id, userId]) : [[]];
          
        if (stadium.length === 0) {
            return res.status(404).json({ error: 'Error loading stadium info' });
        }

        const stadiumInfo = {
            stadium: {
                id: stadium[0].stadium_id,
                name: stadium[0].stadium_name,
                city: stadium[0].city,
                state: stadium[0].state,
                image: stadium[0].image,
                capacity: stadium[0].capacity,
                openedDate: stadium[0].opened_date,
                constructionCost: stadium[0].construction_cost,
                visits: visits[0].visits,
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