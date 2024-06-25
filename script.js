document.getElementById('travel-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;

    Promise.all([fetchLocation(origin), fetchLocation(destination)])
        .then(locations => {
            const [originData, destinationData] = locations;

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
            document.getElementById('result').innerText = `Afstand: ${distance.toFixed(2)} km, Pris: ${price.toFixed(2)} kr`;
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('result').innerText = 'Der opstod en fejl. Prøv igen.';
        });
});

document.getElementById('origin').addEventListener('input', function() {
    handleInput(this.value, 'origin-suggestions', setOrigin);
});

document.getElementById('destination').addEventListener('input', function() {
    handleInput(this.value, 'destination-suggestions', setDestination);
});

function handleInput(value, suggestionsId, callback) {
    if (value.length > 2) {
        fetchSuggestions(value).then(suggestions => {
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
        });
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

function fetchSuggestions(query) {
    const baseUrl = 'http://xmlopen.rejseplanen.dk/bin/rest.exe/location?input=';
    const format = '&format=json';
    const url = baseUrl + encodeURIComponent(query) + format;

    return fetch(url)
        .then(response => response.json())
        .then(data => {
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
        })
        .catch(error => {
            console.error('Error:', error);
            return [];
        });
}

function fetchLocation(address) {
    return fetchSuggestions(address)
        .then(suggestions => suggestions[0] || null);
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
