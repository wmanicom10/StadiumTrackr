const db = require('../config/db.js');

const handleLoadLeagues = async (req, res) => {
    try {
        const [leagues] = await db.execute('select league_name from leagues');

        res.json({ leagues });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadLeagues };