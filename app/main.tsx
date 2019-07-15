import WebMap = require('esri/WebMap');
import FeatureLayer = require('esri/layers/FeatureLayer');
import GraphicsLayer = require('esri/layers/GraphicsLayer');
import MapView = require('esri/views/MapView');
import Compass = require('esri/widgets/Compass');
import Home = require('esri/widgets/Home');
import Locate = require('esri/widgets/Locate');
import Print = require('esri/widgets/Print');

import MainNavigation = require('app/widgets/MainNavigation');
import BasemapPicker = require('app/widgets/BasemapPicker');
import CustomDirections = require('app/widgets/CustomDirections');
import CustomFilter = require('app/widgets/CustomFilter');
import CustomLayerList = require('app/widgets/CustomLayerList');
import CustomPopup = require('app/widgets/CustomPopup');
import CustomSearch = require('app/widgets/CustomSearch');
import CustomPedestrianDirections = require('app/widgets/CustomPedestrianDirections');
import CustomWindow = require('app/widgets/CustomWindow');
import { CustomZoom, ZoomDirection } from 'app/widgets/CustomZoom';
import Feedback = require('app/widgets/Feedback');
import PopupPointer = require('app/widgets/PopupPointer');
import ShareEmail = require('app/widgets/ShareEmail');
import ShareLink = require('app/widgets/ShareLink');
import WindowExpand = require('app/widgets/WindowExpand');
import { setupUmassMenu } from 'app/events';
import { homeGoToOverride, umassLongLat } from 'app/latLong';
import { updateRenderers, updateLabeling } from 'app/rendering';
import { resetUrlTimer, updateAppFromUrl } from 'app/url';

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
    We will give this to both the layer window and the custom filter, that
    way the custom filter can filter based on this widget.
  */
  const layerList = new CustomLayerList({
    view: view
  });

  const basemapPicker = new BasemapPicker({
    view: view
  })

  // Create a layer window that will be hidden until opened by a window expand
  const layersWindow = new CustomWindow({
    name: 'layers',
    iconName: 'layers',
    useTabs: false,
    widgets: [
      {
        label: 'Layers',
        widget: layerList
      },
      {
        label: 'Basemap',
        widget: basemapPicker
      }
    ]
  });

  const customDirections = new CustomDirections({
    startSearch: new CustomSearch({
      view: view,
      name: 'directions-origin',
      placeholder: 'Origin',
      required: true
    }),
    endSearch: new CustomSearch({
      view: view,
      name: 'directions-destination',
      placeholder: 'Destination',
      required: true
    })
  });

  const customPedestrianDirections = new CustomPedestrianDirections({
    view: view,
    startSearch: new CustomSearch({
      view: view,
      name: 'pedestrian-directions-origin',
      placeholder: 'Origin',
      required: true
    }),
    endSearch: new CustomSearch({
      view: view,
      name: 'pedestrian-directions-destination',
      placeholder: 'Destination',
      required: true
    })
  });

  /*
    Create a directions window that will be hidden until opened by a
    window expand.
  */
  const directionsWindow = new CustomWindow({
    name: 'directions',
    iconName: 'directions',
    useTabs: true,
    widgets: [
      {
        label: 'Driving directions',
        widget: customDirections
      },
      {
        label: 'Walking directions',
        widget: customPedestrianDirections
      }
    ]
  });

  // Create a share window that will be hidden until opened by a window expand
  const shareWindow = new CustomWindow({
    name: 'share',
    iconName: 'link',
    useTabs: false,
    widgets: [
      {
        label: 'Share link',
        widget: new ShareLink()
      }, {
        label: 'Email',
        widget: new ShareEmail()
      }, {
        label: 'Print',
        widget: new Print({
          view: view,
          printServiceUrl: 'https://maps.umass.edu/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task'
        })
      }
    ]
  });

  const customFilter = new CustomFilter({
    view: view,
    layerList: layerList
  });

  /*
    Every window needs to know about the other windows, that way a single
    window can close the other windows when it needs to open.
  */
  const customWindows = [layersWindow, directionsWindow, shareWindow];

  const popup = new CustomPopup({view: view});

  /*
    Create the main navigation widget.
    The main navigation widget is the box that contains most of the
    other widgets.
  */
  const mainNavigation = new MainNavigation({
    view: view,
    compass: new Compass({
      view: view
    }),
    directionsExpand: new WindowExpand({
      name: 'directions',
      iconName: 'directions',
      window: directionsWindow,
      windows: customWindows
    }),
    home: new Home({
      view: view,
      goToOverride: homeGoToOverride
    }),
    layersExpand: new WindowExpand({
      name: 'layers',
      iconName: 'layers',
      window: layersWindow,
      windows: customWindows
    }),
    locate: new Locate({
      view: view
    }),
    zoomIn: new CustomZoom({
      view: view,
      direction: ZoomDirection.In
    }),
    zoomOut: new CustomZoom({
      view: view,
      direction: ZoomDirection.Out
    }),
    search: new CustomSearch({
      view: view,
      name: 'main',
      placeholder: 'Search the map',
      customFilter: customFilter,
      mainSearch: true
    }),
    customFilter: customFilter,
    shareExpand: new WindowExpand({
      name: 'share',
      iconName: 'link',
      window: shareWindow,
      windows: customWindows
    }),
    customWindows: customWindows,
    popup: popup
  });

  const popupPointer = new PopupPointer({view: view, popup: popup});

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
  // Update the url when the basemap changes
  basemapPicker.watch('basemapId', () => { resetUrlTimer(mainNavigation) });

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
  .otherwise((error) => console.warn(error));
