const db = require('./connection.js');

const getUserId = async (username) => {
    const [[user]] = await db.execute(
        'SELECT user_id FROM users WHERE username = ?',
        [username]
    );
    return user?.user_id;
};

const getStadiumId = async (stadiumName) => {
    const [[stadium]] = await db.execute(
        'SELECT stadium_id FROM stadiums WHERE stadium_name = ?',
        [stadiumName]
    );
    return stadium?.stadium_id;
};

const buildCountryFilter = (country) => {
    if (!country || country === 'all') return { sql: '', params: [] };
    
    if (country === 'us') {
        return { 
            sql: ' AND countries.country_name = ?', 
            params: ['The United States of America'] 
        };
    } else if (country === 'canada') {
        return { 
            sql: ' AND countries.country_name = ?', 
            params: ['Canada'] 
        };
    }
    return { sql: '', params: [] };
};

const buildLeagueFilter = (league) => {
    if (!league || league === 'all') return { sql: '', params: [] };
    
    return { 
        sql: ' AND leagues.league_name = ?', 
        params: [league.toUpperCase()] 
    };
};

const buildSortOrder = (sortBy, tablePrefix = '', isGrouped = false, isUnion = false, addedOnTable = 'user_stadiums') => {
    let addedOn, visitedOn, stadiumName;
    
    if (isUnion) {
        addedOn = 'added_on';
        visitedOn = 'visited_on';
        stadiumName = 'stadium_name';
    } else if (isGrouped) {
        addedOn = `MAX(${addedOnTable}.added_on)`;
        visitedOn = `MAX(${addedOnTable}.visited_on)`;
        stadiumName = 'stadium_name';
    } else {
        addedOn = 'user_stadiums.added_on';
        visitedOn = 'user_stadiums.visited_on';
        stadiumName = 'stadiums.stadium_name';
    }
    
    switch (sortBy) {
        case 'added-asc':
            return ` ORDER BY ${addedOn} ASC`;
        case 'added-desc':
            return ` ORDER BY ${addedOn} DESC`;
        case 'capacity-asc':
            return ` ORDER BY capacity IS NULL, capacity ASC, stadiums.stadium_name ASC`;
        case 'capacity-desc':
            return ` ORDER BY capacity IS NULL, capacity DESC, stadiums.stadium_name ASC`;
        case 'cost-asc':
            return ` ORDER BY construction_cost IS NULL, construction_cost ASC, stadiums.stadium_name ASC`;
        case 'cost-desc':
            return ` ORDER BY construction_cost IS NULL, construction_cost DESC, stadiums.stadium_name ASC`;
        case 'name-asc':
            return ` ORDER BY ${stadiumName} ASC`;
        case 'name-desc':
            return ` ORDER BY ${stadiumName} DESC`;
        case 'opened-asc':
            return ` ORDER BY opened_date IS NULL, opened_date ASC, stadiums.stadium_name ASC`;
        case 'opened-desc':
            return ` ORDER BY opened_date IS NULL, opened_date DESC, stadiums.stadium_name ASC`;
        case 'popularity':
            return ` ORDER BY popularity DESC, stadiums.stadium_name ASC`;
        case 'visited-asc':
            return ` ORDER BY ${visitedOn} IS NULL, ${visitedOn} ASC, ${addedOn} ASC`;
        case 'visited-desc':
            return ` ORDER BY ${visitedOn} IS NULL, ${visitedOn} DESC, ${addedOn} DESC`;
        default:
            return ` ORDER BY ${stadiumName} ASC`;
    }
};

module.exports = {
    getUserId,
    getStadiumId,
    buildCountryFilter,
    buildLeagueFilter,
    buildSortOrder
};