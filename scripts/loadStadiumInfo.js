export async function loadStadiumInfo(name) {
    try {
        const stadiumRef = database.ref(`stadiums/${name}`);
        const snapshot = await stadiumRef.once('value');

        if (snapshot.exists()) {
            const data = snapshot.val();
            const image = data.image;
            const location = data.location ? data.location : "";
            const capacity = data.capacity ? data.capacity : "0";
            const teams = data.teams ? data.teams : "";
            const openedDate = data.opened_date ? data.opened_date : "";
            const constructionCost = data.construction_cost ? data.construction_cost : "0";

            const stadiumName = document.getElementById('stadium-name');
            const stadiumImage = document.getElementById('stadium-image');
            const stadiumLocation = document.getElementById('stadium-location');
            const stadiumCapacity = document.getElementById('stadium-capacity');
            const stadiumTeams = document.getElementById('stadium-teams');
            const stadiumOpenedDate = document.getElementById('stadium-opened-date');
            const stadiumConstructionCost = document.getElementById('stadium-construction-cost');

            stadiumName.innerHTML = name;
            stadiumImage.src = image;
            stadiumLocation.innerHTML = location;
            stadiumCapacity.innerHTML = capacity;
            stadiumTeams.innerHTML = teams;
            stadiumOpenedDate.innerHTML = openedDate;
            stadiumConstructionCost.innerHTML = constructionCost;

            const stadiumInformationContainer = document.querySelector('.stadium-information-container');
            stadiumInformationContainer.style.display = 'block';
        }

    } catch (error) {
        console.error('Error loading stadium information:', error);
    }
}