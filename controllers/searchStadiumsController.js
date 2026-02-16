const db = require('../database/connection.js');

const handleSearchStadiums = async (req, res) => {
    const { name } = req.body;

    try {
        const [stadiums] = await db.execute('select stadium_name, image from stadiums where stadium_name like ?', [`${name}%`]);

        res.json({ stadiums });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleSearchStadiums };