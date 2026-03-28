const db = require('../database/connection.js');
const { getUserId } = require('../database/dbHelpers.js');

const handleUpdateEmail = async (req, res) => {
    const { username, newEmail } = req.body;

    try {
        const [[existingUser]] = await db.execute('SELECT user_id FROM users WHERE email = ?', [newEmail]);

        if (existingUser) {
            return res.status(409).json({ error: 'Email already in use' });
        }

        const userId = await getUserId(username);

        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [[currentEmail]] = await db.execute('SELECT email FROM users WHERE user_id = ?', [userId]);
        
        if (currentEmail.email === newEmail) {
            return res.status(409).json({ error: 'New email must be different from current email' });
        }

        const [result] = await db.query('UPDATE users SET email = ? WHERE user_id = ?', [newEmail, userId]);

        res.json({ result });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { handleUpdateEmail };