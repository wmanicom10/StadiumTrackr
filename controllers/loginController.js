const db = require('../database/connection.js');
const bcrypt = require('bcryptjs');

const handleLogin = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Please fill in all fields' });
    }

    try {
        const [[user]] = await db.execute(
            'SELECT user_id, username, password, email, profile_pic FROM users WHERE username = ?',
            [username]
        );

        if (!user) {
            return res.status(401).json({ error: 'Incorrect username or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Incorrect username or password' });
        }

        res.json({ 
            message: 'Login successful', 
            user_id: user.user_id, 
            username: user.username, 
            email: user.email,
            profile_pic: user.profile_pic 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLogin };