let map;
let autocomplete;
// let addresses = [];
let geocoder;
let directionsService;
let directionsRenderer;

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 21.1698, lng: 72.8306 },
        zoom: 10,
    });

    initAutocomplete();
    geocoder = new google.maps.Geocoder();
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map: map });

    fetchAddressesFromDatabase();
    loadData();
}

function initAutocomplete() {
    autocomplete = new google.maps.places.Autocomplete(
        document.getElementById('addressInput'),
        { types: ['geocode'] }
    );
}

async function fetchAddressesFromDatabase() {
    try {
        const response = await fetch('/addresses');
        if (!response.ok) {
            throw new Error('Failed to fetch addresses from the database');
        }
        const data = await response.json();
        if (data && Array.isArray(data)) {
            // Iterate through addresses and mark them on the map
            data.forEach(addressData => {
                const address = addressData.address;
                geocodeAddress(address);
            });
        }
    } catch (error) {
        console.error('Error fetching addresses:', error);
    }
}

async function markLocation() {
    const address = document.getElementById("addressInput").value;
    geocodeAddress(address);
}

let addressLocations = [];



async function geocodeAddress(address) {
    geocoder.geocode({ address: address }, function (results, status) {
        if (status === "OK") {
            const location = results[0].geometry.location;
            const marker = new google.maps.Marker({
                position: location,
                map: map,
                title: address
            });
            map.setCenter(location);

            addressLocations.push({ address: address, location: location });
            fetch('/addresses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    address: address,
                    latitude: location.lat(),
                    longitude: location.lng()
                })
            })
                .then(response => {
                    loadData();
                    if (response.ok) {

                    } else {
                        console.error('Failed to add address');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });


        } else {
            alert("Geocode was not successful for the following reason: " + status);
        }
    });
}



async function generateRoute() {
    const response = await fetch('/addresses');
    const data = await response.json();
    let addresses = data.map(d => ({
        address: d.address,
        latitude: d.latitude,
        longitude: d.longitude
    }));

    // console.log(addresses[0])

    if (addresses.length < 2) {
        alert("Please add at least two addresses.");
        return;
    }

    // findShortestRoute(addresses)
    addresses = await findShortestRoute(addresses);

    const waypoints = addresses.map(address => {
        const location = address.address;
        return { location: location, stopover: true };
    });

    const request = {
        origin: waypoints.shift().location,
        destination: waypoints.pop().location,
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING
    };



    directionsService.route(request, function (response, status) {
        if (status === "OK") {
            directionsRenderer.setDirections(response);
        } else {
            alert("Directions request failed due to " + status);
        }
    });
}

function loadData() {
    document.getElementById('dropdown').innerHTML = ''
    fetch('/addresses')
        .then(response => response.json())
        .then(data => {
            const dropdown = document.getElementById('dropdown');
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.text = item.address;
                dropdown.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching data:', error));
}


const markAsVisitedBtn = document.getElementById('markAsVisitedBtn');
markAsVisitedBtn.addEventListener('click', markAsVisited);

function markAsVisited() {
    const dropdown = document.getElementById('dropdown');
    const selectedOption = dropdown.options[dropdown.selectedIndex];

    if (!selectedOption) {
        console.error('No option selected');
        return;
    }

    const selectedId = selectedOption.value;

    fetch(`/markAsVisited/${selectedId}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (response.ok) {
                initMap();

            } else {
                console.error('Failed to mark address as visited');
            }
        })
        .catch(error => {
            console.error('Error marking address as visited:', error);
        });

}


async function findShortestRoute(addresses) {
    if (addresses.length < 2) {
        return addresses;
    }

    // Start with the first address
    const shortestRoute = [addresses.shift()];

    // Iterate until all addresses are processed
    while (addresses.length > 0) {
        let shortestDistance = Infinity;
        let nearestAddress = null;

        // Find the nearest address to the last address in the shortest route
        for (const address of addresses) {
            try {
                const distance = await calculateDistance(shortestRoute[shortestRoute.length - 1], address);
                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestAddress = address;
                }
            } catch (error) {
                console.error('Error calculating distance:', error);
                throw error;
            }
        }

        // Add the nearest address to the shortest route
        shortestRoute.push(nearestAddress);
        // Remove the added address from the remaining addresses
        addresses.splice(addresses.indexOf(nearestAddress), 1);
    }

    return shortestRoute;
}


// Function to generate permutations of an array
function permute(array) {
    const result = [];

    const permuteHelper = (arr, current) => {
        if (arr.length === 0) {
            result.push(current);
            return;
        }

        for (let i = 0; i < arr.length; i++) {
            const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
            permuteHelper(remaining, current.concat([arr[i]]));
        }
    };

    permuteHelper(array, []);

    return result;
}

async function calculateDistance(location1, location2) {
    try {
        const lat1 = location1.latitude;
        const lon1 = location1.longitude;
        const lat2 = location2.latitude;
        const lon2 = location2.longitude;

        const R = 6371; // Radius of the Earth in kilometers
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in kilometers

        return distance;
    } catch (error) {
        console.error('Error calculating distance:', error);
        throw error;
    }
}

// Helper function to convert degrees to radians
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}