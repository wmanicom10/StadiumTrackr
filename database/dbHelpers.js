const db = require('../config/db.js');

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

const buildSortOrder = (sortBy, tablePrefix = '') => {
    const prefix = tablePrefix ? `${tablePrefix}.` : '';
    
    switch (sortBy) {
        case 'name-desc':
            return ` ORDER BY ${prefix}stadium_name DESC`;
        case 'name-asc':
            return ` ORDER BY ${prefix}stadium_name ASC`;
        case 'date-desc':
        case 'added-desc':
            return ` ORDER BY added_on DESC`;
        case 'date-asc':
        case 'added-asc':
            return ` ORDER BY added_on ASC`;
        case 'visited-desc':
            return ` ORDER BY visited_on IS NULL, visited_on DESC, added_on DESC`;
        case 'visited-asc':
            return ` ORDER BY visited_on IS NULL, visited_on ASC, added_on ASC`;
        default:
            return ` ORDER BY ${prefix}stadium_name ASC`;
    }
};

module.exports = {
    getUserId,
    getStadiumId,
    buildCountryFilter,
    buildLeagueFilter,
    buildSortOrder
};