export async function addStadium(league, name, location, date) {
    // replace with mysql logic to add a stadium for a user

    const username = localStorage.getItem('username')
    const userRef = firebase.database().ref(`users/${username}`);
    
    try {
        const snapshot = await userRef.once('value');
        const data = snapshot.val();

        const newStadium = {
            name: name,
            location: location, 
            date_visited: date,
            league: league
        };

        let updateData = {};

        if (data && data.stadiums_visited) {
            data.stadiums_visited.push(newStadium);
        }
        else {
            data.stadiums_visited = [newStadium];
        }
        updateData.stadiums_visited = data.stadiums_visited;

        switch (league) {
            case "NFL":
                if (data && data.nfl_stadiums) {
                    data.nfl_stadiums.push(newStadium);
                }
                else {
                    data.nfl_stadiums = [newStadium];
                }
                updateData.nfl_stadiums = data.nfl_stadiums;
                break;
            case "NBA":
                if (data && data.nba_stadiums) {
                    data.nba_stadiums.push(newStadium);
                }
                else {
                    data.nba_stadiums = [newStadium];
                }
                updateData.nba_stadiums = data.nba_stadiums;
                break;
            case "MLB":
                if (data && data.mlb_stadiums) {
                    data.mlb_stadiums.push(newStadium);
                }
                else {
                    data.mlb_stadiums = [newStadium];
                }
                updateData.mlb_stadiums = data.mlb_stadiums;
                break;
        }

        await userRef.update(updateData);

        alert("Stadium added successfully");

        window.location.reload();
    } catch (error) {
        console.error("Error: ", error);
    }
}