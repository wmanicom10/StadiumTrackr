require('dotenv').config({ path: '../.env' });
const db = require('./connection.js');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function matchStadiumsToTicketmaster() {
    const [stadiums] = await db.execute('SELECT stadium_id, stadium_name FROM stadiums WHERE ticketmaster_id IS NULL');
    
    const unmatched = [];
    const potentialMismatches = [];
    const matched = [];

    for (const stadium of stadiums) {
        try {
            const response = await fetch(
                `https://app.ticketmaster.com/discovery/v2/venues.json?keyword=${encodeURIComponent(stadium.stadium_name)}&countryCode=US&apikey=${process.env.TICKETMASTER_API_KEY}`
            );
            const data = await response.json();
            
            if (data._embedded?.venues?.length > 0) {
                const venue = data._embedded.venues.reduce((best, current) => {
                    const bestTotal = best.upcomingEvents?._total || 0;
                    const currentTotal = current.upcomingEvents?._total || 0;
                    return currentTotal > bestTotal ? current : best;
                });

                const namesMatch = venue.name.toLowerCase().trim() === stadium.stadium_name.toLowerCase().trim();
                
                console.log(`DB: ${stadium.stadium_name}`);
                console.log(`TM: ${venue.name}`);
                console.log(`Match: ${namesMatch ? '✓' : '✗'}`);
                console.log('');

                if (namesMatch) {
                    await db.execute(
                        'UPDATE stadiums SET ticketmaster_id = ? WHERE stadium_id = ?',
                        [venue.id, stadium.stadium_id]
                    );
                    matched.push(stadium.stadium_name);
                } else {
                    potentialMismatches.push({
                        yourName: stadium.stadium_name,
                        ticketmasterName: venue.name,
                        ticketmasterId: venue.id,
                        upcomingEvents: venue.upcomingEvents?._total || 0
                    });
                }
            } else {
                console.log(`DB: ${stadium.stadium_name}`);
                console.log(`TM: No match found`);
                console.log(`Match: ✗`);
                console.log('');
                unmatched.push(stadium.stadium_name);
            }

            await delay(250);
        } catch (error) {
            console.error(`Error matching ${stadium.stadium_name}:`, error.message);
            unmatched.push(stadium.stadium_name);
        }
    }

    console.log(`\n✓ Matched and saved: ${matched.length}`);
    
    console.log(`\n⚠ Potential mismatches (${potentialMismatches.length}) — verify and update manually:`);
    potentialMismatches.forEach(m => {
        console.log(`  DB name:           ${m.yourName}`);
        console.log(`  Ticketmaster name: ${m.ticketmasterName}`);
        console.log(`  ID:                ${m.ticketmasterId}`);
        console.log(`  Upcoming events:   ${m.upcomingEvents}`);
        console.log('');
    });

    console.log(`\n✗ No match found (${unmatched.length}) — add ticketmaster_id manually:`);
    unmatched.forEach(name => console.log(`  ${name}`));

    await db.end();
    process.exit(0);
}

matchStadiumsToTicketmaster();