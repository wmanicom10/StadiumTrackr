const db = require('../database/connection.js');
const { getUserId } = require('../database/dbHelpers.js');

async function getNextEvents(stadiums) {
    async function fetchWithRetry(url, retries = 3, delay = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                return data;
            } catch (error) {                
                if (i === retries - 1) {
                    throw error;
                }
                
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
            }
        }
    }
 
    const results = await Promise.all(
        stadiums.map(async (stadium) => {
            if (!stadium.ticketmaster_id) return null;
 
            try {
                const url = `https://app.ticketmaster.com/discovery/v2/events.json?classificationName=sports&sort=date,asc&venueId=${stadium.ticketmaster_id}&apikey=${process.env.TICKETMASTER_API_KEY}`;
                const data = await fetchWithRetry(url);
                
                const events = data._embedded?.events || [];
                const nextEvent = events[0] || null;
 
                return {
                    stadium_id: stadium.stadium_id,
                    stadium_name: stadium.stadium_name,
                    city: stadium.city,
                    state: stadium.state,
                    nextEvent: nextEvent ? {
                        ...nextEvent,
                        dates: {
                            ...nextEvent.dates,
                            timezone: nextEvent.dates?.timezone
                        }
                    } : null
                };
            } catch (error) {
                console.error(`Failed to fetch events for ${stadium.stadium_name} after retries:`, error.message);
                return null;
            }
        })
    );
 
    const filteredResults = results.filter(r => r !== null && r.nextEvent !== null);
 
    return filteredResults;
}

const handleLoadLoggedInEvents = async (req, res) => {
    const { username, event, sort } = req.body;
    try {
        const userId = await getUserId(username);

        let userEventStadiums;

        if (event === 'favorite') {
            const [favorites] = await db.execute('SELECT stadiums.stadium_id, stadium_name, city, state, ticketmaster_id FROM user_favorite_stadiums JOIN stadiums ON user_favorite_stadiums.stadium_id = stadiums.stadium_id WHERE user_favorite_stadiums.user_id = ?',[userId]);
            userEventStadiums = favorites;
        } else if (event === 'wishlist') {
            const [wishlist] = await db.execute('SELECT stadiums.stadium_id, stadium_name, city, state, ticketmaster_id FROM user_wishlist_stadiums JOIN stadiums ON user_wishlist_stadiums.stadium_id = stadiums.stadium_id WHERE user_wishlist_stadiums.user_id = ?', [userId]);
            userEventStadiums = wishlist;
        } else {
            const [all] = await db.execute('SELECT stadiums.stadium_id, stadium_name, city, state, ticketmaster_id FROM user_favorite_stadiums JOIN stadiums ON user_favorite_stadiums.stadium_id = stadiums.stadium_id WHERE user_favorite_stadiums.user_id = ? UNION SELECT stadiums.stadium_id, stadium_name, city, state, ticketmaster_id FROM user_wishlist_stadiums JOIN stadiums ON user_wishlist_stadiums.stadium_id = stadiums.stadium_id WHERE user_wishlist_stadiums.user_id = ?', [userId, userId]);
            userEventStadiums = all;
        }

        const stadiums = await getNextEvents(userEventStadiums);

        stadiums.sort((a, b) => {
            const getLocalTimestamp = (stadium) => {
                const dateTime = stadium.nextEvent.dates.start.dateTime;
                const localDate = stadium.nextEvent.dates.start.localDate;
                const timezone = stadium.nextEvent.dates?.timezone;
                
                if (dateTime) {
                    const utcDate = new Date(dateTime);
                    
                    if (timezone) {
                        const localTimeStr = utcDate.toLocaleString('en-US', { 
                            timeZone: timezone,
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                        });
                        
                        return new Date(localTimeStr).getTime();
                    }
                    
                    return utcDate.getTime();
                } else if (localDate) {
                    const [year, month, day] = localDate.split('-').map(Number);
                    const date = new Date(year, month - 1, day, 23, 59, 59, 999);
                    return date.getTime();
                }
                return null;
            };

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

const handleLoadLoggedOutEvents = async (req, res) => {
    try {
        const [popularStadiums] = await db.execute('SELECT s.stadium_id, s.stadium_name, s.city, s.state, s.ticketmaster_id, COUNT(DISTINCT us.user_id) + COUNT(DISTINCT w.user_id) AS popularity FROM stadiums s LEFT JOIN user_stadiums us ON us.stadium_id = s.stadium_id LEFT JOIN user_wishlist_stadiums w ON w.stadium_id = s.stadium_id GROUP BY s.stadium_id, s.stadium_name, s.city, s.state, s.ticketmaster_id ORDER BY popularity DESC, s.stadium_name ASC LIMIT 3');
        
        res.json({ stadiums: await getNextEvents(popularStadiums) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const handleLoadStadiumEvents = async (req, res) => {
    const { id } = req.body;
    try {
        const [[stadium]] = await db.execute(
            'SELECT ticketmaster_id FROM stadiums WHERE stadium_id = ?', [id]
        );

        if (!stadium || !stadium.ticketmaster_id) {
            return res.json({ events: [] });
        }

        async function fetchWithRetry(url, retries = 3, delay = 1000, timeout = 8000) {
            for (let i = 0; i < retries; i++) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), timeout);

                    const response = await fetch(url, { signal: controller.signal });
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    return data;
                } catch (error) {
                    const isTimeout = error.name === 'AbortError';
                    const errorMsg = isTimeout ? 'Request timed out' : error.message;
                    console.error(`Attempt ${i + 1} failed: ${errorMsg}`);
                    
                    if (i === retries - 1) {
                        throw new Error(errorMsg);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
                }
            }
        }

        const url = `https://app.ticketmaster.com/discovery/v2/events.json?classificationName=sports&sort=date,asc&venueId=${stadium.ticketmaster_id}&apikey=${process.env.TICKETMASTER_API_KEY}`;
        const data = await fetchWithRetry(url);
        const events = data._embedded?.events || [];

        events.sort((a, b) => {
            const getLocalTimestamp = (event) => {
                const dateTime = event.dates?.start?.dateTime;
                const localDate = event.dates?.start?.localDate;
                const timezone = event.dates?.timezone;
                
                if (dateTime) {
                    const utcDate = new Date(dateTime);
                    
                    if (timezone) {
                        const localTimeStr = utcDate.toLocaleString('en-US', { 
                            timeZone: timezone,
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                        });
                        return new Date(localTimeStr).getTime();
                    }
                    
                    return utcDate.getTime();
                } else if (localDate) {
                    const [year, month, day] = localDate.split('-').map(Number);
                    const date = new Date(year, month - 1, day, 23, 59, 59, 999);
                    return date.getTime();
                }
                return null;
            };

            const timeA = getLocalTimestamp(a);
            const timeB = getLocalTimestamp(b);
            
            if (timeA === null && timeB === null) return 0;
            if (timeA === null) return 1;
            if (timeB === null) return -1;
            
            return timeA - timeB;
        });

        res.json({ events });
    
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { handleLoadLoggedInEvents, handleLoadLoggedOutEvents, handleLoadStadiumEvents };