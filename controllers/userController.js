const db = require('../database/connection.js');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const archiver = require('archiver');
const { getStadiumId, buildCountryFilter, buildLeagueFilter, buildSortOrder } = require('../database/dbHelpers.js');
const { handleUpdateAchievementProgress } = require('./updateController.js');

/*  addStadium  */
const handleAddStadium = async (req, res) => {
    const { stadiumId, dateVisited, note, tempPhotos } = req.body;
    const { userId, isPro } = req.user;

    if (!userId || !stadiumId) return res.status(400).json({ error: 'Stadium id and/or user id is required' });

    try {
        const [rows] = await db.execute('INSERT INTO user_stadiums (stadium_id, user_id, added_on, visited_on, user_note) SELECT s.stadium_id, u.user_id, NOW(), ?, ? FROM stadiums s, users u WHERE s.stadium_id = ? AND u.user_id = ?', [dateVisited, note, stadiumId, userId]);

        const visitId = rows.insertId;

        if (isPro && tempPhotos && tempPhotos.length > 0) {
            const photoLimit = Math.min(tempPhotos.length, 5);
            for (let i = 0; i < photoLimit; i++) {
                const tempFilename = tempPhotos[i];
                const tempPath = path.join(process.env.VISIT_PHOTO_DIR, tempFilename);

                if (!fs.existsSync(tempPath)) continue;

                const newFilename = `visit_${visitId}_${Date.now()}_${i}.jpg`;
                const newPath = path.join(process.env.VISIT_PHOTO_DIR, newFilename);

                fs.renameSync(tempPath, newPath);

                await db.execute('INSERT INTO visit_photos (visit_id, user_id, filename) VALUES (?, ?, ?)', [visitId, userId, newFilename]);
            }
        }

        await handleUpdateAchievementProgress(userId);
        await db.execute('DELETE FROM user_wishlist_stadiums WHERE stadium_id = ? AND user_id = ?', [stadiumId, userId]);

        res.json({ rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  downloadUserData  */
const handleDownloadUserData = async (req, res) => {
    const { userId, isPro } = req.user;
    
    if (!isPro) return res.status(403).json({ error: 'Pro subscription required' });
    if (!userId) return res.status(404).json({ error: 'User not found' });

    try {
        const [stadiums] = await db.execute(`SELECT s.stadium_name, s.street_address, s.city, s.state, s.zip, c.country_name, s.latitude, s.longitude, DATE_FORMAT(s.opened_date, '%m-%d-%Y') AS opened_date, s.construction_cost, s.capacity, MAX(us.added_on) AS added_on FROM user_stadiums us JOIN stadiums s ON us.stadium_id = s.stadium_id JOIN countries c ON s.country_id = c.country_id WHERE us.user_id = ? GROUP BY s.stadium_id ORDER BY s.stadium_name ASC`, [userId]);

        const [visits] = await db.execute(`SELECT s.stadium_name, s.city, s.state, us.visited_on, us.user_note FROM user_stadiums us JOIN stadiums s ON us.stadium_id = s.stadium_id WHERE us.user_id = ? AND us.visited_on IS NOT NULL ORDER BY us.visited_on DESC`, [userId]);

        const [wishlist] = await db.execute(`SELECT s.stadium_name, s.street_address, s.city, s.state, s.zip, c.country_name, s.latitude, s.longitude, DATE_FORMAT(s.opened_date, '%m-%d-%Y') AS opened_date, s.construction_cost, s.capacity, uw.added_on FROM user_wishlist_stadiums uw JOIN stadiums s ON uw.stadium_id = s.stadium_id JOIN countries c ON s.country_id = c.country_id WHERE uw.user_id = ? ORDER BY s.stadium_name ASC`, [userId]);

        const [achievements] = await db.execute(`SELECT a.achievement_name, a.achievement_description, a.progress_goal, COALESCE(ua.progress_value, 0) AS progress_value, COALESCE(ua.unlocked, 0) AS unlocked, ua.unlocked_on FROM achievements a LEFT JOIN user_achievements ua ON ua.achievement_id = a.achievement_id AND ua.user_id = ? ORDER BY a.achievement_name ASC`, [userId]);

        const [lists] = await db.execute(`SELECT ul.list_id, ul.list_name, ul.list_description, ul.created_at, ul.updated_at FROM user_lists ul WHERE ul.user_id = ? ORDER BY ul.list_name ASC`, [userId]);

        const listStadiums = {};
        for (const list of lists) {
            const [stadiumRows] = await db.execute(`SELECT s.stadium_name, s.city, s.state, uls.order_index, uls.note FROM user_list_stadiums uls JOIN stadiums s ON uls.stadium_id = s.stadium_id WHERE uls.list_id = ? ORDER BY uls.order_index ASC`, [list.list_id]);
            listStadiums[list.list_id] = { name: list.list_name, stadiums: stadiumRows };
        }

        const escape = val => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
        };

        const toCSV = (headers, rows) => {
            const lines = [headers.join(',')];
            rows.forEach(row => {
                lines.push(headers.map(h => escape(row[h])).join(','));
            });
            return lines.join('\n');
        };

        const stadiumsCSV = toCSV(['stadium_name', 'street_address', 'city', 'state', 'zip', 'country_name', 'latitude', 'longitude', 'opened_date', 'capacity', 'construction_cost', 'added_on'], stadiums);

        const visitsCSV = toCSV(['stadium_name', 'city', 'state', 'visited_on', 'user_note'], visits);

        const wishlistCSV = toCSV(['stadium_name', 'street_address', 'city', 'state', 'zip', 'country_name', 'latitude', 'longitude', 'opened_date', 'capacity', 'construction_cost', 'added_on'], wishlist);

        const achievementsCSV = toCSV(['achievement_name', 'achievement_description', 'progress_value', 'progress_goal', 'unlocked', 'unlocked_on'], achievements);

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="stadiumtrackr-data.zip"');

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        archive.append(stadiumsCSV, { name: 'stadiums.csv' });
        archive.append(visitsCSV, { name: 'visits.csv' });
        archive.append(wishlistCSV, { name: 'wishlist.csv' });
        archive.append(achievementsCSV, { name: 'achievements.csv' });

        for (const listId of Object.keys(listStadiums)) {
            const { name, stadiums: ls } = listStadiums[listId];
            const list = lists.find(l => l.list_id == listId);
            
            const metaSection = `List Name,${escape(list.list_name)}\nDescription,${escape(list.list_description || '')}\nCreated,${escape(list.created_at)}\nUpdated,${escape(list.updated_at)}\n\n`;
            const stadiumsSection = toCSV(['stadium_name', 'city', 'state', 'order_index', 'note'], ls);
            
            const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            archive.append(metaSection + stadiumsSection, { name: `lists/${safeName}_${listId}.csv` });
        }

        await archive.finalize();

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
    const { userId, isPro } = req.user;

    if (!userId) return res.status(404).json({ error: 'User not found' });
    if (!isPro) return res.status(403).json({ error: 'Pro subscription required' });

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
        const visitIds = userActivity
            .filter(a => a.visit_id !== null)
            .map(a => a.visit_id);

        if (visitIds.length > 0) {
            const [photos] = await db.query(`SELECT photo_id, visit_id, filename FROM visit_photos WHERE visit_id IN (?)`, [visitIds]);

            const photosByVisitId = {};
            photos.forEach(photo => {
                if (!photosByVisitId[photo.visit_id]) photosByVisitId[photo.visit_id] = [];
                photosByVisitId[photo.visit_id].push({ photo_id: photo.photo_id, filename: photo.filename });
            });

            userActivity.forEach(activity => {
                activity.photos = photosByVisitId[activity.visit_id] || [];
            });
        } else {
            userActivity.forEach(activity => {
                activity.photos = [];
            });
        }

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
        const [stadiums] = await db.execute(`SELECT s.stadium_id, s.stadium_name, s.street_address, s.city, s.state, s.zip, s.image, s.latitude, s.longitude, l.league_name, c.country_name FROM stadiums s JOIN user_stadiums us ON s.stadium_id = us.stadium_id JOIN teams t ON s.stadium_id = t.stadium_id JOIN leagues l ON t.league_id = l.league_id JOIN countries c ON s.country_id = c.country_id WHERE us.user_id = ? GROUP BY s.stadium_id, s.stadium_name, s.street_address, s.city, s.state, s.zip, s.image, s.latitude, s.longitude, l.league_name, c.country_name`, [userId]);

        const formattedRows = stadiums.map(row => ({
            stadium_id: row.stadium_id,
            stadium_name: row.stadium_name,
            address: `${row.street_address}, ${row.city}, ${row.state} ${row.zip}`,
            location: [row.latitude, row.longitude],
            image: row.image,
            league: row.league_name,
            country: row.country_name
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

/*  loadUserList  */
const handleLoadUserList = async (req, res) => {
    const { listId, show, league, country, sortBy } = req.body;
    const { userId, isPro } = req.user;

    if (!isPro) return res.status(403).json({ error: 'Pro subscription required' });
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
                user_list_stadiums.order_index,
                user_list_stadiums.note,
                MAX(user_list_stadiums.added_on) AS added_on,
                CASE WHEN MAX(us.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS visited,
                CASE WHEN MAX(w.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS wishlist,
                COUNT(DISTINCT us2.user_id) + COUNT(DISTINCT uw2.user_id) AS popularity
            FROM user_list_stadiums
            JOIN stadiums ON user_list_stadiums.stadium_id = stadiums.stadium_id
            JOIN teams ON stadiums.stadium_id = teams.stadium_id
            JOIN leagues ON teams.league_id = leagues.league_id
            JOIN countries ON stadiums.country_id = countries.country_id
            LEFT JOIN user_stadiums us ON us.stadium_id = stadiums.stadium_id AND us.user_id = ?
            LEFT JOIN user_wishlist_stadiums w ON w.stadium_id = stadiums.stadium_id AND w.user_id = ?
            LEFT JOIN user_stadiums us2 ON us2.stadium_id = stadiums.stadium_id
            LEFT JOIN user_wishlist_stadiums uw2 ON uw2.stadium_id = stadiums.stadium_id
            WHERE user_list_stadiums.list_id = ?
            ${leagueFilter.sql}
            ${countryFilter.sql}
        `;

        if (show === 'visited') {
            query += ` AND us.stadium_id IS NOT NULL`;
        } else if (show === 'not-visited') {
            query += ` AND us.stadium_id IS NULL`;
        }

        query += ` GROUP BY stadiums.stadium_id, stadiums.stadium_name, stadiums.image, 
                   stadiums.opened_date, stadiums.construction_cost, stadiums.capacity, 
                   stadiums.city, stadiums.state, stadiums.country_id, user_list_stadiums.order_index, user_list_stadiums.note`;

        switch (sortBy) {
            case 'visited-asc':
                query += ` ORDER BY MAX(us.visited_on) IS NULL, MAX(us.visited_on) ASC`;
                break;
            case 'visited-desc':
                query += ` ORDER BY MAX(us.visited_on) IS NULL, MAX(us.visited_on) DESC`;
                break;
            case 'added-asc':
                query += ` ORDER BY MAX(user_list_stadiums.added_on) ASC`;
                break;
            case 'added-desc':
                query += ` ORDER BY MAX(user_list_stadiums.added_on) DESC`;
                break;
            case 'name-asc':
                query += ` ORDER BY stadiums.stadium_name ASC`;
                break;
            case 'name-desc':
                query += ` ORDER BY stadiums.stadium_name DESC`;
                break;
            case 'popularity':
                query += ` ORDER BY popularity DESC, stadiums.stadium_name ASC`;
                break;
            case 'opened-asc':
                query += ` ORDER BY stadiums.opened_date IS NULL, stadiums.opened_date ASC`;
                break;
            case 'opened-desc':
                query += ` ORDER BY stadiums.opened_date IS NULL, stadiums.opened_date DESC`;
                break;
            case 'cost-asc':
                query += ` ORDER BY stadiums.construction_cost IS NULL, stadiums.construction_cost ASC`;
                break;
            case 'cost-desc':
                query += ` ORDER BY stadiums.construction_cost IS NULL, stadiums.construction_cost DESC`;
                break;
            case 'capacity-asc':
                query += ` ORDER BY stadiums.capacity IS NULL, stadiums.capacity ASC`;
                break;
            case 'capacity-desc':
                query += ` ORDER BY stadiums.capacity IS NULL, stadiums.capacity DESC`;
                break;
            default:
                query += ` ORDER BY user_list_stadiums.order_index ASC`;
        }

        const params = [userId, userId, listId, ...leagueFilter.params, ...countryFilter.params];
        const [listStadiums] = await db.query(query, params);

        const [[newestStadium]] = await db.query(`
            SELECT s.image 
            FROM user_list_stadiums uls
            JOIN stadiums s ON uls.stadium_id = s.stadium_id
            WHERE uls.list_id = ?
            ORDER BY uls.order_index ASC
            LIMIT 1
        `, [listId]);

        const backdropImage = newestStadium?.image || null;

        const [[listInfo]] = await db.query(`
            SELECT list_name, list_description, is_ranked
            FROM user_lists 
            WHERE list_id = ?
        `, [listId]);

        res.json({ listStadiums, backdropImage, listName: listInfo?.list_name, listDescription: listInfo?.list_description, isRanked: listInfo?.is_ranked });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  loadUserLists  */
const handleLoadUserLists = async (req, res) => {
    const { sortBy, limit } = req.body;
    const { userId, isPro } = req.user;

    if (!isPro) return res.status(403).json({ error: 'Pro subscription required' });
    if (!userId) return res.status(404).json({ error: 'User not found' });

    try {
        let query = `
            SELECT 
                ul.list_id,
                ul.list_name,
                ul.created_at,
                ul.updated_at,
                COUNT(DISTINCT ls.stadium_id) AS stadium_count,
                GROUP_CONCAT(DISTINCT s.image ORDER BY ls.order_index ASC SEPARATOR ',') AS images
            FROM user_lists ul
            LEFT JOIN user_list_stadiums ls ON ul.list_id = ls.list_id
            LEFT JOIN stadiums s ON ls.stadium_id = s.stadium_id
            WHERE ul.user_id = ?
            GROUP BY ul.list_id, ul.list_name, ul.list_description, ul.created_at, ul.updated_at
        `;

        switch (sortBy) {
            case 'updated-asc':
                query += ` ORDER BY ul.updated_at ASC`;
                break;
            case 'created-desc':
                query += ` ORDER BY ul.created_at DESC`;
                break;
            case 'created-asc':
                query += ` ORDER BY ul.created_at ASC`;
                break;
            case 'name-asc':
                query += ` ORDER BY ul.list_name ASC`;
                break;
            case 'name-desc':
                query += ` ORDER BY ul.list_name DESC`;
                break;
            default:
                query += ` ORDER BY ul.updated_at DESC`;
        }

        const [userLists] = await db.query(query, [userId]);

        const formattedLists = userLists.map(list => ({
            ...list,
            images: list.images ? list.images.split(',') : []
        }));

        res.json({ userLists: formattedLists });
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

/*  loadUserStats  */
const handleLoadUserStats = async (req, res) => {
    const { userId, isPro } = req.user;

    if (!isPro) return res.status(403).json({ error: 'Pro subscription required' });
    if (!userId) return res.status(404).json({ error: 'User not found' });

    try {
        const [[heroStats]] = await db.execute(`SELECT COUNT(DISTINCT us.stadium_id) AS numStadiums, COUNT(CASE WHEN us.visited_on IS NOT NULL THEN us.visit_id END) AS numVisits, COUNT(DISTINCT s.city) AS numCities, COUNT(DISTINCT s.country_id) AS numCountries FROM user_stadiums us JOIN stadiums s ON us.stadium_id = s.stadium_id WHERE us.user_id = ?`, [userId]);

        const [[{ totalStadiums }]] = await db.execute(`SELECT COUNT(*) AS totalStadiums FROM stadiums`);
        const percentOfAll = totalStadiums > 0 ? ((heroStats.numStadiums / totalStadiums) * 100).toFixed(1) : 0;

        const [leagueCompletion] = await db.execute(`SELECT l.league_name, COUNT(DISTINCT s.stadium_id) AS totalStadiums, COUNT(DISTINCT us.stadium_id) AS visitedStadiums FROM leagues l JOIN teams t ON t.league_id = l.league_id JOIN stadiums s ON t.stadium_id = s.stadium_id LEFT JOIN user_stadiums us ON us.stadium_id = s.stadium_id AND us.user_id = ? GROUP BY l.league_id, l.league_name ORDER BY l.league_id ASC`, [userId]);

        const [visitsByYear] = await db.execute(`SELECT YEAR(us.visited_on) AS year, COUNT(*) AS count FROM user_stadiums us WHERE us.user_id = ? AND us.visited_on IS NOT NULL GROUP BY YEAR(us.visited_on) ORDER BY year ASC`, [userId]);

        const [[firstVisit]] = await db.execute(`SELECT s.stadium_id, s.stadium_name, s.city, s.state, s.image, us.visited_on, CASE WHEN MAX(uv.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS visited, CASE WHEN MAX(uw.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS wishlist FROM user_stadiums us JOIN stadiums s ON us.stadium_id = s.stadium_id LEFT JOIN user_stadiums uv ON uv.stadium_id = s.stadium_id AND uv.user_id = ? LEFT JOIN user_wishlist_stadiums uw ON uw.stadium_id = s.stadium_id AND uw.user_id = ? WHERE us.user_id = ? AND us.visited_on IS NOT NULL GROUP BY s.stadium_id, s.stadium_name, s.city, s.state, s.image, us.visited_on ORDER BY us.visited_on ASC LIMIT 1`, [userId, userId, userId]);

        const [[latestVisit]] = await db.execute(`SELECT s.stadium_id, s.stadium_name, s.city, s.state, s.image, us.visited_on, CASE WHEN MAX(uv.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS visited, CASE WHEN MAX(uw.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS wishlist FROM user_stadiums us JOIN stadiums s ON us.stadium_id = s.stadium_id LEFT JOIN user_stadiums uv ON uv.stadium_id = s.stadium_id AND uv.user_id = ? LEFT JOIN user_wishlist_stadiums uw ON uw.stadium_id = s.stadium_id AND uw.user_id = ? WHERE us.user_id = ? AND us.visited_on IS NOT NULL GROUP BY s.stadium_id, s.stadium_name, s.city, s.state, s.image, us.visited_on ORDER BY us.visited_on DESC LIMIT 1`, [userId, userId, userId]);

        const [[favoriteMonth]] = await db.execute(`SELECT DATE_FORMAT(us.visited_on, '%b') AS month, COUNT(*) AS count FROM user_stadiums us WHERE us.user_id = ? AND us.visited_on IS NOT NULL GROUP BY MONTH(us.visited_on), DATE_FORMAT(us.visited_on, '%b') ORDER BY count DESC LIMIT 1`, [userId]);

        const [weekRows] = await db.execute(`SELECT DISTINCT YEARWEEK(visited_on, 1) AS yearweek FROM user_stadiums WHERE user_id = ? AND visited_on IS NOT NULL ORDER BY yearweek ASC`, [userId]);

        let longestStreak = 0, currentStreak = 1;
        for (let i = 1; i < weekRows.length; i++) {
            const prev = weekRows[i - 1].yearweek;
            const curr = weekRows[i].yearweek;
            const prevYear = Math.floor(prev / 100);
            const prevWeek = prev % 100;
            const currYear = Math.floor(curr / 100);
            const currWeek = curr % 100;
            const isConsecutive = (currYear === prevYear && currWeek === prevWeek + 1) || (currYear === prevYear + 1 && currWeek === 1 && prevWeek >= 52);
            if (isConsecutive) { currentStreak++; longestStreak = Math.max(longestStreak, currentStreak); } else { currentStreak = 1; }
        }
        if (weekRows.length === 1) longestStreak = 1;

        const avgVisitsPerYear = visitsByYear.length > 0 ? (visitsByYear.reduce((sum, y) => sum + y.count, 0) / (visitsByYear[visitsByYear.length - 1].year - visitsByYear[0].year + 1)).toFixed(1) : 0;

        const [mostVisited] = await db.execute(`SELECT s.stadium_id, s.stadium_name, s.city, s.state, s.image, (SELECT COUNT(*) FROM user_stadiums WHERE stadium_id = s.stadium_id AND user_id = ? AND visited_on IS NOT NULL) AS visitCount, CASE WHEN MAX(uv.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS visited, CASE WHEN MAX(uw.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS wishlist FROM user_stadiums us JOIN stadiums s ON us.stadium_id = s.stadium_id LEFT JOIN user_stadiums uv ON uv.stadium_id = s.stadium_id AND uv.user_id = ? LEFT JOIN user_wishlist_stadiums uw ON uw.stadium_id = s.stadium_id AND uw.user_id = ? WHERE us.user_id = ? AND us.visited_on IS NOT NULL GROUP BY s.stadium_id, s.stadium_name, s.city, s.state, s.image ORDER BY visitCount DESC LIMIT 3`, [userId, userId, userId, userId]);

        const [[oldest]] = await db.execute(`SELECT s.stadium_id, s.stadium_name, s.city, s.state, s.image, s.opened_date, CASE WHEN MAX(uv.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS visited, CASE WHEN MAX(uw.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS wishlist FROM user_stadiums us JOIN stadiums s ON us.stadium_id = s.stadium_id LEFT JOIN user_stadiums uv ON uv.stadium_id = s.stadium_id AND uv.user_id = ? LEFT JOIN user_wishlist_stadiums uw ON uw.stadium_id = s.stadium_id AND uw.user_id = ? WHERE us.user_id = ? AND s.opened_date IS NOT NULL GROUP BY s.stadium_id ORDER BY s.opened_date ASC, s.stadium_name ASC LIMIT 1`, [userId, userId, userId]);

        const [[newest]] = await db.execute(`SELECT s.stadium_id, s.stadium_name, s.city, s.state, s.image, s.opened_date, CASE WHEN MAX(uv.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS visited, CASE WHEN MAX(uw.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS wishlist FROM user_stadiums us JOIN stadiums s ON us.stadium_id = s.stadium_id LEFT JOIN user_stadiums uv ON uv.stadium_id = s.stadium_id AND uv.user_id = ? LEFT JOIN user_wishlist_stadiums uw ON uw.stadium_id = s.stadium_id AND uw.user_id = ? WHERE us.user_id = ? AND s.opened_date IS NOT NULL GROUP BY s.stadium_id ORDER BY s.opened_date DESC, s.stadium_name ASC LIMIT 1`, [userId, userId, userId]);

        const [[highestCapacity]] = await db.execute(`SELECT s.stadium_id, s.stadium_name, s.city, s.state, s.image, s.capacity, CASE WHEN MAX(uv.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS visited, CASE WHEN MAX(uw.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS wishlist FROM user_stadiums us JOIN stadiums s ON us.stadium_id = s.stadium_id LEFT JOIN user_stadiums uv ON uv.stadium_id = s.stadium_id AND uv.user_id = ? LEFT JOIN user_wishlist_stadiums uw ON uw.stadium_id = s.stadium_id AND uw.user_id = ? WHERE us.user_id = ? AND s.capacity IS NOT NULL GROUP BY s.stadium_id ORDER BY s.capacity DESC, s.stadium_name ASC LIMIT 1`, [userId, userId, userId]);

        const [[lowestCapacity]] = await db.execute(`SELECT s.stadium_id, s.stadium_name, s.city, s.state, s.image, s.capacity, CASE WHEN MAX(uv.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS visited, CASE WHEN MAX(uw.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS wishlist FROM user_stadiums us JOIN stadiums s ON us.stadium_id = s.stadium_id LEFT JOIN user_stadiums uv ON uv.stadium_id = s.stadium_id AND uv.user_id = ? LEFT JOIN user_wishlist_stadiums uw ON uw.stadium_id = s.stadium_id AND uw.user_id = ? WHERE us.user_id = ? AND s.capacity IS NOT NULL GROUP BY s.stadium_id ORDER BY s.capacity ASC, s.stadium_name ASC LIMIT 1`, [userId, userId, userId]);

        const [[highestCost]] = await db.execute(`SELECT s.stadium_id, s.stadium_name, s.city, s.state, s.image, s.construction_cost, CASE WHEN MAX(uv.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS visited, CASE WHEN MAX(uw.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS wishlist FROM user_stadiums us JOIN stadiums s ON us.stadium_id = s.stadium_id LEFT JOIN user_stadiums uv ON uv.stadium_id = s.stadium_id AND uv.user_id = ? LEFT JOIN user_wishlist_stadiums uw ON uw.stadium_id = s.stadium_id AND uw.user_id = ? WHERE us.user_id = ? AND s.construction_cost IS NOT NULL GROUP BY s.stadium_id ORDER BY s.construction_cost DESC, s.stadium_name ASC LIMIT 1`, [userId, userId, userId]);

        const [[lowestCost]] = await db.execute(`SELECT s.stadium_id, s.stadium_name, s.city, s.state, s.image, s.construction_cost, CASE WHEN MAX(uv.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS visited, CASE WHEN MAX(uw.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS wishlist FROM user_stadiums us JOIN stadiums s ON us.stadium_id = s.stadium_id LEFT JOIN user_stadiums uv ON uv.stadium_id = s.stadium_id AND uv.user_id = ? LEFT JOIN user_wishlist_stadiums uw ON uw.stadium_id = s.stadium_id AND uw.user_id = ? WHERE us.user_id = ? AND s.construction_cost IS NOT NULL GROUP BY s.stadium_id ORDER BY s.construction_cost ASC, s.stadium_name ASC LIMIT 1`, [userId, userId, userId]);

        const [[mostPopular]] = await db.execute(`SELECT s.stadium_id, s.stadium_name, s.city, s.state, s.image, COUNT(DISTINCT us2.user_id) + COUNT(DISTINCT uw2.user_id) AS popularity, CASE WHEN MAX(uv.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS visited, CASE WHEN MAX(uw.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS wishlist FROM user_stadiums us JOIN stadiums s ON us.stadium_id = s.stadium_id LEFT JOIN user_stadiums us2 ON us2.stadium_id = s.stadium_id LEFT JOIN user_wishlist_stadiums uw2 ON uw2.stadium_id = s.stadium_id LEFT JOIN user_stadiums uv ON uv.stadium_id = s.stadium_id AND uv.user_id = ? LEFT JOIN user_wishlist_stadiums uw ON uw.stadium_id = s.stadium_id AND uw.user_id = ? WHERE us.user_id = ? GROUP BY s.stadium_id ORDER BY popularity DESC, s.stadium_name ASC LIMIT 1`, [userId, userId, userId]);

        const [[leastPopular]] = await db.execute(`SELECT s.stadium_id, s.stadium_name, s.city, s.state, s.image, COUNT(DISTINCT us2.user_id) + COUNT(DISTINCT uw2.user_id) AS popularity, CASE WHEN MAX(uv.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS visited, CASE WHEN MAX(uw.stadium_id) IS NOT NULL THEN 1 ELSE 0 END AS wishlist FROM user_stadiums us JOIN stadiums s ON us.stadium_id = s.stadium_id LEFT JOIN user_stadiums us2 ON us2.stadium_id = s.stadium_id LEFT JOIN user_wishlist_stadiums uw2 ON uw2.stadium_id = s.stadium_id LEFT JOIN user_stadiums uv ON uv.stadium_id = s.stadium_id AND uv.user_id = ? LEFT JOIN user_wishlist_stadiums uw ON uw.stadium_id = s.stadium_id AND uw.user_id = ? WHERE us.user_id = ? GROUP BY s.stadium_id ORDER BY popularity ASC, s.stadium_name ASC LIMIT 1`, [userId, userId, userId]);

        const [topCountries] = await db.execute(`SELECT c.country_name, COUNT(DISTINCT us.stadium_id) AS stadiumCount FROM user_stadiums us JOIN stadiums s ON us.stadium_id = s.stadium_id JOIN countries c ON s.country_id = c.country_id WHERE us.user_id = ? GROUP BY c.country_id, c.country_name ORDER BY stadiumCount DESC, c.country_name ASC LIMIT 5`, [userId]);

        const [topCities] = await db.execute(`SELECT s.city, s.state, COUNT(DISTINCT us.stadium_id) AS stadiumCount FROM user_stadiums us JOIN stadiums s ON us.stadium_id = s.stadium_id WHERE us.user_id = ? GROUP BY s.city, s.state ORDER BY stadiumCount DESC, s.city ASC LIMIT 5`, [userId]);

        const [mapStadiums] = await db.execute(`SELECT DISTINCT s.stadium_id, s.stadium_name, s.street_address, s.city, s.state, s.zip, s.image, s.latitude, s.longitude, l.league_name, c.country_name FROM user_stadiums us JOIN stadiums s ON us.stadium_id = s.stadium_id JOIN teams t ON s.stadium_id = t.stadium_id JOIN leagues l ON t.league_id = l.league_id JOIN countries c ON s.country_id = c.country_id WHERE us.user_id = ? GROUP BY s.stadium_id, s.stadium_name, s.street_address, s.city, s.state, s.zip, s.image, s.latitude, s.longitude, l.league_name, c.country_name`, [userId]);

        const formattedMapStadiums = mapStadiums.map(row => ({
            stadium_id: row.stadium_id,
            stadium_name: row.stadium_name,
            address: `${row.street_address}, ${row.city}, ${row.state} ${row.zip}`,
            location: [row.latitude, row.longitude],
            image: row.image,
            league_name: row.league_name,
            country_name: row.country_name
        }));

        res.json({
            heroStats: { ...heroStats, percentOfAll },
            leagueCompletion,
            visitsByYear,
            firstVisit: firstVisit || null,
            latestVisit: latestVisit || null,
            favoriteMonth: favoriteMonth?.month || null,
            longestStreak,
            avgVisitsPerYear,
            mostVisited,
            stadiumRecords: { oldest, newest, highestCapacity, lowestCapacity, highestCost, lowestCost, mostPopular, leastPopular },
            topCountries,
            topCities,
            mapStadiums: formattedMapStadiums
        });
    } catch (err) {
        console.error('Error in handleLoadUserStats:', err);
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

        const visitIds = userVisits
            .filter(v => v.visit_id !== null)
            .map(v => v.visit_id);

        if (visitIds.length > 0) {
            const [photos] = await db.query(`SELECT photo_id, visit_id, filename FROM visit_photos WHERE visit_id IN (?)`, [visitIds]);

            const photosByVisitId = {};
            photos.forEach(photo => {
                if (!photosByVisitId[photo.visit_id]) photosByVisitId[photo.visit_id] = [];
                photosByVisitId[photo.visit_id].push({ photo_id: photo.photo_id, filename: photo.filename });
            });

            userVisits.forEach(visit => {
                visit.photos = photosByVisitId[visit.visit_id] || [];
            });
        } else {
            userVisits.forEach(visit => {
                visit.photos = [];
            });
        }

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
            <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
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

/*  uploadTempVisitPhoto  */
const tempVisitPhotoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.VISIT_PHOTO_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        cb(null, `temp_${req.user.userId}_${unique}${ext}`);
    }
});

const uploadTempVisitPhoto = multer({
    storage: tempVisitPhotoStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

const handleUploadTempVisitPhoto = async (req, res) => {
    const { userId, isPro } = req.user;
    
    if (!userId) return res.status(404).json({ error: 'User not found' });
    if (!isPro) return res.status(403).json({ error: 'Pro subscription required' });

    try {
        const newFilename = `temp_${userId}_${Date.now()}.jpg`;
        const tempPath = path.join(process.env.VISIT_PHOTO_DIR, req.file.filename);
        const newPath = path.join(process.env.VISIT_PHOTO_DIR, newFilename);

        await sharp(tempPath)
            .rotate()
            .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toFile(newPath);

        fs.unlinkSync(tempPath);

        res.json({ filename: newFilename });

    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleAddStadium, handleDownloadUserData, handleLoadFavoriteStadiums, handleLoadUserAchievements, handleLoadUserActivity, handleLoadUserHomeMap, handleLoadUserInfo, handleLoadUserList, handleLoadUserLists, handleLoadUserStadiums, handleLoadUserStats, handleLoadUserVisits, handleLoadUserWishlist, handleRefreshToken, handleSaveFavoriteStadiums, handleSendPasswordReset, handleUploadTempVisitPhoto, uploadTempVisitPhoto };