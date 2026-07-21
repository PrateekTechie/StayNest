mapboxgl.accessToken = mapToken;

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/standard",
    center: coordinates,
    zoom: 9
});

map.addControl(new mapboxgl.NavigationControl());
map.scrollZoom.disable();

map.on("style.load", () => {
    map.setFog({});
});

const marker = new mapboxgl.Marker({ color: "#FF385C" })
    .setLngLat(coordinates)
    .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="staynest-popup">
                <div class="popup-header">
                    <i class="fa-solid fa-people-roof popup-icon"></i>
                    <span class="popup-title">StayNest</span>
                </div>

                <h6>${listingLocation}</h6>
                <p>Exact location will be shared after booking.</p>
            </div>
        `)
    )
    .addTo(map);