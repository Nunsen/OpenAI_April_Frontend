import { GOOGLE_MAPS_API_KEY } from './config.js'; // Din nøgle

// Klikhåndtering
document.getElementById('sendBtn').addEventListener('click', () => {
    const userInput = document.getElementById('input').value;

    fetch('http://localhost:8080/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput })
    })
        .then(res => res.json())
        .then(data => {
            const aiReply = data.reply;
            document.getElementById('output').textContent = aiReply;

            const cities = extractCitiesFromReply(aiReply);
            console.log("Fundne byer:", cities);

            if (cities.length === 0) {
                alert("Ingen specifikke byer fundet 😢");
                return;
            }

            loadMapWithPins(cities);
        })
        .catch(err => {
            document.getElementById('output').textContent = "Noget gik galt 😢";
            console.error(err);
        });
});
//Hvad der skal pinnes på Google maps (den lytter efter /byer i rejsen"
function extractCitiesFromReply(reply) {
    const match = reply.match(/Byer i rejsen:\s*((?:- .+\n?)+)/);
    if (!match) return [];

    const lines = match[1].split('\n');
    const cities = lines
        .map(line => line.replace(/^- /, '').trim())
        .filter(city => city.length > 0);

    return cities;
}


// Loader Google Maps med pins + ruteplanlægger mellem pins'ene + sætter rækkefølgen af destinationerne
function loadMapWithPins(cities) {
    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
        zoom: 2
    });

    const geocoder = new google.maps.Geocoder();
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true }); // Vi laver egne pins
    directionsRenderer.setMap(map);

    const waypoints = [];
    const markers = [];

    let origin = null;
    let destination = null;

    const geocodeCity = (index) => {
        if (index >= cities.length) {
            if (origin && destination) {
                directionsService.route({
                    origin: origin,
                    destination: destination,
                    waypoints: waypoints,
                    travelMode: google.maps.TravelMode.DRIVING
                }, (result, status) => {
                    if (status === "OK") {
                        directionsRenderer.setDirections(result);
                    } else {
                        console.error("Ruteplanlægning fejlede:", status);
                    }
                });
            }
            return;
        }

        const city = cities[index];
        geocoder.geocode({ address: city }, (results, status) => {
            if (status === "OK" && results[0]) {
                const location = results[0].geometry.location;

                new google.maps.Marker({
                    map,
                    position: location,
                    title: city,
                    label: `${index + 1}`
                });

                if (index === 0) {
                    origin = location;
                } else if (index === cities.length - 1) {
                    destination = location;
                } else {
                    waypoints.push({ location: location, stopover: true });
                }

                map.setCenter(location);
                map.setZoom(5);

                geocodeCity(index + 1);
            } else {
                console.warn("Kunne ikke finde:", city);
                geocodeCity(index + 1); // Forsøg næste by
            }
        });
    };

    geocodeCity(0);
}


// Loader Google Maps script automatisk
const script = document.createElement('script');
script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
script.async = true;
document.head.appendChild(script);
