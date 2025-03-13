const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'StadiumTrackr'
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Please fill in all fields' });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Incorrect username or password' });
        }

        const user = rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Incorrect username or password' });
        }

        res.json({ username: user.username });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/signup', async (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ error: 'Please fill in all fields' });
    }

    try {
        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        const [result] = await db.execute('INSERT INTO users (email, username, password, created_at) VALUES (?, ?, ?, now())', [email, username, hashedPassword]);

        res.json({ message: 'Account created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
