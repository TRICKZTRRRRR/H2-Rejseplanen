document.getElementById('travel-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;

    try {
        const [originData, destinationData] = await Promise.all([fetchLocation(origin), fetchLocation(destination)]);

        if (!originData) {
            document.getElementById('result').innerText = 'Kunne ikke finde startadressen. Prøv igen.';
            return;
        }
        if (!destinationData) {
            document.getElementById('result').innerText = 'Kunne ikke finde slutadressen. Prøv igen.';
            return;
        }

        const distance = calculateDistance(originData.coordY, originData.coordX, destinationData.coordY, destinationData.coordX);
        const price = calculatePrice(distance);
        const travelTime = calculateTravelTime(distance);
        
        document.getElementById('result').innerHTML = `Afstand: ${distance.toFixed(2)} km<br>Pris: ${price.toFixed(2)} kr<br>Rejsetid: ${travelTime}`;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('result').innerText = 'Der opstod en fejl. Prøv igen.';
    }
});

document.getElementById('origin').addEventListener('input', function() {
    handleInput(this.value, 'origin-suggestions', setOrigin);
});

document.getElementById('destination').addEventListener('input', function() {
    handleInput(this.value, 'destination-suggestions', setDestination);
});

async function handleInput(value, suggestionsId, callback) {
    if (value.length > 2) {
        try {
            const suggestions = await fetchSuggestions(value);
            const suggestionsElement = document.getElementById(suggestionsId);
            suggestionsElement.innerHTML = '';
            suggestions.forEach(suggestion => {
                const li = document.createElement('li');
                li.textContent = suggestion.name;
                li.addEventListener('click', () => {
                    callback(suggestion);
                    suggestionsElement.innerHTML = '';
                });
                suggestionsElement.appendChild(li);
            });
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        document.getElementById(suggestionsId).innerHTML = '';
    }
}

function setOrigin(suggestion) {
    document.getElementById('origin').value = suggestion.name;
}

function setDestination(suggestion) {
    document.getElementById('destination').value = suggestion.name;
}

async function fetchSuggestions(query) {
    const baseUrl = 'http://xmlopen.rejseplanen.dk/bin/rest.exe/location?input=';
    const format = '&format=json';
    const url = baseUrl + encodeURIComponent(query) + format;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.LocationList) {
            let locations = [];
            if (data.LocationList.CoordLocation) {
                locations = locations.concat(data.LocationList.CoordLocation);
            }
            if (data.LocationList.StopLocation) {
                locations = locations.concat(data.LocationList.StopLocation);
            }
            return locations.map(location => ({
                name: location.name,
                coordX: parseFloat(location.x) / 1000000,
                coordY: parseFloat(location.y) / 1000000
            }));
        }
        return [];
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

async function fetchLocation(address) {
    const suggestions = await fetchSuggestions(address);
    return suggestions[0] || null;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
}

function calculatePrice(distance) {
    const pricePerKm = 5; // Example price per kilometer
    return distance * pricePerKm;
}

function calculateTravelTime(distance) {
    const averageSpeed = 50; // Average speed in km/h
    const timeInHours = distance / averageSpeed;
    const hours = Math.floor(timeInHours);
    const minutes = Math.round((timeInHours - hours) * 60);
    return `${hours} timer og ${minutes} minutter`;
}
