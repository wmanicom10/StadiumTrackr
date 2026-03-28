const db = require('../database/connection.js');
const bcrypt = require('bcryptjs');

const handleDeleteAccount = async (req, res) => {
    const { username, password } = req.body;

    try {
        const [[user]] = await db.execute('SELECT user_id, password FROM users WHERE username = ?', [username]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        const [result] = await db.query('DELETE FROM users WHERE user_id = ?', [user.user_id]);

        res.json({ result });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { handleDeleteAccount };