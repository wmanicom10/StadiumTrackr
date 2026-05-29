const db = require('../database/connection.js');
const { getUserId, buildCountryFilter, buildLeagueFilter, buildSortOrder } = require('../database/dbHelpers.js');

async function fetchWithRetry(url, retries = 3, delay = 1000, timeout = null) {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;
            const response = await fetch(url, { signal: controller.signal });
            if (timeoutId) clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            const errorMsg = error.name === 'AbortError' ? 'Request timed out' : error.message;
            if (i === retries - 1) throw new Error(errorMsg);
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
    }
}

async function getNextEvents(stadiums, limit = 1) {
    const results = await Promise.all(
        stadiums.map(async (stadium) => {
            if (!stadium.ticketmaster_id) return null;
            try {
                const url = `https://app.ticketmaster.com/discovery/v2/events.json?classificationName=sports&sort=date,asc&venueId=${stadium.ticketmaster_id}&apikey=${process.env.TICKETMASTER_API_KEY}`;
                const data = await fetchWithRetry(url);
                const events = data._embedded?.events || [];

                return events.slice(0, limit).map(event => ({
                    stadium_id: stadium.stadium_id,
                    stadium_name: stadium.stadium_name,
                    city: stadium.city,
                    state: stadium.state,
                    image: stadium.image,
                    nextEvent: {
                        ...event,
                        dates: {
                            ...event.dates,
                            timezone: event.dates?.timezone
                        }
                    }
                }));
            } catch (error) {
                console.error(`Failed to fetch events for ${stadium.stadium_name} after retries:`, error.message);
                return null;
            }
        })
    );

    return results.flat().filter(r => r !== null && r.nextEvent !== null);
}

function getLocalTimestamp(event) {
    const dateTime = event.dates?.start?.dateTime;
    const localDate = event.dates?.start?.localDate;
    const timezone = event.dates?.timezone;

    if (dateTime) {
        const utcDate = new Date(dateTime);
        if (timezone) {
            return new Date(utcDate.toLocaleString('en-US', {
                timeZone: timezone,
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            })).getTime();
        }
        return utcDate.getTime();
    } else if (localDate) {
        const [year, month, day] = localDate.split('-').map(Number);
        return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
    }
    return null;
}

