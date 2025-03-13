const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'StadiumTrackr'
});

const handleAddStadium = async (req, res) => {
    const { username, name, date, rating } = req.body;

    try {
        const [result] = await db.execute('INSERT INTO user_stadiums (stadium_id, user_id, visited_on, rating, rated_on) VALUES ((SELECT stadium_id FROM stadiums WHERE stadium_name = ?), (SELECT user_id FROM users WHERE username = ?), ?, ?, now())', [name, username, date, rating])

        if (result.affectedRows > 0) {
            res.json({ message: 'Stadium added successfully' });
        }
        else {
            res.json({ message: 'Error adding stadium' });
        }
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleAddStadium };