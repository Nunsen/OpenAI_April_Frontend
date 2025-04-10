import { GOOGLE_MAPS_API_KEY } from './config.js';

let messages = [];

document.getElementById('sendBtn').addEventListener('click', () => {
    const userInput = document.getElementById('input').value;
    if (!userInput) return;

    // Ryd input og opdater placeholder
    document.getElementById('input').value = "";
    document.getElementById('input').placeholder = "Nogle tilføjelser?";

    // Tilføj brugerens besked til samtalen
    messages.push({ role: "user", content: userInput });

    fetch('http://localhost:8080/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })


    })
        .then(res => res.json())
        .then(data => {
            const aiReply = data.reply;
            document.getElementById('output').textContent = aiReply;

            // Tilføj AI’ens svar til samtalen
            messages.push({ role: "assistant", content: aiReply });

            // Udtræk byer og vis på kort
            const cities = extractCitiesFromReply(aiReply);
            console.log("Fundne byer:", cities);

            if (cities.length > 0) {
                loadMapWithPins(cities);
            } else {
                console.warn("Ingen byer fundet i svaret.");
            }
        })
        .catch(err => {
            document.getElementById('output').textContent = "Noget gik galt 😢";
            console.error("Fejl:", err);
        });
});

// Matcher byer fra AI-svaret under overskriften "Byer i rejsen:"
function extractCitiesFromReply(reply) {
    const match = reply.match(/Byer i rejsen:\s*((?:- .+\n?)+)/);
    if (!match) return [];

    return match[1]
        .split('\n')
        .map(line => line.replace(/^- /, '').trim())
        .filter(city => city.length > 0);
}

// Google Maps – rute og markører
function loadMapWithPins(cities) {
    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
        zoom: 2
    });

    const geocoder = new google.maps.Geocoder();
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true });
    directionsRenderer.setMap(map);

    const waypoints = [];
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

                if (index === 0) origin = location;
                else if (index === cities.length - 1) destination = location;
                else waypoints.push({ location: location, stopover: true });

                map.setCenter(location);
                map.setZoom(5);

                geocodeCity(index + 1);
            } else {
                console.warn("Kunne ikke finde:", city);
                geocodeCity(index + 1);
            }
        });
    };

    geocodeCity(0);
}

// Loader Google Maps script automatisk
const script = document.createElement('script');
script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
script.async = true;
document.head.appendChild(script);

// Nulstil-knap
document.getElementById('resetBtn').addEventListener('click', () => {
    messages = []; // nulstil samtale
    document.getElementById('input').value = "";
    document.getElementById('input').placeholder = "Fx: En romantisk ferie i Italien";
    document.getElementById('output').textContent = "";

    // Genskab kortet tomt
    const oldMap = document.getElementById('map');
    const newMap = document.createElement('div');
    newMap.id = 'map';
    oldMap.replaceWith(newMap);
});
