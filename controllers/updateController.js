const db = require('../database/connection.js');
const { getUserId } = require('../database/dbHelpers.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PROFILE_PIC_DIR = process.env.PROFILE_PIC_DIR;
const bcrypt = require('bcryptjs');

/*  updateUserAchievements (TODO) */ 
async function updateAchievementProgress(name, username, isVisited) {
    if (!isVisited) {
        let newAchievements = [];

        let achievementIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 30];
        const [unlockedAchievements] = await db.execute('select * from user_achievements where user_id = (select user_id from users where username = "test") and unlocked = true');

        unlockedAchievements.forEach(unlockedAchievement => {
            achievementIds = achievementIds.filter(achievementId => achievementId !== unlockedAchievement.achievement_id);
        })

        for (const achievementId of achievementIds) {
            if (achievementId >= 1 && achievementId <= 7) {
                await db.execute('insert into user_achievements (achievement_id, user_id, progress_value) values (?, (select user_id from users where username = ?), 1) on duplicate key update achievement_id = VALUES(achievement_id), user_id = VALUES(user_id), progress_value = progress_value + 1', [achievementId, username]);
            }
            else if (achievementId >= 8 && achievementId <= 11) {
                const [stadiumCountry] = await db.execute('select country_name from stadiums join countries on stadiums.country_id = countries.country_id where stadiums.stadium_name = ?', [name]);

                if (stadiumCountry[0].country_name == "The United States of America") {
                    let [states] = await db.execute('select count(distinct s.state) as num_states, ua.progress_value from users u left join user_achievements ua on ua.user_id = u.user_id and ua.achievement_id = ? left join user_stadiums us on us.user_id = u.user_id left join stadiums s on s.stadium_id = us.stadium_id where u.username = ? group by ua.progress_value', [achievementId, username]);

                    if (states[0].progress_value === null) {
                        await db.execute('insert into user_achievements (achievement_id, user_id, progress_value) values (?, (select user_id from users where username = ?), 1)', [achievementId, username]);

                        states = await db.execute('select count(distinct s.state) as num_states, ua.progress_value from users u left join user_achievements ua on ua.user_id = u.user_id and ua.achievement_id = ? left join user_stadiums us on us.user_id = u.user_id left join stadiums s on s.stadium_id = us.stadium_id where u.username = ? group by ua.progress_value', [achievementId, username]);
                    }

                    if (states[0].num_states > states[0].progress_value) {
                        await db.execute('update user_achievements set progress_value = progress_value + 1 where achievement_id = ? and user_id = (select user_id from users where username = ?)', [achievementId, username]);
                    }
                }
            }
            else if (achievementId === 12) {
                const [stadiumCountry] = await db.execute('select country_name from stadiums join countries on stadiums.country_id = countries.country_id where stadiums.stadium_name = ?', [name]);

                if (stadiumCountry[0].country_name == "Canada") {
                    await db.execute('insert into user_achievements (achievement_id, user_id, progress_value) values (12, (select user_id from users where username = ?), 1)', [username]);
                }
            }
            else if (achievementId === 13) {
                const [stadiumCountry] = await db.execute('select country_name from stadiums join countries on stadiums.country_id = countries.country_id where stadiums.stadium_name = ?', [name]);

                if (!(stadiumCountry[0].country_name == "The United States of America" || stadiumCountry[0].country_name == "Canada")) {
                    await db.execute('insert into user_achievements (achievement_id, user_id, progress_value) values (13, (select user_id from users where username = ?), 1)', [username]);
                }
            }
            else if (achievementId === 14) {
                const [stadiumState] = await db.execute('select state from stadiums where stadiums.stadium_name = ?', [name]);

                if (stadiumState[0].state == "CA" || stadiumState[0].state == "FL" || stadiumState[0].state == "TX") {
                    const [states] = await db.execute('SELECT st.state, COUNT(s.state) AS num_visited FROM (SELECT "CA" AS state UNION ALL SELECT "FL" UNION ALL SELECT "TX") st LEFT JOIN user_stadiums us ON us.user_id = (SELECT user_id FROM users WHERE username = ?) LEFT JOIN stadiums s ON us.stadium_id = s.stadium_id AND s.state = st.state GROUP BY st.state', [username]);

                    for (const state of states) {
                        if (state.num_visited == 1) {
                            await db.execute('insert into user_achievements (achievement_id, user_id, progress_value) values (14, (select user_id from users where username = ?), 1) on duplicate key update achievement_id = VALUES(achievement_id), user_id = VALUES(user_id), progress_value = progress_value + 1', [username]);
                            break;
                        }
                    }
                }
            }
            else if (achievementId >= 15 && achievementId <= 19) {
                const [leagueName] = await db.execute('select league_name from stadiums join teams on stadiums.stadium_id = teams.stadium_id join leagues on teams.league_id = leagues.league_id where stadiums.stadium_name = ?', [name])

                if (leagueName[0].league_name === "NFL" && achievementId === 15 || leagueName[0].league_name === "NBA" && achievementId === 16 || leagueName[0].league_name === "MLB" && achievementId === 17 || leagueName[0].league_name === "NHL" && achievementId === 18 || leagueName[0].league_name === "MLS" && achievementId === 19) {  
                    const [leagueCount] = await db.execute('select count(distinct user_stadiums.stadium_id) as league_count from user_stadiums join stadiums on user_stadiums.stadium_id = stadiums.stadium_id join teams on stadiums.stadium_id = teams.stadium_id join leagues on teams.league_id = leagues.league_id where league_name = ? and user_stadiums.user_id = (select user_id from users where username = ?)', [leagueName[0].league_name, username]);

                    const [progressCount] = await db.execute('select progress_value from user_achievements where achievement_id = ? and user_id = (select user_id from users where username = ?)', [achievementId, username]);

                    const progressValue = progressCount?.[0]?.progress_value ?? 0;

                    if (progressValue === 0) {
                        await db.execute('insert into user_achievements (achievement_id, user_id, progress_value) values (?, (select user_id from users where username = ?), 1)', [achievementId, username]);
                    }
                    else if (progressValue < leagueCount[0].league_count) {
                        await db.execute('update user_achievements set progress_value = progress_value + 1 where achievement_id = ? and user_id = (select user_id from users where username = ?)', [achievementId, username]);
                    }
                }
            }
            else if (achievementId === 20) {
                const [stadiumLeague] = await db.execute('select league_name from stadiums join teams on stadiums.stadium_id = teams.stadium_id join leagues on teams.league_id = leagues.league_id where stadiums.stadium_name = ?', [name]);

                if (stadiumLeague[0].league_name == "NFL" || stadiumLeague[0].league_name == "NBA" || stadiumLeague[0].league_name == "MLB") {
                    const [leagues] = await db.execute('SELECT ls.league_name, COUNT(DISTINCT uls.stadium_id) AS num_visited FROM (SELECT "NFL" AS league_name UNION ALL SELECT "NBA" UNION ALL SELECT "MLB") ls LEFT JOIN (SELECT DISTINCT s.stadium_id, l.league_name FROM user_stadiums us JOIN stadiums s ON us.stadium_id = s.stadium_id JOIN teams t ON s.stadium_id = t.stadium_id JOIN leagues l ON t.league_id = l.league_id WHERE us.user_id = (SELECT user_id FROM users WHERE username = ?)) AS uls ON uls.league_name = ls.league_name GROUP BY ls.league_name', [username]);

                    for (const league of leagues) {
                        if (league.num_visited == 1) {
                            await db.execute('insert into user_achievements (achievement_id, user_id, progress_value) values (20, (select user_id from users where username = ?), 1) on duplicate key update achievement_id = VALUES(achievement_id), user_id = VALUES(user_id), progress_value = progress_value + 1', [username]);
                            break;
                        }
                    }
                }
            }
            else if (achievementId === 21) {
                const [stadiumLeague] = await db.execute('select league_name from stadiums join teams on stadiums.stadium_id = teams.stadium_id join leagues on teams.league_id = leagues.league_id where stadiums.stadium_name = ?', [name]);

                if (stadiumLeague[0].league_name == "NFL" || stadiumLeague[0].league_name == "NBA" || stadiumLeague[0].league_name == "MLB" || stadiumLeague[0].league_name == "NHL" || stadiumLeague[0].league_name == "MLS") {
                    const [leagues] = await db.execute('SELECT ls.league_name, COUNT(DISTINCT uls.stadium_id) AS num_visited FROM (SELECT "NFL" AS league_name UNION ALL SELECT "NBA" UNION ALL SELECT "MLB" UNION ALL SELECT "NHL" UNION ALL SELECT "MLS") ls LEFT JOIN (SELECT DISTINCT s.stadium_id, l.league_name FROM user_stadiums us JOIN stadiums s ON us.stadium_id = s.stadium_id JOIN teams t ON s.stadium_id = t.stadium_id JOIN leagues l ON t.league_id = l.league_id WHERE us.user_id = (SELECT user_id FROM users WHERE username = ?)) AS uls ON uls.league_name = ls.league_name GROUP BY ls.league_name', [username]);

                    for (const league of leagues) {
                        if (league.num_visited == 1) {
                            await db.execute('insert into user_achievements (achievement_id, user_id, progress_value) values (21, (select user_id from users where username = ?), 1) on duplicate key update achievement_id = VALUES(achievement_id), user_id = VALUES(user_id), progress_value = progress_value + 1', [username]);
                            break;
                        }
                    }
                }
            }
        }

        const [userAchievements] = await db.execute('select * from achievements join user_achievements on achievements.achievement_id = user_achievements.achievement_id where user_id = (select user_id from users where username = ?) and (unlocked = false or unlocked = null)', [username]);

        for (const achievement of userAchievements) {
            if (achievement.progress_value === achievement.progress_goal) {
                await db.execute('update user_achievements set unlocked = 1, unlocked_on = now() where achievement_id = ? and user_id = (select user_id from users where username = ?)', [achievement.achievement_id, username]);
                newAchievements.push({
                    achievementName: achievement.achievement_name,
                    achievementDescription: achievement.achievement_description,
                    achievementImage: achievement.achievement_image,
                })
            }
        }

        return newAchievements;
    }
    else if (isVisited) {
        let achievementIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 30];

        const [lockedAchievements] = await db.execute('select * from user_achievements where user_id = (select user_id from users where username = "test") and unlocked = false');

        lockedAchievements.forEach(lockedAchievement => {
            achievementIds = achievementIds.filter(achievementId => achievementId === lockedAchievement.achievement_id);
        })

        for (const achievementId of achievementIds) {
            if (achievementId >= 1 && achievementId <= 7) {
                await db.execute('update user_achievements set progress_value = progress_value - 1 where achievement_id = ? and user_id = (select user_id from users where username = ?)', [achievementId, username]);
            }
            else if (achievementId >= 8 && achievementId <= 11) {
                const [stadiumCountry] = await db.execute('select country_name from stadiums join countries on stadiums.country_id = countries.country_id where stadiums.stadium_name = ?', [name]);

                if (stadiumCountry[0].country_name == "The United States of America") {
                    let [states] = await db.execute('select count(distinct s.state) as num_states, ua.progress_value from users u left join user_achievements ua on ua.user_id = u.user_id and ua.achievement_id = ? left join user_stadiums us on us.user_id = u.user_id left join stadiums s on s.stadium_id = us.stadium_id where u.username = ? group by ua.progress_value', [achievementId, username]);

                    if (states[0].num_states < states[0].progress_value) {
                        await db.execute('update user_achievements set progress_value = progress_value - 1 where achievement_id = ? and user_id = (select user_id from users where username = ?)', [achievementId, username]);
                    }
                }
            }
        }

        const [userAchievements] = await db.execute('select * from achievements join user_achievements on achievements.achievement_id = user_achievements.achievement_id where user_id = (select user_id from users where username = ?) and unlocked = true', [username]);

        for (const achievement of userAchievements) {
            if (achievement.progress_value < achievement.progress_goal) {
                await db.execute('update user_achievements set unlocked = 0, unlocked_on = null where achievement_id = ? and user_id = (select user_id from users where username = ?)', [achievement.achievement_id, username]);
            }
        }

    }
};

