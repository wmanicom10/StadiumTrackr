const express = require('express');
const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'StadiumTrackr'
});

const router = express.Router();

router.post('/loadStadiumInfo', async (req, res) => {
    const { name } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Stadium name is required' });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM stadiums JOIN teams ON stadiums.stadium_id = teams.stadium_id WHERE stadiums.stadium_name = ?', [name]);
          
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Could not find stadium' });
        }
          
        const stadiumInfo = {
            stadium: {
                id: rows[0].stadium_id,
                name: rows[0].stadium_name,
                location: rows[0].location,
                capacity: rows[0].capacity,
                image: rows[0].image,
                openedDate: rows[0].opened_date,
                constructionCost: rows[0].construction_cost
            },
            teams: rows.map(row => ({
                team_id: row.team_id,
                team_name: row.team_name,
                league: row.league
            }))
        };
          
        res.json({ stadiumInfo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
