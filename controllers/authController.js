const db = require('../database/connection.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const PROFILE_PIC_DIR = process.env.PROFILE_PIC_DIR;

/*  deleteAccount  */
const handleDeleteAccount = async (req, res) => {
    const { password } = req.body;
    const { userId } = req.user;
    
    try {
        const [[user]] = await db.execute('SELECT password, profile_pic FROM users WHERE user_id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Incorrect password' });
        }
        if (user.profile_pic && !user.profile_pic.includes('default.png')) {
            const fullPath = path.join(PROFILE_PIC_DIR, path.basename(user.profile_pic));
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }

        const [result] = await db.query('DELETE FROM users WHERE user_id = ?', [userId]);
        
        res.json({ result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  login  */
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

        const token = jwt.sign(
            { userId: user.user_id, username: user.username, email: user.email, profilePic: user.profile_pic },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  signup */
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

        const [result] = await db.execute(
            'INSERT INTO users (username, password, email, created_on, profile_pic) VALUES (?, ?, ?, now(), "default.png")',
            [username, hashedPassword, email]
        );

        const token = jwt.sign(
            { userId: result.insertId, username, email, profilePic: 'default.png' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleDeleteAccount, handleLogin, handleSignup };