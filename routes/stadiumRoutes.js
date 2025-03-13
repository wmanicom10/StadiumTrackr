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
        const [rows] = await db.execute('SELECT * FROM stadiums WHERE name = ?', [name]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Could not find stadium' });
        }

        const stadium = rows[0];
        res.json({ stadiumInfo: stadium });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
