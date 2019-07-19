import WebMap = require('esri/WebMap');
import FeatureLayer = require('esri/layers/FeatureLayer');
import GraphicsLayer = require('esri/layers/GraphicsLayer');
import MapView = require('esri/views/MapView');

import { setupUmassMenu } from 'app/events';
import { umassLongLat } from 'app/latLong';
import { updateRenderers, updateLabeling } from 'app/rendering';
import { resetUrlTimer, updateAppFromUrl } from 'app/url';

import MainNavigation = require('app/widgets/MainNavigation');
import { Marker, Markers } from 'app/widgets/Markers';
import CustomPopup = require('app/widgets/CustomPopup');
import CustomSearch = require('app/widgets/CustomSearch');
import Feedback = require('app/widgets/Feedback');

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

  const searches = [
    new CustomSearch({
      view: view,
      name: 'directions-origin',
      placeholder: 'Origin',
      required: true
    }),
    new CustomSearch({
      view: view,
      name: 'directions-destination',
      placeholder: 'Destination',
      required: true
    }),
    new CustomSearch({
      view: view,
      name: 'pedestrian-directions-origin',
      placeholder: 'Origin',
      required: true
    }),
    new CustomSearch({
      view: view,
      name: 'pedestrian-directions-destination',
      placeholder: 'Destination',
      required: true
    })
  ];

  const markers = [
    {
      color: '#63ef4a',
      annotation: 'Driving Origin',
      search: searches.filter((search) => {
        return search.name === 'directions-origin';
      })[0]
    }, {
      color: '#ef4a63',
      annotation: 'Driving Destination',
      search: searches.filter((search) => {
        return search.name === 'directions-destination';
      })[0]
    }, {
      color: '#63ef4a',
      annotation: 'Walking Origin',
      search: searches.filter((search) => {
        return search.name === 'pedestrian-directions-origin';
      })[0]
    }, {
      color: '#ef4a63',
      annotation: 'Walking Destination',
      search: searches.filter((search) => {
        return search.name === 'pedestrian-directions-destination';
      })[0]
    }, {
      color: '#881c1c',
      popup: popup
    }
  ];

  /*
    Create the main navigation widget.
    The main navigation widget is the box that contains most of the
    other widgets.
  */
  const mainNavigation = new MainNavigation({
    view: view, popup: popup, searches: searches
  });

  // Create the markers widget which manages all the markers on the map
  const markersWidget = new Markers({ view: view, markers: markers });

  // Add markers behind everything
  view.ui.add(markersWidget, 'manual');
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

  // Catch drag and drop events by setting the search of the appropriate marker
  document.getElementById('viewDiv').addEventListener('drop', (event) => {
    markersWidget.setSearch(
      event.dataTransfer.getData('search-id'),
      view.toMap({ x: event.layerX, y: event.layerY })
    );
  });
  // Allow elements to be dragged over the map
  document.getElementById('viewDiv').addEventListener('dragover', (event) => {
    event.preventDefault();
  });
})
  .otherwise((error) => console.error(error));