/*  loadAboutInfo  */
const handleLoadAboutInfo = async (req, res) => {
    try {
        const [aboutInfo] = await db.query('SELECT (SELECT COUNT(stadium_id) FROM stadiums) AS num_stadiums, (SELECT COUNT(league_id) FROM leagues) AS num_leagues, (SELECT COUNT(country_id) FROM countries) AS num_countries');

        res.json({ aboutInfo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  loadFeaturedEvents  */
const handleLoadFeaturedEvents = async (req, res) => {
    try {
        const [popularStadiums] = await db.execute('SELECT s.stadium_id, s.stadium_name, s.city, s.state, s.image, s.ticketmaster_id, COUNT(DISTINCT us.user_id) + COUNT(DISTINCT w.user_id) AS popularity FROM stadiums s LEFT JOIN user_stadiums us ON us.stadium_id = s.stadium_id LEFT JOIN user_wishlist_stadiums w ON w.stadium_id = s.stadium_id GROUP BY s.stadium_id, s.stadium_name, s.city, s.state, s.image, s.ticketmaster_id ORDER BY popularity DESC, s.stadium_name ASC LIMIT 3');
        
        res.json({ stadiums: await getNextEvents(popularStadiums) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  loadMapStadiums  */
const handleLoadMapStadiums = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT stadium_id, stadium_name, street_address, city, state, zip, latitude, longitude, image FROM stadiums order by stadium_id');

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Could not load stadiums' });
        }

        const formattedRows = rows.map(row => ({
            stadium_id: row.stadium_id,
            stadium_name: row.stadium_name,
            address: `${row.street_address}, ${row.city}, ${row.state} ${row.zip}`,
            location: [row.latitude, row.longitude],
            image: row.image
        }));

        res.json({ rows: formattedRows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  loadPopularStadiums  */
const handleLoadPopularStadiums = async (req, res) => {
    try {
        const [popularStadiums] = await db.execute('SELECT s.stadium_id, s.stadium_name, s.image, s.city, s.state, COUNT(DISTINCT us.user_id) + COUNT(DISTINCT w.user_id) AS popularity FROM stadiums s LEFT JOIN user_stadiums us ON us.stadium_id = s.stadium_id LEFT JOIN user_wishlist_stadiums w ON w.stadium_id = s.stadium_id GROUP BY s.stadium_id, s.stadium_name, s.image, s.city, s.state ORDER BY popularity DESC, s.stadium_name ASC LIMIT 3');

        res.json({ popularStadiums });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  loadStadiumEvents  */
const handleLoadStadiumEvents = async (req, res) => {
    const { id } = req.body;
    try {
        const [[stadium]] = await db.execute(
            'SELECT ticketmaster_id, image FROM stadiums WHERE stadium_id = ?', [id]
        );

        if (!stadium || !stadium.ticketmaster_id) {
            return res.json({ events: [], stadiumImage: stadium?.image || null });
        }

        const url = `https://app.ticketmaster.com/discovery/v2/events.json?classificationName=sports&sort=date,asc&venueId=${stadium.ticketmaster_id}&apikey=${process.env.TICKETMASTER_API_KEY}`;
        const data = await fetchWithRetry(url, 3, 1000, 8000);
        const events = data._embedded?.events || [];

        events.sort((a, b) => {
            const timeA = getLocalTimestamp(a);
            const timeB = getLocalTimestamp(b);
            
            if (timeA === null && timeB === null) return 0;
            if (timeA === null) return 1;
            if (timeB === null) return -1;
            
            return timeA - timeB;
        });

        res.json({ events, image: stadium.image });
    
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  loadStadiumInfo  */
const handleLoadStadiumInfo = async (req, res) => {
    const { id, username } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Stadium id is required' });
    }

    try {
        const userId = username ? await getUserId(username) : null;

        const [stadium] = await db.execute('SELECT s.stadium_id, s.stadium_name, s.city, s.state, s.image, s.capacity, s.opened_date, s.construction_cost, t.team_name, l.league_name FROM stadiums s JOIN teams t ON s.stadium_id = t.stadium_id JOIN leagues l ON t.league_id = l.league_id WHERE s.stadium_id = ?', [id]);

        const [visits] = await db.execute('SELECT COUNT(DISTINCT user_id) as visits FROM user_stadiums WHERE stadium_id = ?', [id]);

        const [userVisited] = userId ? await db.execute('SELECT username, added_on, visited_on FROM user_stadiums JOIN users ON user_stadiums.user_id = users.user_id WHERE stadium_id = ? AND user_stadiums.user_id = ?', [id, userId]) : [[]];

        const [userWishlist] = userId ? await db.execute('SELECT username, added_on FROM user_wishlist_stadiums JOIN users ON user_wishlist_stadiums.user_id = users.user_id WHERE stadium_id = ? AND user_wishlist_stadiums.user_id = ?', [id, userId]) : [[]];
          
        if (stadium.length === 0) {
            return res.status(404).json({ error: 'Error loading stadium info' });
        }

        const stadiumInfo = {
            stadium: {
                id: stadium[0].stadium_id,
                name: stadium[0].stadium_name,
                city: stadium[0].city,
                state: stadium[0].state,
                image: stadium[0].image,
                capacity: stadium[0].capacity,
                openedDate: stadium[0].opened_date,
                constructionCost: stadium[0].construction_cost,
                visits: visits[0].visits,
            },
            teams: stadium.map(({ team_name, league_name }) => ({
                team_name,
                league: league_name
            })),
            userVisited: userVisited,
            userWishlist: userWishlist
        };

        res.json({ stadiumInfo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  loadStadiumMap  */
const handleLoadStadiumMap = async (req, res) => {
    const { id } = req.body;

    try {
        const [rows] = await db.execute('SELECT stadium_name, street_address, city, state, zip, image, latitude, longitude FROM stadiums WHERE stadium_id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Could not load stadium map' });
        }

        const result = rows[0];

        res.json({ result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  loadStadiums  */
const handleLoadStadiums = async (req, res) => {
    const { league, country, sortBy, username } = req.body;
        
    try {
        let query = `
            SELECT DISTINCT 
                stadiums.stadium_id,
                stadiums.stadium_name, 
                stadiums.image, 
                stadiums.city, 
                stadiums.state,
                stadiums.country_id
                ${username ? `,
                CASE WHEN v.stadium_id IS NOT NULL THEN 1 ELSE 0 END AS visited,
                CASE WHEN w.stadium_id IS NOT NULL THEN 1 ELSE 0 END AS wishlist` : ''}
            FROM stadiums
            JOIN teams ON stadiums.stadium_id = teams.stadium_id
            JOIN leagues ON teams.league_id = leagues.league_id
            JOIN countries ON stadiums.country_id = countries.country_id
            ${username ? `
                LEFT JOIN users u ON u.username = ?
                LEFT JOIN user_stadiums v ON v.stadium_id = stadiums.stadium_id AND v.user_id = u.user_id
                LEFT JOIN user_wishlist_stadiums w ON w.stadium_id = stadiums.stadium_id AND w.user_id = u.user_id` : ''}
            WHERE 1=1
        `;
        
        const params = [];
        if (username) params.push(username);

        const leagueFilter = buildLeagueFilter(league);
        query += leagueFilter.sql;
        params.push(...leagueFilter.params);

        const countryFilter = buildCountryFilter(country);
        query += countryFilter.sql;
        params.push(...countryFilter.params);

        query += buildSortOrder(sortBy, 'stadiums');

        const [stadiums] = await db.query(query, params);
        res.json({ stadiums });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  loadUserEvents  */
const handleLoadUserEvents = async (req, res) => {
    const { username, event, sort } = req.body;
    try {
        const userId = await getUserId(username);

        let userEventStadiums;

        if (event === 'favorite') {
            const [favorites] = await db.execute('SELECT stadiums.stadium_id, stadium_name, city, state, image, ticketmaster_id FROM user_favorite_stadiums JOIN stadiums ON user_favorite_stadiums.stadium_id = stadiums.stadium_id WHERE user_favorite_stadiums.user_id = ?',[userId]);
            userEventStadiums = favorites;
        } else if (event === 'wishlist') {
            const [wishlist] = await db.execute('SELECT stadiums.stadium_id, stadium_name, city, state, image, ticketmaster_id FROM user_wishlist_stadiums JOIN stadiums ON user_wishlist_stadiums.stadium_id = stadiums.stadium_id WHERE user_wishlist_stadiums.user_id = ?', [userId]);
            userEventStadiums = wishlist;
        } else {
            const [all] = await db.execute('SELECT stadiums.stadium_id, stadium_name, city, state, image, ticketmaster_id FROM user_favorite_stadiums JOIN stadiums ON user_favorite_stadiums.stadium_id = stadiums.stadium_id WHERE user_favorite_stadiums.user_id = ? UNION SELECT stadiums.stadium_id, stadium_name, city, state, image, ticketmaster_id FROM user_wishlist_stadiums JOIN stadiums ON user_wishlist_stadiums.stadium_id = stadiums.stadium_id WHERE user_wishlist_stadiums.user_id = ?', [userId, userId]);
            userEventStadiums = all;
        }

        const stadiums = await getNextEvents(userEventStadiums, 3);

        stadiums.sort((a, b) => {
            if (sort === 'date-asc') {
                const timeA = getLocalTimestamp(a);
                const timeB = getLocalTimestamp(b);
                
                if (timeA === null && timeB === null) return a.stadium_name.localeCompare(b.stadium_name);
                if (timeA === null) return 1;
                if (timeB === null) return -1;
                
                if (timeA !== timeB) {
                    return timeA - timeB;
                }
                return a.stadium_name.localeCompare(b.stadium_name);
            } else if (sort === 'name-asc') {
                return a.stadium_name.localeCompare(b.stadium_name);
            } else if (sort === 'name-desc') {
                return b.stadium_name.localeCompare(a.stadium_name);
            } else {
                const timeA = getLocalTimestamp(a);
                const timeB = getLocalTimestamp(b);
                
                if (timeA === null && timeB === null) return a.stadium_name.localeCompare(b.stadium_name);
                if (timeA === null) return 1;
                if (timeB === null) return -1;
                
                if (timeA !== timeB) {
                    return timeB - timeA;
                }
                return a.stadium_name.localeCompare(b.stadium_name);
            }
        });
        
        res.json({ stadiums });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*  searchStadiums  */
const STATE_MAPPING = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY',
    'ontario': 'ON', 'quebec': 'QC', 'british columbia': 'BC', 'alberta': 'AB',
    'manitoba': 'MB', 'saskatchewan': 'SK'
};

const handleSearchStadiums = async (req, res) => {
    const { name } = req.body;
    
    try {
        const searchTerm = `%${name}%`;
        const exactTerm = name;
        
        const lowerSearch = name.toLowerCase();
        const matchedState = Object.keys(STATE_MAPPING).find(stateName => 
            stateName.startsWith(lowerSearch)
        );
        const stateAbbrev = matchedState ? STATE_MAPPING[matchedState] : null;
        
        const query = `
            SELECT DISTINCT s.*,
                CASE 
                    WHEN LOWER(s.stadium_name) = LOWER(?) THEN 1
                    WHEN LOWER(s.city) = LOWER(?) THEN 2
                    WHEN LOWER(t.team_name) = LOWER(?) THEN 3
                    ${stateAbbrev ? `WHEN s.state = ? THEN 3` : ''}
                    WHEN LOWER(s.stadium_name) LIKE LOWER(?) THEN 4
                    WHEN LOWER(s.city) LIKE LOWER(?) THEN 5
                    WHEN LOWER(t.team_name) LIKE LOWER(?) THEN 6
                    ELSE 7
                END as \`rank\`
            FROM stadiums s
            LEFT JOIN teams t ON s.stadium_id = t.stadium_id
            WHERE 
                LOWER(s.stadium_name) LIKE LOWER(?)
                OR LOWER(s.city) LIKE LOWER(?)
                OR LOWER(s.state) LIKE LOWER(?)
                OR LOWER(t.team_name) LIKE LOWER(?)
                ${stateAbbrev ? 'OR s.state = ?' : ''}
            ORDER BY \`rank\`, s.stadium_name
            LIMIT 20
        `;
        
        const params = [
            exactTerm,
            exactTerm,
            exactTerm,
            ...(stateAbbrev ? [stateAbbrev] : []),
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            ...(stateAbbrev ? [stateAbbrev] : [])
        ];

        const [stadiums] = await db.query(query, params);
        
        res.json({ stadiums });
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleLoadAboutInfo, handleLoadFeaturedEvents, handleLoadMapStadiums, handleLoadPopularStadiums, handleLoadStadiumEvents, handleLoadStadiumInfo, handleLoadStadiumMap, handleLoadStadiums, handleLoadUserEvents, handleSearchStadiums };