/*  deleteLog  */
const handleDeleteLog = async (req, res) => {
    const { visitId } = req.body;

    if (!visitId) {
        return res.status(400).json({ error: 'Visit ID is required' });
    }

    try {
        const [rows] = await db.execute('DELETE FROM user_stadiums WHERE visit_id = ?', [visitId]);

        res.json({ rows });
    } catch (err) {
        console.error('Error in handleDeleteLog:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  editLog  */
const handleEditLog = async (req, res) => {
    const { visitId, editDateVisited, editNote } = req.body;

    if (!visitId) {
        return res.status(400).json({ error: 'Visit ID is required' });
    }

    try {
        const [rows] = await db.execute('UPDATE user_stadiums SET visited_on = ?, user_note = ? WHERE visit_id = ?', [editDateVisited, editNote, visitId]);

        res.json({ rows });
    } catch (err) {
        console.error('Error in handleEditLog:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  updateEmail  */
const handleUpdateEmail = async (req, res) => {
    const { username, newEmail } = req.body;

    try {
        const [[existingUser]] = await db.execute('SELECT user_id FROM users WHERE email = ?', [newEmail]);

        if (existingUser) {
            return res.status(409).json({ error: 'Email already in use' });
        }

        const userId = await getUserId(username);

        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [[currentEmail]] = await db.execute('SELECT email FROM users WHERE user_id = ?', [userId]);
        
        if (currentEmail.email === newEmail) {
            return res.status(409).json({ error: 'New email must be different from current email' });
        }

        const [result] = await db.query('UPDATE users SET email = ? WHERE user_id = ?', [newEmail, userId]);

        res.json({ result });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  updatePassword  */
const handleUpdatePassword = async (req, res) => {
    const { username, currentPassword, newPassword } = req.body;

    try {
        const [[user]] = await db.execute('SELECT user_id, password FROM users WHERE username = ?', [username]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        const [result] = await db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashedPassword, user.user_id]);

        res.json({ result });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  updateProfilePic  */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, PROFILE_PIC_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `temp_${Date.now()}${ext}`);
    }
});

const upload = multer({ storage });

const handleUpdateProfilePic = async (req, res) => {
    const { username } = req.body;
    const ext = path.extname(req.file.filename);

    try {
        const userId = await getUserId(username);
        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [[user]] = await db.execute('SELECT profile_pic FROM users WHERE user_id = ?', [userId]);
        if (user.profile_pic && !user.profile_pic.includes('default.png')) {
            const fullOldPath = path.join(PROFILE_PIC_DIR, path.basename(user.profile_pic));
            if (fs.existsSync(fullOldPath)) {
                fs.unlinkSync(fullOldPath);
            }
        }

        const newFilename = `user_${userId}${ext}`;
	const oldPath = path.join(PROFILE_PIC_DIR, req.file.filename);
	const newPath = path.join(PROFILE_PIC_DIR, newFilename);
	const webPath = `images/profile-pics/${newFilename}`;

        fs.renameSync(oldPath, newPath);

        await db.query('UPDATE users SET profile_pic = ? WHERE user_id = ?', [webPath, userId]);
        res.json({ profile_pic: webPath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  updateUsername  */
const handleUpdateUsername = async (req, res) => {
    const { username, newUsername } = req.body;

    try {
        const [[existingUser]] = await db.execute('SELECT user_id FROM users WHERE username = ?', [newUsername]);

        if (existingUser) {
            return res.status(409).json({ error: 'Username is taken' });
        }

        if (username === newUsername) {
            return res.status(409).json({ error: 'New username must be different from current username' });
        }

        const userId = await getUserId(username);

        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [result] = await db.query('UPDATE users SET username = ? WHERE user_id = ?', [newUsername, userId]);

        res.json({ result });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  updateUserStadium  */
const handleUpdateUserStadium = async (req, res) => {
    const { stadiumId, username, isVisited } = req.body;

    if (!stadiumId || !username) {
        return res.status(400).json({ error: 'Stadium id and username are required' });
    }

    try {
        const userId = await getUserId(username);

        if (!userId || !stadiumId) {
            return res.status(404).json({ error: 'User or stadium not found' });
        }

        if (!isVisited) {
            const [rows] = await db.execute('INSERT INTO user_stadiums (stadium_id, user_id, added_on) VALUES (?, ?, NOW())', [stadiumId, userId]);
            res.json({ rows });
        } else {
            const [logged] = await db.execute(
                'SELECT visit_id FROM user_stadiums WHERE stadium_id = ? AND user_id = ? AND visited_on IS NOT NULL LIMIT 1',
                [stadiumId, userId]
            );

            if (logged.length > 0) {
                return res.json({ locked: true });
            }

            const [rows] = await db.execute('DELETE FROM user_stadiums WHERE stadium_id = ? AND user_id = ?', [stadiumId, userId]);
            res.json({ rows });
        }
    } catch (err) {
        console.error('Error in handleUpdateUserStadium:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  updateUserWishlist  */
const handleUpdateUserWishlist = async (req, res) => {
    const { stadiumId, username, isWishlist } = req.body;

    if (!stadiumId || !username) {
        return res.status(400).json({ error: 'Stadium id and username are required' });
    }

    try {
        const userId = await getUserId(username);

        if (!userId || !stadiumId) {
            return res.status(404).json({ error: 'User or stadium not found' });
        }

        if (!isWishlist) {
            const [rows] = await db.execute('INSERT INTO user_wishlist_stadiums (stadium_id, user_id, added_on) VALUES (?, ?, NOW())', [stadiumId, userId]);

            res.json({ rows });
        } else {
            const [rows] = await db.execute('DELETE FROM user_wishlist_stadiums WHERE stadium_id = ? AND user_id = ?', [stadiumId, userId]);

            res.json({ rows });
        }
    } catch (err) {
        console.error('Error in handleUpdateUserWishlist:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleDeleteLog, handleEditLog, handleUpdateEmail, handleUpdatePassword, upload, handleUpdateProfilePic, handleUpdateUsername, handleUpdateUserStadium, handleUpdateUserWishlist };