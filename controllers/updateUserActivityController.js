const db = require('../database/connection.js');
const { getUserId, getStadiumId } = require('../database/dbHelpers.js');

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
}

const handleUpdateUserStadium = async (req, res) => {
    const { name, username, isVisited } = req.body;

    if (!name || !username) {
        return res.status(400).json({ error: 'Stadium name and username are required' });
    }

    try {
        const userId = await getUserId(username);
        const stadiumId = await getStadiumId(name);

        if (!userId || !stadiumId) {
            return res.status(404).json({ error: 'User or stadium not found' });
        }

        if (!isVisited) {
            const [rows] = await db.execute('INSERT INTO user_stadiums (stadium_id, user_id, added_on) VALUES (?, ?, NOW())', [stadiumId, userId]);

            //const newAchievements = await updateAchievementProgress(name, username, isVisited);

            res.json({ rows/*, newAchievements*/ });
        } else {
            const [rows] = await db.execute('DELETE FROM user_stadiums WHERE stadium_id = ? AND user_id = ?', [stadiumId, userId]);

            // await updateAchievementProgress(name, username, isVisited);

            res.json({ rows });
        }
    } catch (err) {
        console.error('Error in handleUpdateUserStadium:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const handleUpdateUserWishlist = async (req, res) => {
    const { name, username, isWishlist } = req.body;

    if (!name || !username) {
        return res.status(400).json({ error: 'Stadium name and username are required' });
    }

    try {
        const userId = await getUserId(username);
        const stadiumId = await getStadiumId(name);

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

const handleRemoveActivityWishlist = async (req, res) => {
    const { stadiumId, username } = req.body;

    if (!stadiumId || !username) {
        return res.status(400).json({ error: 'Stadium ID and username are required' });
    }

    try {
        const userId = await getUserId(username);

        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [rows] = await db.execute(`DELETE FROM user_wishlist_stadiums WHERE stadium_id = ? AND user_id = ? ORDER BY added_on DESC LIMIT 1`, [stadiumId, userId]);

        res.json({ rows });
    } catch (err) {
        console.error('Error in handleRemoveActivityWishlist:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const handleRemoveActivityVisited = async (req, res) => {
    const { stadiumId, username } = req.body;

    if (!stadiumId || !username) {
        return res.status(400).json({ error: 'Stadium ID and username are required' });
    }

    try {
        const userId = await getUserId(username);

        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [rows] = await db.execute(`DELETE FROM user_stadiums WHERE stadium_id = ? AND user_id = ? AND visited_on IS NULL ORDER BY added_on DESC LIMIT 1`, [stadiumId, userId]);

        res.json({ rows });
    } catch (err) {
        console.error('Error in handleRemoveActivityVisited:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

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
}

module.exports = { handleUpdateUserStadium, handleUpdateUserWishlist, handleRemoveActivityWishlist, handleRemoveActivityVisited, handleEditLog, handleDeleteLog };