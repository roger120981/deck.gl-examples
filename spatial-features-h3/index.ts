import './style.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import {Deck} from '@deck.gl/core';
import {H3TileLayer, h3QuerySource, BASEMAP, colorBins} from '@deck.gl/carto';
import { initSelectors } from './selectorUtils';

const cartoConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  accessToken: import.meta.env.VITE_API_ACCESS_TOKEN,
  connectionName: 'carto_dw'
};

const INITIAL_VIEW_STATE = {
  latitude: 40.7128, // Aproximado para Nueva York
  longitude: -74.006, // Aproximado para Nueva York
  zoom: 7,
  pitch: 0,
  bearing: 0,
  minZoom: 3.5,
  maxZoom: 15
};

// Selectors
let selectedVariable = 'population';

const variableSelector = document.getElementById('variable') as HTMLSelectElement;
variableSelector?.addEventListener('change', () => {
  selectedVariable = variableSelector.value;
  render();
});

function render() {
  const source = h3QuerySource({
    ...cartoConfig,
    aggregationExp: `SUM(${selectedVariable}) as value`,
    sqlQuery: `SELECT * FROM cartobq.public_account.derived_spatialfeatures_usa_h3int_res8_v1_yearly_v2`
  });

  const layers = [
    new H3TileLayer({
      id: 'h3_layer',
      data: source,
      opacity: 0.8,
      pickable: true,
      extruded: false,
      getFillColor: colorBins({
        attr: 'value',
        domain: [0, 100, 1000, 2000, 3000, 4000, 5000, 6000],
        colors: 'PinkYl'
      }),
      lineWidthMinPixels: 0.5,
      getLineWidth: 0.5,
      getLineColor: [255, 255, 255, 100]
    })
  ];

  deck.setProps({
    layers,
    getTooltip: ({object}) =>
      object && {
        html: `Hex ID: ${object.id}</br>${selectedVariable.toUpperCase()}: ${parseInt(
          object.properties.value
        )}`
      }
  });
}

// Main execution
const map = new maplibregl.Map({
  container: 'map',
  style: BASEMAP.DARK_MATTER,
  interactive: false
});

const deck = new Deck({
  canvas: 'deck-canvas',
  initialViewState: INITIAL_VIEW_STATE,
  controller: true
});
deck.setProps({
  onViewStateChange: ({viewState}) => {
    const {longitude, latitude, ...rest} = viewState;
    map.jumpTo({center: [longitude, latitude], ...rest});
  }
});

initSelectors();
render();