const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const handleSignup = async (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ error: 'Please fill in all fields' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*]/.test(password)) {
        return res.status(400).json({
            error: 'Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.'
        });
    }

    try {
        const [[existingUser]] = await db.execute(
            'SELECT username FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser) {
            return res.status(409).json({ error: 'Username or email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await db.execute(
            'INSERT INTO users (username, password, email, created_on) VALUES (?, ?, ?, now())',
            [username, hashedPassword, email]
        );

        res.json({ message: 'Account created successfully' });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleSignup };