const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'StadiumTrackr'
});

const handleAddStadium = async (req, res) => {
    const { username, name, date, rating } = req.body;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const [[stadium]] = await connection.execute(
            'SELECT stadium_id FROM stadiums WHERE stadium_name = ?',
            [name]
        );
        const [[user]] = await connection.execute(
            'SELECT user_id FROM users WHERE username = ?',
            [username]
        );

        if (!stadium || !user) {
            await connection.rollback();
            return res.status(400).json({ error: 'Invalid stadium or user' });
        }

        const [insertResult] = await connection.execute(
            `INSERT INTO user_stadiums (stadium_id, user_id, visited_on, rating, rated_on) 
             VALUES (?, ?, ?, ?, NOW())`,
            [stadium.stadium_id, user.user_id, date, rating]
        );

        const [updateResult] = await connection.execute(
            'UPDATE stadiums SET visits = visits + 1 WHERE stadium_id = ?',
            [stadium.stadium_id]
        );

        if (insertResult.affectedRows > 0 && updateResult.affectedRows > 0) {
            await connection.commit();
            return res.json({ message: 'Stadium added successfully' });
        } else {
            await connection.rollback();
            return res.status(500).json({ error: 'Failed to add stadium' });
        }
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
};

module.exports = { handleAddStadium };
