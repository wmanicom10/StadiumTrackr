const db = require('../database/connection.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
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
let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
    }
});

async function sendWelcomeEmail(to, username = '') {
    const displayName = username || 'User';
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Welcome to StadiumTrackr</h2>
            <p>Hello ${displayName},</p>
            <p>Welcome aboard! Your account has been successfully created and you can now log in to start using StadiumTrackr.</p>
            <p style="text-align: center;">
                <a href="${process.env.APP_URL}" 
                style="background-color: #28a745; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to StadiumTrackr</a>
            </p>
            <p>If the button above doesn’t work, copy and paste this URL into your browser:</p>
            <p><a href="${process.env.APP_URL}">${process.env.APP_URL}</a></p>
            <hr>
            <p style="font-size: 12px; color: #666;">If you didn’t sign up for this account, you can safely ignore this email.</p>
        </div>
    `;
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: `Welcome to StadiumTrackr, ${displayName}`,
        text: `Hello ${displayName}, welcome to StadiumTrackr! Visit: ${process.env.APP_URL}`,
        html: htmlContent
    });
}

const handleSignup = async (req, res) => {
    const { email, username, password, captchaToken } = req.body;

    if (!email || !username || !password || !captchaToken) {
        return res.status(400).json({ error: 'Please fill in all fields' });
    }

    try {
        const verifyRes = await fetch(`https://captcha.stadiumtrackr.com/${process.env.CAP_KEY_ID}/siteverify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: process.env.CAP_SECRET_KEY,
                response: captchaToken
            })
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.success) {
            return res.status(403).json({ error: 'Captcha verification failed' });
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

        try {
            await sendWelcomeEmail(email, username);
        } catch (emailError) {
            console.error(emailError);
        }

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