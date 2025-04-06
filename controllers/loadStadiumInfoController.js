const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'StadiumTrackr'
});

const handleLoadStadiumInfo = async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Stadium name is required' });
    }

    try {
        const [rows] = await db.execute('SELECT stadiums.*, ROUND(AVG(user_stadiums.rating), 2) AS average_rating, teams.team_id, teams.team_name, leagues.league_name FROM stadiums JOIN teams ON stadiums.stadium_id = teams.stadium_id JOIN leagues ON teams.league_id = leagues.league_id LEFT JOIN user_stadiums ON stadiums.stadium_id = user_stadiums.stadium_id WHERE stadiums.stadium_name = ? GROUP BY stadiums.stadium_id, teams.team_id, leagues.league_id', [name]);
          
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Could not find stadium' });
        }
          
        const {
            stadium_name, location, capacity, image, opened_date, 
            construction_cost, visits, average_rating
        } = rows[0];

        const stadiumInfo = {
            stadium: {
                name: stadium_name,
                location,
                capacity,
                image,
                openedDate: opened_date,
                constructionCost: construction_cost,
                visits,
                averageRating: average_rating || 0.0
            },
            teams: rows.map(row => ({
                team_id: row.team_id,
                team_name: row.team_name,
                league: row.league_name
            }))
        };
          
        res.json({ stadiumInfo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadStadiumInfo };