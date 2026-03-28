const db = require('../database/connection.js');
const { getUserId } = require('../database/dbHelpers.js');

const handleUpdateUsername = async (req, res) => {
    const { username, newUsername } = req.body;

    try {
        const [[existingUser]] = await db.execute('SELECT user_id FROM users WHERE username = ?', [newUsername]);

        if (existingUser) {
            return res.status(409).json({ error: 'Username is taken' });
        }

        if (username === newUsername) {
            return res.status(409).json({ error: 'New username must be different from current username' });
        }

        const userId = await getUserId(username);

        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [result] = await db.query('UPDATE users SET username = ? WHERE user_id = ?', [newUsername, userId]);

        res.json({ result });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { handleUpdateUsername };