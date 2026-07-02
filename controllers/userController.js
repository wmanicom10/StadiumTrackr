const db = require('../database/connection.js');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { getStadiumId, buildCountryFilter, buildLeagueFilter, buildSortOrder } = require('../database/dbHelpers.js');
const { handleUpdateAchievementProgress } = require('./updateController.js');

/*  addStadium  */
const handleAddStadium = async (req, res) => {
    const { stadiumId, dateVisited, note } = req.body;
    const { userId } = req.user;

    if (!userId || !stadiumId) {
        return res.status(400).json({ error: 'Stadium id and/or user id is required' });
    }

    try {
        const [rows] = await db.execute('INSERT INTO user_stadiums (stadium_id, user_id, added_on, visited_on, user_note) SELECT s.stadium_id, u.user_id, NOW(), ?, ? FROM stadiums s, users u WHERE s.stadium_id = ? AND u.user_id = ?', [dateVisited, note, stadiumId, userId]);

        await handleUpdateAchievementProgress(userId);

        await db.execute('DELETE FROM user_wishlist_stadiums WHERE stadium_id = ? AND user_id = ?', [stadiumId, userId]);

        res.json({ rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  loadFavoriteStadiums  */
const handleLoadFavoriteStadiums = async (req, res) => {
    const { userId } = req.user;

    if (!userId) return res.status(404).json({ error: 'User not found' });

    try {
        const [favoriteStadiums] = await db.query('SELECT stadiums.stadium_id, stadium_name, city, state, image, order_index FROM user_favorite_stadiums JOIN stadiums ON user_favorite_stadiums.stadium_id = stadiums.stadium_id WHERE user_id = ? ORDER BY order_index ASC', [userId]);

        res.json({ favoriteStadiums });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  loadUserAchievements  */
const handleLoadUserAchievements = async (req, res) => {
    const { earned, sortBy } = req.body;
    const { userId } = req.user;

    if (!userId) return res.status(404).json({ error: 'User not found' });

    try {
        let query = `
            SELECT DISTINCT 
                achievements.achievement_id,
                achievements.achievement_name, 
                achievements.achievement_description,
                achievements.achievement_image,
                achievements.progress_goal, 
                user_achievements.progress_value,
                user_achievements.unlocked,
                user_achievements.unlocked_on
            FROM achievements
            LEFT JOIN user_achievements ON user_achievements.achievement_id = achievements.achievement_id
                AND user_achievements.user_id = ?
        `;
        
        const params = [userId];
        let whereConditions = [];
        
        if (earned === 'earned') {
            whereConditions.push('user_achievements.unlocked = TRUE');
        } else if (earned === 'not-earned') {
            whereConditions.push('(user_achievements.unlocked = FALSE OR user_achievements.unlocked IS NULL)');
        }
        
        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }
        
        switch (sortBy) {
            case 'name-desc':
                query += ` ORDER BY achievements.achievement_name DESC`;
                break;
            case 'name-asc':
                query += ` ORDER BY achievements.achievement_name ASC`;
                break;
            case 'progress':
                query += ` ORDER BY COALESCE(user_achievements.progress_value, 0) / achievements.progress_goal DESC, achievements.achievement_id ASC`;
                break;
            case 'earned-asc':
                query += ` ORDER BY (user_achievements.unlocked IS NOT TRUE) ASC, user_achievements.unlocked_on ASC, achievements.achievement_id ASC`;
                break;
            case 'earned-desc':
                query += ` ORDER BY user_achievements.unlocked_on DESC, achievements.achievement_id ASC`;
                break;
            default:
                query += ` ORDER BY achievements.achievement_name ASC`;
        }

        const [userAchievements] = await db.query(query, params);
        res.json({ userAchievements });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  loadUserActivity  */
const handleLoadUserActivity = async (req, res) => {
    const { activity, id, sortBy, limit } = req.body;
    const { userId } = req.user;

    if (!userId) return res.status(404).json({ error: 'User not found' });

    try {
        let query = '';
        let params = [];

        if (activity === 'all' || activity === 'logged' || activity === 'visited') {
            query = `
                SELECT 
                    stadiums.stadium_id,
                    stadiums.stadium_name,
                    stadiums.image,
                    stadiums.city,
                    stadiums.state,
                    stadiums.country_id,
                    user_stadiums.visit_id,
                    user_stadiums.added_on,
                    user_stadiums.visited_on,
                    user_stadiums.user_note,
                    'stadium' as activity_type
                FROM user_stadiums
                JOIN stadiums ON user_stadiums.stadium_id = stadiums.stadium_id
                JOIN teams ON stadiums.stadium_id = teams.stadium_id
                WHERE user_stadiums.user_id = ?
            `;
            params.push(userId);

            if (id && id !== '') {
                query += ` AND stadiums.stadium_id = ?`;
                params.push(id);
            }

            if (activity === 'logged') {
                query += ` AND user_stadiums.visited_on IS NOT NULL`;
            } else if (activity === 'visited') {
                query += ` AND user_stadiums.visited_on IS NULL`;
            }

            query += ` GROUP BY stadiums.stadium_id, stadiums.stadium_name, stadiums.image,
                              stadiums.city, stadiums.state, stadiums.country_id,
                              user_stadiums.visit_id, user_stadiums.added_on, 
                              user_stadiums.visited_on, user_stadiums.user_note`;
        }

        if (activity === 'all' || activity === 'wishlist') {
            let wishlistQuery = `
                SELECT 
                    stadiums.stadium_id,
                    stadiums.stadium_name,
                    stadiums.image,
                    stadiums.city,
                    stadiums.state,
                    stadiums.country_id,
                    NULL as visit_id,
                    user_wishlist_stadiums.added_on,
                    NULL as visited_on,
                    NULL as user_note,
                    'wishlist' as activity_type
                FROM user_wishlist_stadiums
                JOIN stadiums ON user_wishlist_stadiums.stadium_id = stadiums.stadium_id
                JOIN teams ON stadiums.stadium_id = teams.stadium_id
                WHERE user_wishlist_stadiums.user_id = ?
            `;
            params.push(userId);

            if (id && id !== '') {
                wishlistQuery += ` AND stadiums.stadium_id = ?`;
                params.push(id);
            }

            wishlistQuery += ` GROUP BY stadiums.stadium_id, stadiums.stadium_name, stadiums.image,
                                       stadiums.city, stadiums.state, stadiums.country_id,
                                       user_wishlist_stadiums.added_on`;

            if (activity === 'all') {
                query = `(${query}) UNION ALL (${wishlistQuery})`;
            } else if (activity === 'wishlist') {
                query = wishlistQuery;
            }
        }

        query += buildSortOrder(sortBy, '', false, true);

        if (limit !== undefined) {
            query += ` LIMIT ?`;
            params.push(limit);
        }

        const [userActivity] = await db.query(query, params);
        res.json({ userActivity });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  loadUserHomeMap  */
const handleLoadUserHomeMap = async (req, res) => {
    const { userId } = req.user;

    if (!userId) return res.status(404).json({ error: 'User not found' });

    try {
        const [stadiums] = await db.execute('SELECT s.stadium_id, s.stadium_name, s.street_address, s.city, s.state, s.zip, s.image, s.latitude, s.longitude FROM stadiums s JOIN user_stadiums us ON s.stadium_id = us.stadium_id WHERE us.user_id = ?', [userId]);

        const formattedRows = stadiums.map(row => ({
            stadium_id: row.stadium_id,
            stadium_name: row.stadium_name,
            address: `${row.street_address}, ${row.city}, ${row.state} ${row.zip}`,
            location: [row.latitude, row.longitude],
            image: row.image
        }));

        res.json({ formattedRows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  loadUserInfo  */
const handleLoadUserInfo = async (req, res) => {
    const { userId } = req.user;

    if (!userId) return res.status(404).json({ error: 'User not found' });

    try {
        const [userStadiums] = await db.execute(`
            SELECT 
                MAX(us.added_on) AS added_on, 
                us.stadium_id, 
                s.stadium_name, 
                s.city, 
                s.state, 
                s.image,
                1 AS visited,
                CASE WHEN w.stadium_id IS NOT NULL THEN 1 ELSE 0 END AS wishlist
            FROM user_stadiums us
            JOIN stadiums s ON us.stadium_id = s.stadium_id
            LEFT JOIN user_wishlist_stadiums w ON w.stadium_id = us.stadium_id AND w.user_id = ?
            WHERE us.user_id = ?
            GROUP BY us.stadium_id, s.stadium_name, s.city, s.state, s.image
            ORDER BY MAX(us.added_on) DESC
            LIMIT 2
        `, [userId, userId]);

        const [userInfo] = await db.execute('SELECT COUNT(DISTINCT user_stadiums.stadium_id) AS numStadiumsVisited, COUNT(DISTINCT stadiums.country_id) AS numCountriesVisited, COUNT(CASE WHEN user_stadiums.visited_on IS NOT NULL THEN user_stadiums.stadium_id END) AS numEventsAttended FROM user_stadiums JOIN stadiums ON user_stadiums.stadium_id = stadiums.stadium_id WHERE user_stadiums.user_id = ?', [userId]);

        const { numStadiumsVisited, numCountriesVisited, numEventsAttended } = userInfo[0];

        const [wishlistItems] = await db.execute(`
            SELECT 
                MAX(uw.added_on) AS added_on, 
                uw.stadium_id, 
                s.stadium_name, 
                s.city, 
                s.state, 
                s.image,
                1 AS wishlist,
                CASE WHEN v.stadium_id IS NOT NULL THEN 1 ELSE 0 END AS visited
            FROM user_wishlist_stadiums uw
            JOIN stadiums s ON uw.stadium_id = s.stadium_id
            LEFT JOIN user_stadiums v ON v.stadium_id = uw.stadium_id AND v.user_id = ?
            WHERE uw.user_id = ?
            GROUP BY uw.stadium_id, s.stadium_name, s.city, s.state, s.image
            ORDER BY MAX(uw.added_on) DESC
            LIMIT 2
        `, [userId, userId]);

        const [userAchievements] = await db.execute('SELECT a.achievement_name, a.achievement_image, a.achievement_description, ua.unlocked_on FROM achievements a LEFT JOIN user_achievements ua ON a.achievement_id = ua.achievement_id AND ua.user_id = ? WHERE ua.unlocked_on IS NOT NULL ORDER BY (ua.unlocked IS NOT TRUE) ASC, ua.unlocked_on DESC LIMIT 3', [userId]);

        const [userFavoriteStadiums] = await db.execute('SELECT stadiums.stadium_id, stadium_name, city, state, image FROM user_favorite_stadiums JOIN stadiums ON user_favorite_stadiums.stadium_id = stadiums.stadium_id WHERE user_favorite_stadiums.user_id = ? ORDER BY user_favorite_stadiums.order_index ASC', [userId]);

        res.json({ userStadiums, numStadiumsVisited, numCountriesVisited, numEventsAttended, wishlistItems, userAchievements, userFavoriteStadiums });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  loadUserStadiums  */
const handleLoadUserStadiums = async (req, res) => {
    const { league, country, sortBy } = req.body;
    const { userId } = req.user;

    if (!userId) return res.status(404).json({ error: 'User not found' });

    try {
        const leagueFilter = buildLeagueFilter(league);
        const countryFilter = buildCountryFilter(country);

        let query = `
            SELECT 
                stadiums.stadium_id,
                stadiums.stadium_name, 
                stadiums.image,
                stadiums.opened_date,
                stadiums.construction_cost,
                stadiums.capacity,
                stadiums.city, 
                stadiums.state,
                stadiums.country_id,
                GROUP_CONCAT(DISTINCT teams.team_name SEPARATOR ', ') AS team_names,
                MAX(user_stadiums.added_on) AS added_on,
                MAX(user_stadiums.visited_on) AS visited_on,
                1 AS visited,
                CASE WHEN MAX(w.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS wishlist,
                COUNT(DISTINCT us2.user_id) + COUNT(DISTINCT uw2.user_id) AS popularity
            FROM user_stadiums
            JOIN stadiums ON user_stadiums.stadium_id = stadiums.stadium_id
            JOIN teams ON stadiums.stadium_id = teams.stadium_id
            JOIN leagues ON teams.league_id = leagues.league_id
            JOIN countries ON stadiums.country_id = countries.country_id
            LEFT JOIN user_wishlist_stadiums w ON w.stadium_id = stadiums.stadium_id AND w.user_id = ?
            LEFT JOIN user_stadiums us2 ON us2.stadium_id = stadiums.stadium_id
            LEFT JOIN user_wishlist_stadiums uw2 ON uw2.stadium_id = stadiums.stadium_id
            WHERE user_stadiums.user_id = ?
            ${leagueFilter.sql}
            ${countryFilter.sql}
            GROUP BY stadiums.stadium_id, stadiums.stadium_name, stadiums.image, stadiums.opened_date, stadiums.construction_cost, stadiums.capacity, stadiums.city, stadiums.state, stadiums.country_id
        `;

        query += buildSortOrder(sortBy, 'stadiums', true, false, 'user_stadiums');

        const params = [
            userId, 
            userId, 
            ...(leagueFilter.sql ? leagueFilter.params : []),
            ...countryFilter.params
        ];

        const [userStadiums] = await db.query(query, params);

        res.json({ userStadiums });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  loadUserVisits  */
const handleLoadUserVisits = async (req, res) => {
    const { league, country, sortBy } = req.body;
    const { userId } = req.user;

    if (!userId) return res.status(404).json({ error: 'User not found' });

    try {
        const leagueFilter = buildLeagueFilter(league);
        const countryFilter = buildCountryFilter(country);

        let query = `
            SELECT 
                stadiums.stadium_id,
                stadiums.stadium_name, 
                stadiums.image,
                stadiums.city, 
                stadiums.state,
                stadiums.country_id,
                user_stadiums.visit_id,
                user_stadiums.added_on,
                user_stadiums.visited_on,
                user_stadiums.user_note,
                1 AS visited,
                CASE WHEN MAX(w.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS wishlist
            FROM user_stadiums
            JOIN stadiums ON user_stadiums.stadium_id = stadiums.stadium_id
            JOIN teams ON stadiums.stadium_id = teams.stadium_id
            JOIN leagues ON teams.league_id = leagues.league_id
            JOIN countries ON stadiums.country_id = countries.country_id
            LEFT JOIN user_wishlist_stadiums w ON w.stadium_id = stadiums.stadium_id AND w.user_id = ?
            WHERE user_stadiums.user_id = ?
            ${leagueFilter.sql}
            ${countryFilter.sql}
            GROUP BY stadiums.stadium_id, stadiums.stadium_name, stadiums.image,
                    stadiums.city, stadiums.state, stadiums.country_id,
                    user_stadiums.visit_id, user_stadiums.added_on, user_stadiums.visited_on
        `;

        query += buildSortOrder(sortBy, 'stadiums', false, false);

        const params = [
            userId, 
            userId, 
            ...(leagueFilter.sql ? leagueFilter.params : []),
            ...countryFilter.params
        ];

        const [userVisits] = await db.query(query, params);
        res.json({ userVisits });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  loadUserWishlist  */
const handleLoadUserWishlist = async (req, res) => {
    const { league, country, sortBy } = req.body;
    const { userId } = req.user;

    if (!userId) return res.status(404).json({ error: 'User not found' });

    try {
        const leagueFilter = buildLeagueFilter(league);
        const countryFilter = buildCountryFilter(country);
        let query = `
            SELECT 
                stadiums.stadium_id,
                stadiums.stadium_name, 
                stadiums.image,
                stadiums.opened_date,
                stadiums.construction_cost,
                stadiums.capacity,
                stadiums.city, 
                stadiums.state,
                stadiums.country_id,
                GROUP_CONCAT(DISTINCT teams.team_name SEPARATOR ', ') AS team_names,
                MAX(user_wishlist_stadiums.added_on) AS added_on,
                1 AS wishlist,
                CASE WHEN MAX(v.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS visited,
                COUNT(DISTINCT us2.user_id) + COUNT(DISTINCT uw2.user_id) AS popularity
            FROM user_wishlist_stadiums
            JOIN stadiums ON user_wishlist_stadiums.stadium_id = stadiums.stadium_id
            JOIN teams ON stadiums.stadium_id = teams.stadium_id
            JOIN leagues ON teams.league_id = leagues.league_id
            JOIN countries ON stadiums.country_id = countries.country_id
            LEFT JOIN user_stadiums v ON v.stadium_id = stadiums.stadium_id AND v.user_id = ?
            LEFT JOIN user_stadiums us2 ON us2.stadium_id = stadiums.stadium_id
            LEFT JOIN user_wishlist_stadiums uw2 ON uw2.stadium_id = stadiums.stadium_id
            WHERE user_wishlist_stadiums.user_id = ?
            ${leagueFilter.sql}
            ${countryFilter.sql}
            GROUP BY stadiums.stadium_id, stadiums.stadium_name, stadiums.image, 
                    stadiums.opened_date, stadiums.construction_cost, stadiums.capacity,
                    stadiums.city, stadiums.state, stadiums.country_id
        `;
        query += buildSortOrder(sortBy, 'stadiums', true, false, 'user_wishlist_stadiums');
        const params = [
            userId, 
            userId, 
            ...(leagueFilter.sql ? leagueFilter.params : []),
            ...countryFilter.params
        ];
        const [userWishlist] = await db.query(query, params);
        res.json({ userWishlist });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  refreshToken  */
const handleRefreshToken = async (req, res) => {
    const { userId } = req.user;

    try {
        const [[user]] = await db.execute(
            'SELECT user_id, username, email, profile_pic, is_pro FROM users WHERE user_id = ?',
            [userId]
        );

        if (!user) return res.status(404).json({ error: 'User not found' });

        const token = jwt.sign(
            { userId: user.user_id, username: user.username, email: user.email, profilePic: user.profile_pic, isPro: user.is_pro },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  saveFavoriteStadiums  */
const handleSaveFavoriteStadiums = async (req, res) => {
    const { stadiumNames } = req.body;
    const { userId } = req.user;

    if (!userId) return res.status(404).json({ error: 'User not found' });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(
            'DELETE FROM user_favorite_stadiums WHERE user_id = ?',
            [userId]
        );

        for (let i = 0; i < stadiumNames.length; i++) {
            const stadiumId = await getStadiumId(stadiumNames[i]);
            if (stadiumId) {
                await connection.query(
                    'INSERT INTO user_favorite_stadiums (user_id, stadium_id, order_index) VALUES (?, ?, ?)',
                    [userId, stadiumId, i]
                );
            }
        }

        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
};

/*  sendPasswordReset  */
let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
    }
});

async function sendPasswordResetEmail(email, token, username) {
    const resetUrl = `${process.env.APP_URL}/reset-password.html?token=${token}`;
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Password Reset Request</h2>
            <p>Hello ${username},</p>
            <p>You (or someone else) requested a password reset for your account.</p>
            <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
            <p style="text-align: center;">
                <a href="${resetUrl}" 
                style="background-color: #007BFF; color: white; padding: 12px 20px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
                </a>
            </p>
            <p>If the button above doesn’t work, copy and paste this URL into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <hr>
            <p style="font-size: 12px; color: #666;">If you did not request a password reset, you can safely ignore this email.</p>
        </div>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `Password Reset for ${username}`,
        text: `Hello ${username}, you requested a password reset. Visit this link: ${resetUrl}`,
        html: htmlContent
    });
}

const handleSendPasswordReset = async (req, res) => {
    const { email } = req.body;

    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        const [rows] = await db.query('SELECT user_id, username FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(200).json({
                message: 'If the email exists, you will receive an email to reset the password.'
            });
        }

        const { user_id: userId, username } = rows[0];

        const token = crypto.randomBytes(32).toString('hex');

        await db.query('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))', [userId, token]);

        await sendPasswordResetEmail(email, token, username);

        res.json({message: 'If the email exists, you will receive an email to reset the password.'});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleAddStadium, handleLoadFavoriteStadiums, handleLoadUserAchievements, handleLoadUserActivity, handleLoadUserHomeMap, handleLoadUserInfo, handleLoadUserStadiums, handleLoadUserVisits, handleLoadUserWishlist, handleRefreshToken, handleSaveFavoriteStadiums, handleSendPasswordReset };