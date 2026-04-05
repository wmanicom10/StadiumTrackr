const db = require('../database/connection.js');

const handleLoadUpcomingEvents = async (req, res) => {
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
};

module.exports = { handleLoadUpcomingEvents };