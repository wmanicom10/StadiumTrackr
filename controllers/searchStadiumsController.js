const db = require('../database/connection.js');

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

module.exports = { handleSearchStadiums };