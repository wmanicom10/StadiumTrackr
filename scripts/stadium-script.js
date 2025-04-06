window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('stadium');

    try {
        const response = await fetch('http://localhost:3000/stadium/loadStadiumInfo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }
        
        const result = await response.json();

        const stadiumName = document.getElementById('stadium-name');
        stadiumName.innerHTML = name;

        const image = result.stadiumInfo.stadium.image;
        const stadiumImage = document.getElementById('stadium-image');
        stadiumImage.src = image;

        const location = result.stadiumInfo.stadium.location;
        const stadiumLocation = document.getElementById('stadium-location');
        stadiumLocation.innerHTML = location;

        const openedDateSQL = result.stadiumInfo.stadium.openedDate;
        const date = new Date(openedDateSQL);
        const openedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const stadiumOpenedDate = document.getElementById('stadium-opened-date');
        stadiumOpenedDate.innerHTML = openedDate;

        const teamsSQL = result.stadiumInfo.teams;
        const leagueCounts = {};
        teamsSQL.forEach(team => {
            const { league } = team;
            if (leagueCounts[league]) {
                leagueCounts[league] += 1;
            } else {
                leagueCounts[league] = 1;
            }
        });
        const teams = teamsSQL.map(team => team.team_name).join(', ');
        const stadiumTeams = document.getElementById('stadium-teams');
        stadiumTeams.innerHTML = teams;

        const leagueImages = {
            NFL: '../images/icons/football-emoji.png',
            NBA: '../images/icons/basketball-emoji.png',
            MLB: '../images/icons/baseball-emoji.png',
            NHL: '../images/icons/hockey-emoji.png',
            MLS: '../images/icons/soccer-emoji.png'
        };

        const stadiumTeamsInfo = document.getElementById('stadium-teams-info');

        Object.keys(leagueCounts).forEach(league => {
            if (leagueCounts[league] > 0) {
                const img = document.createElement('img');
                img.src = leagueImages[league];
                img.alt = league;
                stadiumTeamsInfo.appendChild(img);
            }
        });

        const capacity = result.stadiumInfo.stadium.capacity;
        const stadiumCapacity = document.getElementById('stadium-capacity');
        stadiumCapacity.innerHTML = capacity;

        const constructionCost = result.stadiumInfo.stadium.constructionCost;
        const stadiumConstructionCost = document.getElementById('stadium-construction-cost');
        stadiumConstructionCost.innerHTML = constructionCost;

        const visits = result.stadiumInfo.stadium.visits;
        const stadiumVisits = document.getElementById('stadium-visits');
        stadiumVisits.innerHTML = visits;

        const averageRating = result.stadiumInfo.stadium.averageRating;
        const stadiumAverageRating = document.getElementById('stadium-average-rating');
        stadiumAverageRating.innerHTML = averageRating === 0 ? "-" : averageRating;

        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('content-wrapper').style.display = 'block';

    } catch (error) {
        alert(error.message);
    }
}