import WebMap = require('esri/WebMap');
import FeatureLayer = require('esri/layers/FeatureLayer');
import GraphicsLayer = require('esri/layers/GraphicsLayer');
import MapView = require('esri/views/MapView');

import { setupUmassMenu } from 'app/events';
import { umassLongLat } from 'app/latLong';
import { updateRenderers, updateLabeling } from 'app/rendering';
import { resetUrlTimer, updateAppFromUrl } from 'app/url';

import MainNavigation = require('app/widgets/MainNavigation');
import CustomPopup = require('app/widgets/CustomPopup');
import Feedback = require('app/widgets/Feedback');
import PopupPointer = require('app/widgets/PopupPointer');

// Set up the UMass link menu
setupUmassMenu();

// Set the map to load data from our ArcGIS Online web map
const map = new WebMap({
  portalItem: {
    id: '15298012bff94b1482cf3fee6277fad8'
  }
});

const view = new MapView({
  container: 'viewDiv',
  // Start the map centered on UMass
  center: umassLongLat,
  constraints: {
    maxZoom: 20
  },
  zoom: 16,
  map: map,
  // Tell the view to only load the attribution widget by default
  ui: {
    components: ['attribution']
  },
  // Don't use the default popups
  popup: null
});

// Wait until the view has loaded before loading the widgets
view.when(() => {
  // Layer for directions
  map.add(new GraphicsLayer({
    title: 'Directions'
  }));
  // Layer for direction selection
  map.add(new GraphicsLayer({
    title: 'Directions Selection'
  }));
  // Layer for popup feature selection
  map.add(new GraphicsLayer({
    title: 'Selection'
  }));

  // Hide the lots layer
  map.layers.find((layer) => {
    return layer.title === 'Lots';
  }).visible = false;

  // Ensure that the section layer shows up when zoomed in to max
  (map.layers.find((layer) => {
    return layer.title === 'Sections';
  }) as FeatureLayer).maxScale = 500;

  // Set custom icons in the layer renderers
  updateRenderers(map);
  // Set labels on layers
  updateLabeling(map);

  /*
    Create the popup for the main navigation, which the popup pointer
    also needs to reference.
  */
  const popup = new CustomPopup({ view: view });

  /*
    Create the main navigation widget.
    The main navigation widget is the box that contains most of the
    other widgets.
  */
  const mainNavigation = new MainNavigation({ view: view, popup: popup });

  const popupPointer = new PopupPointer({ view: view, popup: popup });

  // Add popup pointer behind everything
  view.ui.add(popupPointer, 'manual');
  // Add the feedback widget to the bottom right
  view.ui.add(new Feedback(), 'bottom-right');
  // Add the main navigation widget to the map
  view.ui.add(mainNavigation, 'manual');

  // Update the url when the feature for URL changes
  popup.watch('featureForUrl', () => {
    resetUrlTimer(mainNavigation);
  });

  // Set the initial app params from the url
  updateAppFromUrl(mainNavigation);
  // Set the url hash based on the initial view
  resetUrlTimer(mainNavigation);
  // Update the position of the view when the url hash changes
  window.addEventListener('hashchange', () => { updateAppFromUrl(mainNavigation) });
  // Update the url hash when the position of the view changes
  view.watch(['center', 'zoom', 'rotation'], () => { resetUrlTimer(mainNavigation) });

  document.getElementById('viewDiv').addEventListener('drop', (event) => {
    console.log(event);
    console.log(event.dataTransfer.getData('search-id'));
  })
  document.getElementById('viewDiv').addEventListener('dragover', (event) => {
    event.preventDefault();
  })
})
  .otherwise((error) => console.error(error));
