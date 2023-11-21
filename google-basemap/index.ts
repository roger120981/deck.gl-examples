import './style.css';
import {GoogleMapsOverlay as DeckOverlay} from '@deck.gl/google-maps';
import {colorCategories} from '@deck.gl/carto';
import {VectorTileLayer, vectorQuerySource} from '@deck.gl/carto';
import {Loader} from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const accessToken = import.meta.env.VITE_API_ACCESS_TOKEN;
const connectionName = 'carto_dw';
const cartoConfig = {apiBaseUrl, accessToken, connectionName};

let map: google.maps.Map | null = null;
let overlay = new DeckOverlay({
  layers: []
});


const formatNumber = number =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(number);

function setTooltip({x, y, object}) {
  const tooltip = document.getElementById('tooltip');
  if (object && tooltip) {
    tooltip.style.display = 'block';
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
    tooltip.innerHTML = `<div style="padding: 8px">Continent: ${object.properties.continent_name}</br>Country: ${object.properties.country_name}</br>Population: ${object.properties.pop_2015}</div>`;
  } else if (tooltip) {
    tooltip.style.display = 'none';
  }
}

function getColorForContinent() {
  return colorCategories({
    attr: 'continent_name',
    domain: ['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'],
    colors: [
      [117, 68, 92],
      [175, 100, 88],
      [213, 167, 91],
      [115, 111, 76],
      [91, 120, 142],
      [76, 78, 143]
    ]
  });
}

function render() {
  const source = vectorQuerySource({
    ...cartoConfig,
    sqlQuery: `SELECT geom, country_name, continent_name, pop_2015 FROM cartobq.public_account.world_population_2015 WHERE pop_2015 between @min and @max ORDER BY pop_2015 DESC`,
    queryParameters: {
      min: Number(1),
      max: selectedMaxPopulation
    }
  });

  const layers = [
    new VectorTileLayer({
      id: 'population',
      data: source,
      opacity: 1,
      pickable: true,
      getFillColor: getColorForContinent(),
      getLineColor: [0, 0, 0, 204],
      pointRadiusUnits: 'pixels',
      getPointRadius: d => (30.0 * Math.sqrt(d.properties.pop_2015)) / 27620.2642999664,
      lineWidthMinPixels: 1,
      onHover: setTooltip
    })
  ];

  overlay.setProps({
    layers: layers
  });
}

let selectedMaxPopulation = 800000000;
const selectedPopulationSelector = document.querySelector<HTMLSelectElement>('#population-slider');
const populationLabel = document.getElementById('slider-value');
populationLabel!.textContent = formatNumber(selectedMaxPopulation);

selectedPopulationSelector?.addEventListener('change', () => {
  selectedMaxPopulation = Number(selectedPopulationSelector.value);
  populationLabel!.textContent = formatNumber(selectedMaxPopulation);

  render();
});

const basemapSelectorButtons = document.querySelectorAll('.basemap-button');

basemapSelectorButtons!.forEach(button => {
  button.addEventListener('click', async () => {
    const id = button.getAttribute('data-map-id');
    const type = button.getAttribute('data-type');

    basemapSelectorButtons!.forEach(button => {
      button.classList.remove('selected');
    });

    if (type === 'google') {
      map.setMapTypeId(id);
    } else {
      const _map = map;
      const {Map} = (await google.maps.importLibrary('maps')) as google.maps.MapsLibrary;
      map = new Map(document.getElementById('map') as HTMLElement, {
        center: {lat: _map.center.lat(), lng: _map.center.lng()},
        zoom: _map.zoom,
        mapId: id,
        mapType: 'gmaps',
        mapTypeControl: false,
        streetViewControl: false,
        disableDefaultUI: true
      });
      
      
      // This breaks the map
      overlay.setMap(map);
    }

    button.classList.add('selected');
  });
});

selectedPopulationSelector!.oninput = function () {
  populationLabel!.textContent = formatNumber((this as HTMLInputElement).value);
};

const loader = new Loader({
  apiKey: GOOGLE_MAPS_API_KEY,
  version: 'weekly'
});

loader.load().then(async () => {
  const {Map} = (await google.maps.importLibrary('maps')) as google.maps.MapsLibrary;
  map = new Map(document.getElementById('map') as HTMLElement, {
    center: {lat: 15, lng: 10},
    zoom: 3,
    mapTypeId: 'roadmap', 
    mapTypeControl: false,
    streetViewControl: false,
    disableDefaultUI: true
  });

  overlay.setMap(map);

  render();
});
