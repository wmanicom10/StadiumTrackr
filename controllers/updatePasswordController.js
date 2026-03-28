const db = require('../database/connection.js');
const bcrypt = require('bcryptjs');

const handleUpdatePassword = async (req, res) => {
    const { username, currentPassword, newPassword } = req.body;

    try {
        const [[user]] = await db.execute('SELECT user_id, password FROM users WHERE username = ?', [username]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        const [result] = await db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashedPassword, user.user_id]);

        res.json({ result });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { handleUpdatePassword };