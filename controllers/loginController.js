const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const handleLogin = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Please fill in all fields' });
    }

    try {
        const [[user]] = await db.execute(
            'SELECT username, password FROM users WHERE username = ?',
            [username]
        );

        if (!user) {
            return res.status(401).json({ error: 'Incorrect username or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Incorrect username or password' });
        }

        res.json({ message: 'Login successful', username: user.username });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLogin };
