const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'StadiumTrackr'
});

const handleRemoveStadium = async (req, res) => {
    const { stadiumName, username } = req.body;

    if (!stadiumName || !username) {
        return res.status(400).json({ error: 'Stadium name and username are required' });
    }

    try {
        const [result] = await db.execute('delete from user_stadiums where stadium_id = (select stadium_id from stadiums where stadium_name = ?) and user_id = (select user_id from users where username = ?)', [stadiumName, username]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Could not remove stadium' });
        }

        res.json({ message: 'Stadium removed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleRemoveStadium };